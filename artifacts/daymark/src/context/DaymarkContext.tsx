import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityEvent, DaymarkSnapshot, PlanningMode, Task } from '@/src/types';
import {
  cancelAllTaskReminders,
  cancelTaskReminders,
  getLocalDateKey,
  getReminderPermission,
  ReminderPermissionState,
  reconcileTaskReminders,
  requestReminderPermission,
} from '@/src/notifications';
import { isTaskOnDate, reconcileTasks } from '@/src/taskRollover';

const STORAGE_KEY = '@daymark/snapshot-v1';

const today = getLocalDateKey();
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const starterTasks: Task[] = [
  {
    id: 'starter-focus',
    title: 'Review Q3 priorities',
    mode: 'daily',
    status: 'open',
    section: 'Focus',
    scheduledDate: today,
    createdAt: new Date().toISOString(),
    notes: 'Choose the three outcomes that matter most this week.',
  },
  {
    id: 'starter-move',
    title: 'Walk for 30 minutes',
    mode: 'daily',
    status: 'completed',
    section: 'Wellbeing',
    scheduledDate: today,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'starter-weekly',
    title: 'Plan next week',
    mode: 'weekly',
    status: 'open',
    section: 'Planning',
    scheduledDate: today,
    createdAt: new Date().toISOString(),
    recurrence: 'Every Sunday',
  },
  {
    id: 'starter-monthly',
    title: 'Read 2 books',
    mode: 'monthly',
    status: 'open',
    section: 'Growth',
    scheduledDate: today,
    createdAt: new Date().toISOString(),
    recurrence: 'Monthly target',
  },
];

const starterActivity: ActivityEvent[] = [
  {
    id: 'starter-event',
    taskId: 'starter-move',
    taskTitle: 'Walk for 30 minutes',
    type: 'completed',
    timestamp: new Date().toISOString(),
    detail: 'Completed today',
  },
];

