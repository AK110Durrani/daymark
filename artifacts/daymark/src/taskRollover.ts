import type { Task } from '@/src/types';

export interface TaskRolloverResult {
  tasks: Task[];
  rollovers: Array<{
    task: Task;
    fromDate: string;
    toDate: string;
  }>;
}

/**
 * The task's original scheduledDate is intentionally immutable during a
 * rollover. The latest history entry is the date on which the task currently
 * lives in the plan.
 */
export function getTaskCurrentDate(task: Task): string {
  return task.rolloverHistory?.[task.rolloverHistory.length - 1]?.toDate ?? task.scheduledDate;
}

export function isTaskOverdue(task: Task, dateKey: string): boolean {
  return task.status === 'open' && getTaskCurrentDate(task) < dateKey;
}

export function isTaskOnDate(task: Task, dateKey: string): boolean {
  const currentDate = getTaskCurrentDate(task);
  return currentDate === dateKey || isTaskOverdue(task, dateKey);
}

function reconcileTask(task: Task, dateKey: string, rolledAt: string) {
  if (task.status !== 'open') {
    return { task, rollover: undefined };
  }

  const fromDate = getTaskCurrentDate(task);
  if (fromDate >= dateKey) {
    return { task, rollover: undefined };
  }

  const rollover = {
    fromDate,
    toDate: dateKey,
    rolledAt,
  };

  return {
    task: {
      ...task,
      // Keep the first date visible even after the task has been carried
      // forward many times.
      overdueFrom: task.overdueFrom ?? task.scheduledDate,
      rolloverHistory: [...(task.rolloverHistory ?? []), rollover],
    },
    rollover: {
      task,
      fromDate,
      toDate: dateKey,
    },
  };
}

export function reconcileTasks(tasks: Task[], dateKey: string, rolledAt = new Date().toISOString()): TaskRolloverResult {
  const rollovers: TaskRolloverResult['rollovers'] = [];
  const nextTasks = tasks.map((task) => {
    const result = reconcileTask(task, dateKey, rolledAt);
    if (result.rollover) rollovers.push(result.rollover);
    return result.task;
  });

  return { tasks: nextTasks, rollovers };
}