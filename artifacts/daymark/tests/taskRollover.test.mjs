import assert from 'node:assert/strict';
import test from 'node:test';
import { getTaskCurrentDate, isTaskOnDate, reconcileTasks } from '../src/taskRollover.ts';

const baseTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Finish the draft',
  mode: 'daily',
  status: 'open',
  section: 'Focus',
  scheduledDate: '2026-09-10',
  createdAt: '2026-09-10T08:00:00.000Z',
  ...overrides,
});

test('rolls an open task forward without changing its identity or original date', () => {
  const task = baseTask();
  const result = reconcileTasks([task], '2026-09-11', '2026-09-11T09:00:00.000Z');
  const next = result.tasks[0];

  assert.equal(next.id, task.id);
  assert.equal(next.scheduledDate, '2026-09-10');
  assert.equal(next.overdueFrom, '2026-09-10');
  assert.equal(getTaskCurrentDate(next), '2026-09-11');
  assert.deepEqual(next.rolloverHistory, [
    { fromDate: '2026-09-10', toDate: '2026-09-11', rolledAt: '2026-09-11T09:00:00.000Z' },
  ]);
  assert.deepEqual(result.rollovers.map(({ task: rolledTask, fromDate, toDate }) => ({ id: rolledTask.id, fromDate, toDate })), [
    { id: task.id, fromDate: '2026-09-10', toDate: '2026-09-11' },
  ]);
});

test('continues rolling the same task indefinitely, one record per reconciliation date', () => {
  const task = baseTask();
  const first = reconcileTasks([task], '2026-09-11', '2026-09-11T09:00:00.000Z').tasks[0];
  const second = reconcileTasks([first], '2026-09-12', '2026-09-12T09:00:00.000Z').tasks[0];
  const third = reconcileTasks([second], '2026-09-13', '2026-09-13T09:00:00.000Z').tasks[0];

  assert.equal(third.id, task.id);
  assert.equal(third.scheduledDate, task.scheduledDate);
  assert.equal(third.overdueFrom, task.scheduledDate);
  assert.equal(getTaskCurrentDate(third), '2026-09-13');
  assert.deepEqual(third.rolloverHistory?.map(({ fromDate, toDate }) => ({ fromDate, toDate })), [
    { fromDate: '2026-09-10', toDate: '2026-09-11' },
    { fromDate: '2026-09-11', toDate: '2026-09-12' },
    { fromDate: '2026-09-12', toDate: '2026-09-13' },
  ]);
  assert.equal(reconcileTasks([third], '2026-09-13').rollovers.length, 0);
});

test('jumps directly to a changed current date without creating duplicate tasks', () => {
  const task = baseTask();
  const result = reconcileTasks([task], '2026-09-15', '2026-09-15T09:00:00.000Z');
  const next = result.tasks[0];

  assert.equal(result.tasks.length, 1);
  assert.equal(next.id, task.id);
  assert.equal(next.rolloverHistory?.length, 1);
  assert.equal(getTaskCurrentDate(next), '2026-09-15');
  assert.equal(isTaskOnDate(next, '2026-09-15'), true);
  assert.equal(isTaskOnDate(next, '2026-09-16'), true);
});

test('does not roll completed tasks or move future tasks', () => {
  const completed = baseTask({ status: 'completed', completedAt: '2026-09-11T10:00:00.000Z' });
  const future = baseTask({ id: 'task-2', scheduledDate: '2026-09-20' });
  const result = reconcileTasks([completed, future], '2026-09-15', '2026-09-15T09:00:00.000Z');

  assert.deepEqual(result.tasks, [completed, future]);
  assert.equal(result.rollovers.length, 0);
});