interface DaymarkContextValue {
  tasks: Task[];
  activity: ActivityEvent[];
  hydrated: boolean;
  todayTasks: Task[];
  openTasks: Task[];
  completedToday: number;
  completionPercent: number;
  remindersEnabled: boolean;
  reminderPermission: ReminderPermissionState;
  toggleTask: (taskId: string) => void;
  addTask: (input: Pick<Task, 'title' | 'mode' | 'section' | 'notes' | 'recurrence' | 'reminderEnabled'>) => Task;
  updateTask: (taskId: string, input: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  requestReminderPermission: () => Promise<ReminderPermissionState>;
  getTask: (taskId: string) => Task | undefined;
}

const DaymarkContext = createContext<DaymarkContextValue | null>(null);

function eventFor(task: Task, type: ActivityEvent['type'], detail: string): ActivityEvent {
  return {
    id: makeId(),
    taskId: task.id,
    taskTitle: task.title,
    type,
    timestamp: new Date().toISOString(),
    detail,
  };
}

function rolloverEvents(
  rollovers: ReturnType<typeof reconcileTasks>['rollovers'],
  timestamp: string,
): ActivityEvent[] {
  return rollovers.map(({ task, fromDate, toDate }) => ({
    id: makeId(),
    taskId: task.id,
    taskTitle: task.title,
    type: 'rolled_over',
    timestamp,
    detail: `Carried forward from ${fromDate} to ${toDate}`,
  }));
}

export function DaymarkProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [remindersEnabled, setRemindersEnabledState] = useState(true);
  const [reminderPermission, setReminderPermission] = useState<ReminderPermissionState>('unknown');
  const [todayKey, setTodayKey] = useState(today);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as DaymarkSnapshot;
          const now = new Date();
          const reconciled = reconcileTasks(parsed.tasks ?? starterTasks, getLocalDateKey(now), now.toISOString());
          setTasks(reconciled.tasks);
          setActivity([...rolloverEvents(reconciled.rollovers, now.toISOString()), ...(parsed.activity ?? starterActivity)]);
          setRemindersEnabledState(parsed.remindersEnabled ?? true);
        } else {
          const now = new Date();
          const reconciled = reconcileTasks(starterTasks, getLocalDateKey(now), now.toISOString());
          setTasks(reconciled.tasks);
          setActivity([...rolloverEvents(reconciled.rollovers, now.toISOString()), ...starterActivity]);
          setRemindersEnabledState(true);
        }
      })
      .catch(() => {
        const now = new Date();
        const reconciled = reconcileTasks(starterTasks, getLocalDateKey(now), now.toISOString());
        setTasks(reconciled.tasks);
        setActivity([...rolloverEvents(reconciled.rollovers, now.toISOString()), ...starterActivity]);
        setRemindersEnabledState(true);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, activity, remindersEnabled })).catch(() => undefined);
  }, [activity, hydrated, remindersEnabled, tasks]);

  const todayTasks = useMemo(() => tasks.filter((task) => isTaskOnDate(task, todayKey)), [tasks, todayKey]);
  const openTasks = useMemo(() => todayTasks.filter((task) => task.status === 'open'), [todayTasks]);
  const completedToday = todayTasks.filter((task) => task.status === 'completed').length;
  const completionPercent = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  const reconcileReminders = useCallback(async () => {
    if (!hydrated) return;
    const permission = await getReminderPermission();
    setReminderPermission(permission);
    await reconcileTaskReminders(tasks, remindersEnabled, new Date(), permission);
  }, [hydrated, remindersEnabled, tasks]);

  const reconcileTaskDates = useCallback((date = new Date()) => {
    const dateKey = getLocalDateKey(date);
    const rolledAt = date.toISOString();
    const reconciled = reconcileTasks(tasks, dateKey, rolledAt);
    setTodayKey(dateKey);
    if (!reconciled.rollovers.length) return;
    setTasks(reconciled.tasks);
    setActivity((events) => [...rolloverEvents(reconciled.rollovers, rolledAt), ...events]);
  }, [tasks]);

  useEffect(() => {
    if (!hydrated) return;
    reconcileTaskDates();
    reconcileReminders().catch(() => undefined);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      reconcileTaskDates();
      reconcileReminders().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [hydrated, reconcileReminders, reconcileTaskDates]);

  const requestReminderPermissionForUser = useCallback(async () => {
    const permission = await requestReminderPermission();
    setReminderPermission(permission);
    await reconcileTaskReminders(tasks, remindersEnabled, new Date(), permission).catch(() => undefined);
    return permission;
  }, [remindersEnabled, tasks]);

  const setRemindersEnabled = (enabled: boolean) => {
    setRemindersEnabledState(enabled);
    if (!enabled) cancelAllTaskReminders().catch(() => undefined);
  };

  const toggleTask = (taskId: string) => {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) return;
    const completing = currentTask.status !== 'completed';
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const next = {
          ...task,
          status: completing ? 'completed' : 'open',
          completedAt: completing ? new Date().toISOString() : undefined,
        } as Task;
        setActivity((events) => [
          eventFor(next, completing ? 'completed' : 'undone', completing ? 'Completed today' : 'Marked as open again'),
          ...events,
        ]);
        Haptics.impactAsync(completing ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        return next;
      }),
    );
    if (completing) cancelTaskReminders(taskId).catch(() => undefined);
  };

  const addTask = (input: Pick<Task, 'title' | 'mode' | 'section' | 'notes' | 'recurrence' | 'reminderEnabled'>) => {
    const task: Task = {
      id: makeId(),
      title: input.title.trim(),
      mode: input.mode,
      status: 'open',
      section: input.section.trim() || 'Unsorted',
      scheduledDate: getLocalDateKey(),
      createdAt: new Date().toISOString(),
      notes: input.notes?.trim(),
      recurrence: input.recurrence,
      reminderEnabled: input.reminderEnabled,
    };
    setTasks((current) => [task, ...current]);
    setActivity((events) => [eventFor(task, 'created', 'Added to your plan'), ...events]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    return task;
  };

  const updateTask = (taskId: string, input: Partial<Task>) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const next = { ...task, ...input };
        setActivity((events) => [eventFor(next, 'edited', 'Task details updated'), ...events]);
        return next;
      }),
    );
  };

  const deleteTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    setTasks((current) => current.filter((item) => item.id !== taskId));
    if (task) setActivity((events) => [eventFor(task, 'edited', 'Task removed'), ...events]);
    cancelTaskReminders(taskId).catch(() => undefined);
  };

  const value = {
    tasks,
    activity,
    hydrated,
    todayTasks,
    openTasks,
    completedToday,
    completionPercent,
    remindersEnabled,
    reminderPermission,
    toggleTask,
    addTask,
    updateTask,
    deleteTask,
    setRemindersEnabled,
    requestReminderPermission: requestReminderPermissionForUser,
    getTask: (taskId: string) => tasks.find((task) => task.id === taskId),
  };

  return <DaymarkContext.Provider value={value}>{children}</DaymarkContext.Provider>;
}

export function useDaymark() {
  const context = useContext(DaymarkContext);
  if (!context) throw new Error('useDaymark must be used inside DaymarkProvider');
  return context;
}

export function formatMode(mode: PlanningMode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}