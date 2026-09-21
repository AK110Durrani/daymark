import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Task } from '@/src/types';
import { getTaskCurrentDate } from '@/src/taskRollover';

export const REMINDER_CHANNEL_ID = 'daymark-hourly-reminders';
export const REMINDER_START_HOUR = 9;
export const REMINDER_END_HOUR = 18;

const MANAGED_NOTIFICATION_TYPE = 'daymark-hourly-reminder';

export type ReminderPermissionState =
  | 'unknown'
  | 'granted'
  | 'not-determined'
  | 'denied'
  | 'blocked'
  | 'unavailable';

type ManagedNotificationData = {
  type?: string;
  taskId?: string;
  title?: string;
  dateKey?: string;
  hour?: number;
  fireAt?: number;
};

const isNative = Platform.OS !== 'web';

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function isPermissionGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

function permissionState(permission: Notifications.NotificationPermissionsStatus): ReminderPermissionState {
  if (isPermissionGranted(permission)) return 'granted';
  if (permission.status === 'undetermined') return 'not-determined';
  return permission.canAskAgain ? 'denied' : 'blocked';
}

export async function getReminderPermission(): Promise<ReminderPermissionState> {
  if (!isNative) return 'unavailable';

  try {
    return permissionState(await Notifications.getPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export async function requestReminderPermission(): Promise<ReminderPermissionState> {
  if (!isNative) return 'unavailable';

  try {
    await configureNotificationChannel();
    return permissionState(
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      }),
    );
  } catch {
    return 'unavailable';
  }
}

export async function configureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Hourly reminders',
    description: 'Reminders for tasks you explicitly choose to revisit during the day.',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

function getManagedData(request: Notifications.NotificationRequest): ManagedNotificationData {
  return request.content.data as ManagedNotificationData;
}

function getReminderKey(taskId: string, dateKey: string, hour: number): string {
  return `${taskId}:${dateKey}:${hour}`;
}

function createLocalHour(date: Date, hour: number): Date | null {
  const localHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0);
  // A spring-forward transition can remove a local hour. Do not let Date normalize
  // that missing hour into a different reminder time.
  if (
    localHour.getFullYear() !== date.getFullYear() ||
    localHour.getMonth() !== date.getMonth() ||
    localHour.getDate() !== date.getDate() ||
    localHour.getHours() !== hour
  ) {
    return null;
  }
  return localHour;
}

function getDesiredNotifications(tasks: Task[], remindersEnabled: boolean, now: Date) {
  if (!remindersEnabled) return [];

  const dateKey = getLocalDateKey(now);
  const desired: Array<{ key: string; task: Task; fireAt: Date; hour: number }> = [];

  for (const task of tasks) {
    if (
      !task.reminderEnabled ||
      task.status !== 'open' ||
      getTaskCurrentDate(task) !== dateKey ||
      task.overdueFrom
    ) {
      continue;
    }

    for (let hour = REMINDER_START_HOUR; hour < REMINDER_END_HOUR; hour += 1) {
      const fireAt = createLocalHour(now, hour);
      if (!fireAt || fireAt <= now) continue;
      desired.push({
        key: getReminderKey(task.id, dateKey, hour),
        task,
        fireAt,
        hour,
      });
    }
  }

  return desired;
}

async function cancelManagedNotifications(
  requests: Notifications.NotificationRequest[],
  predicate: (data: ManagedNotificationData) => boolean,
): Promise<void> {
  await Promise.all(
    requests
      .filter((request) => predicate(getManagedData(request)))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

let notificationQueue = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = notificationQueue.then(operation, operation);
  notificationQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function reconcileTaskReminders(
  tasks: Task[],
  remindersEnabled: boolean,
  now = new Date(),
  permission: ReminderPermissionState = 'granted',
): Promise<void> {
  return enqueue(async () => {
    if (!isNative) return;

    await configureNotificationChannel();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const managed = scheduled.filter((request) => getManagedData(request).type === MANAGED_NOTIFICATION_TYPE);
    const desired = permission === 'granted' ? getDesiredNotifications(tasks, remindersEnabled, now) : [];
    const desiredByKey = new Map(desired.map((item) => [item.key, item]));
    const retainedKeys = new Set<string>();

    for (const request of managed) {
      const data = getManagedData(request);
      const key =
        data.taskId && data.dateKey && typeof data.hour === 'number'
          ? getReminderKey(data.taskId, data.dateKey, data.hour)
          : undefined;
      const desiredItem = key ? desiredByKey.get(key) : undefined;
      const isCurrent =
        key !== undefined &&
        desiredItem !== undefined &&
        data.title === desiredItem.task.title &&
        data.fireAt === desiredItem.fireAt.getTime() &&
        !retainedKeys.has(key);

      if (isCurrent && key) {
        retainedKeys.add(key);
      } else {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }

    await Promise.all(
      desired
        .filter((item) => !retainedKeys.has(item.key))
        .map((item) =>
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'A small moment for your plan',
              body: item.task.title,
              data: {
                type: MANAGED_NOTIFICATION_TYPE,
                taskId: item.task.id,
                title: item.task.title,
                dateKey: getLocalDateKey(item.fireAt),
                hour: item.hour,
                fireAt: item.fireAt.getTime(),
                timeZone: getLocalTimeZone(),
              },
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: item.fireAt,
              channelId: REMINDER_CHANNEL_ID,
            },
          }),
        ),
    );
  });
}

export function cancelTaskReminders(taskId: string): Promise<void> {
  return enqueue(async () => {
    if (!isNative) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await cancelManagedNotifications(scheduled, (data) => data.taskId === taskId);
  });
}

export function cancelAllTaskReminders(): Promise<void> {
  return enqueue(async () => {
    if (!isNative) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await cancelManagedNotifications(scheduled, (data) => data.type === MANAGED_NOTIFICATION_TYPE);
  });
}

export async function openNotificationSettings(): Promise<void> {
  if (!isNative) return;
  try {
    await Linking.openSettings();
  } catch {
    // Settings availability is controlled by the operating system.
  }
}