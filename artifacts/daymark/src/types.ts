export type PlanningMode = 'daily' | 'weekly' | 'monthly';
export type TaskStatus = 'open' | 'completed';

export interface TaskRollover {
  fromDate: string;
  toDate: string;
  rolledAt: string;
}

export interface Task {
  id: string;
  title: string;
  mode: PlanningMode;
  status: TaskStatus;
  section: string;
  scheduledDate: string;
  createdAt: string;
  completedAt?: string;
  overdueFrom?: string;
  rolloverHistory?: TaskRollover[];
  notes?: string;
  reminderEnabled?: boolean;
  recurrence?: string;
}

export interface ActivityEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'created' | 'completed' | 'undone' | 'rolled_over' | 'edited';
  timestamp: string;
  detail: string;
}

export interface DaymarkSnapshot {
  tasks: Task[];
  activity: ActivityEvent[];
  remindersEnabled?: boolean;
}