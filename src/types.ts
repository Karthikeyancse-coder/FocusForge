export type Theme = 'light' | 'dark';

export interface UserState {
  id: string;
  name: string;
  email?: string;
  xp: number;
  level: number;
  streakCount: number;
  forgivenessWindowOpenUntil: string;
  historicalLagByCategory: Record<string, number>;
  busyBlocks: { start: string; end: string }[];
  characterClass: string;
  tasksCompletedToday?: number;
  focusMinutesToday?: number;
  hasSeenOnboarding?: boolean;
  activeTimer?: {
    taskId: string;
    durationSeconds: number;
    startTimestamp: number;
    isPaused: boolean;
    pauseStartTimestamp: number | null;
    accumulatedPauseMs: number;
    modeName: string;
  };
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'create' | 'update' | 'complete' | 'delete' | 'schedule';
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  colorTheme?: string;
  inviteCode: string;
  ownerId?: string; // added ownerId
  isArchived?: boolean;
  pinnedBy?: string[];
  members: { 
    userId: string; 
    displayName: string; 
    role?: 'Owner' | 'Admin' | 'Member' | 'Viewer';
    joinedAt?: string;
  }[];
  settings?: {
    permissions?: {
      createTasks: 'All' | 'AdminOnly' | 'OwnerOnly';
      editTasks: 'All' | 'AdminOnly' | 'OwnerOnly';
      deleteTasks: 'All' | 'AdminOnly' | 'OwnerOnly';
      inviteMembers: 'All' | 'AdminOnly' | 'OwnerOnly';
    };
  };
}

export interface Task {
  id: string;
  taskId?: string; // Unified taskId (maps to id)
  workspaceId?: string | null;
  title: string;
  description?: string;
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Overdue'; // Unified status
  priority?: 'Critical' | 'High' | 'Medium' | 'Low'; // Unified priority
  startDate?: string; // Unified startDate
  endDate?: string; // Unified endDate (maps to deadline)
  estimatedHours?: number; // Unified estimatedHours (maps to estimatedEffortHours)
  loggedHours?: number; // Unified loggedHours
  createdFrom?: 'Quest' | 'Calendar' | 'Workspace' | 'AI Strategy' | 'Recovery Mission'; // Unified createdFrom
  completedAt?: string | null; // Unified completedAt (maps to realityState.completedAt)
  category: string;
  focusType?: string;
  isPinned?: boolean;
  failureImpact?: 'Low' | 'Medium' | 'High' | 'Critical';
  subtasks?: { id: string; title: string; completed: boolean }[];
  createdAt?: string;
  deadline?: string;
  estimatedEffortHours: number;

  // New fields for recurrence and advanced options
  taskType?: 'One-Time' | 'Daily Habit' | 'Weekly Task' | 'Custom Schedule';
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
  expectedOutcome?: string;
  dailyGoalDurationMinutes?: number;
  habitStreak?: number;
  weeklyDays?: string[];
  weeklyGoal?: string;
  customDays?: string[];
  repeatRules?: string;

  importance: {
    aiSuggested: 'Critical' | 'High' | 'Medium' | 'Low';
    userOverride: 'Critical' | 'High' | 'Medium' | 'Low' | null;
    final: 'Critical' | 'High' | 'Medium' | 'Low';
  };
  plannedState: {
    expectedProgressCurve: { date: string; expectedPercent: number }[];
    plannedWorkBlocks: { start: string; end: string; stepName?: string }[];
  };
  realityState: {
    confirmedPercent: number;
    inferredPercent: number;
    effectivePercent: number;
    lastConfirmedAt: string | null;
    focusSessions: { date: string; durationMinutes: number }[];
    completedAt: string | null;
    completedRetroactively: boolean;
  };
  riskEngine: {
    riskScore: number;
    riskTier: 'Green' | 'Yellow' | 'Red';
    breakdown: { progressGap: number; urgency: number; historicalLagBias: number; workloadDensity: number };
    completionProbability: number;
    uncertaintyFlag: boolean;
  };
  flaggedForHelp?: boolean;
  priorityScore: number;
  recoveryPlan: {
    status: 'none' | 'proposed' | 'accepted' | 'infeasible';
    proposedSchedule: { date: string; start: string; end: string }[] | null;
    extensionDraft: string | null;
  };
  acceptAndLearn?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  duration: number; // in minutes
  repeatPattern: "Daily" | "Weekly" | "Monthly" | "Yearly" | "Custom";
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  color?: string;
  completedDates: string[]; // YYYY-MM-DD
  streak: number;
  longestStreak: number;
  xpPerCompletion: number;
  workspaceId?: string | null;
  ownerId?: string;
  createdAt: string;
  updatedAt?: string;
}