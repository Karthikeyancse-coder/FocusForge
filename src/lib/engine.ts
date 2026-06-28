import { Task, UserState } from "../types";

export function calculateTaskMetrics(
  task: Task,
  userState: UserState,
  allTasks: Task[],
): Task {
  if (task.workspaceId) {
    // Workspace tasks don't have deadlines or risk metrics
    return {
      ...task,
      taskId: task.id,
      status: task.status || 'Pending',
      priorityScore: 0,
      riskEngine: {
        riskScore: 0,
        riskTier: 'Green',
        breakdown: {
          progressGap: 0,
          urgency: 0,
          historicalLagBias: 0,
          workloadDensity: 0
        },
        completionProbability: 100,
        uncertaintyFlag: false
      }
    };
  }

  const now = new Date();

  const effectivePercent = Math.max(
    task.realityState.confirmedPercent,
    task.realityState.inferredPercent
  );

  // 1. UNIQUE PROGRESS GAP: Calculate expected percent purely from this task's plannedWorkBlocks
  let totalPlannedElapsedMs = 0;
  let totalPlannedMs = 0;
  for (const b of task.plannedState.plannedWorkBlocks || []) {
    const bs = new Date(b.start).getTime();
    const be = new Date(b.end).getTime();
    const duration = Math.max(0, be - bs);
    totalPlannedMs += duration;
    if (bs < now.getTime()) {
      totalPlannedElapsedMs += Math.min(
        duration,
        Math.max(0, now.getTime() - bs),
      );
    }
  }

  // If no planned blocks exist yet, fallback to the expectedProgressCurve
  let expectedPercent = getExpectedProgress(
    task.plannedState.expectedProgressCurve,
    now,
  );
  if (totalPlannedMs > 0) {
    expectedPercent = (totalPlannedElapsedMs / totalPlannedMs) * 100;
  }

  const progressGap = Math.max(0, expectedPercent - effectivePercent);
  const normalizedProgressGap = Math.min(100, progressGap);

  const deadline = new Date(task.deadline);
  const totalHoursRemaining = Math.max(
    0,
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60),
  );

  const requiredEffortRemaining = Math.max(
    0,
    task.estimatedEffortHours * (1 - effectivePercent / 100),
  );

  const daysRemaining = totalHoursRemaining / 24;

  // 2. UNIQUE URGENCY: Specific available capacity for this task
  let overlappingBusyHours = 0;
  for (const block of userState.busyBlocks || []) {
    const blockStart = new Date(block.start).getTime();
    const blockEnd = new Date(block.end).getTime();
    const overlapStart = Math.max(now.getTime(), blockStart);
    const overlapEnd = Math.min(deadline.getTime(), blockEnd);
    if (overlapEnd > overlapStart) {
      overlappingBusyHours += (overlapEnd - overlapStart) / (1000 * 60 * 60);
    }
  }

  // Also subtract OTHER tasks' planned blocks before this task's deadline
  let otherPlannedHours = 0;
  for (const t of allTasks) {
    if (t.id !== task.id) {
      for (const b of t.plannedState.plannedWorkBlocks || []) {
        const bs = new Date(b.start).getTime();
        const be = new Date(b.end).getTime();
        const overlapStart = Math.max(now.getTime(), bs);
        const overlapEnd = Math.min(deadline.getTime(), be);
        if (overlapEnd > overlapStart) {
          otherPlannedHours += (overlapEnd - overlapStart) / (1000 * 60 * 60);
        }
      }
    }
  }

  const baselineCapacityHours = daysRemaining * 8; // Assumes 8 focus hours a day max
  let availableRemainingCapacity = Math.max(
    0,
    baselineCapacityHours - overlappingBusyHours - otherPlannedHours,
  );

  let completionProbability = 1;
  if (requiredEffortRemaining > 0) {
    completionProbability = Math.min(
      1,
      availableRemainingCapacity / requiredEffortRemaining,
    );
  }

  let urgencyPressure = 100 - completionProbability * 100;
  if (urgencyPressure < 0) urgencyPressure = 0;
  if (urgencyPressure > 100) urgencyPressure = 100;

  // 3. UNIQUE LAG: Scale base category lag by the task's individual past extensions/misses or its scale
  let baseLag = userState.historicalLagByCategory[task.category] || 0;
  // If the task has 0 effective percent but it's close to deadline, that itself implies lag for this task
  const lagMultiplier = expectedPercent > 0 ? (expectedPercent / 100) * 1.5 : 1;
  const historicalLagBias = Math.min(100, Math.max(0, baseLag * lagMultiplier));

  // 4. UNIQUE WORKLOAD: Sum of required effort for other tasks that have active deadlines BEFORE this task's deadline
  let competingWorkloadRemaining = 0;
  for (const t of allTasks) {
    if (t.id !== task.id) {
      const tDeadline = new Date(t.deadline).getTime();
      // If the other task is due before this one + 24h, it's competing for the same immediate attention span
      if (
        tDeadline <= deadline.getTime() + 24 * 60 * 60 * 1000 &&
        tDeadline > now.getTime()
      ) {
        const eff =
          t.realityState.confirmedPercent > 0
            ? t.realityState.confirmedPercent
            : t.realityState.inferredPercent;
        competingWorkloadRemaining += t.estimatedEffortHours * (1 - eff / 100);
      }
    }
  }
  // Scale workload density. e.g. 10 hours of competing workload = 50 density
  const workloadDensity = Math.min(
    100,
    Math.max(0, competingWorkloadRemaining * 5),
  );

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      0.4 * normalizedProgressGap +
        0.25 * urgencyPressure +
        0.2 * historicalLagBias +
        0.15 * workloadDensity,
    ),
  );

  let riskTier: "Green" | "Yellow" | "Red" = "Green";
  if (riskScore >= 70) riskTier = "Red";
  else if (riskScore >= 40) riskTier = "Yellow";

  const uncertaintyFlag =
    task.realityState.confirmedPercent === 0 &&
    task.realityState.inferredPercent > 0;

  const importanceMap: Record<string, number> = {
    Critical: 100,
    High: 80,
    Medium: 50,
    Low: 20,
  };
  const importanceScore = task.importance?.final
    ? importanceMap[task.importance.final] || 50
    : 50;

  const deadlineProximity = Math.max(
    0,
    Math.min(100, 100 - daysRemaining * 10),
  );
  const effortScore = Math.min(
    100,
    (1 / (task.estimatedEffortHours || 1)) * 100,
  );

  const priorityScore =
    0.35 * riskScore +
    0.3 * importanceScore +
    0.2 * deadlineProximity +
    0.15 * effortScore;

  const completedAt = task.realityState.completedAt || null;
  const isCompleted = effectivePercent >= 100 || !!completedAt;
  let status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' = 'Pending';
  if (isCompleted) {
    status = 'Completed';
  } else {
    const isOverdue = new Date(task.deadline).getTime() < now.getTime();
    if (isOverdue) {
      status = 'Overdue';
    } else {
      const focusMinutes = task.realityState.focusSessions?.reduce((acc, s) => acc + s.durationMinutes, 0) || 0;
      if (effectivePercent > 0 || focusMinutes > 0) {
        status = 'In Progress';
      }
    }
  }

  const priority = task.importance?.final || task.importance?.userOverride || 'Medium';

  const firstBlock = task.plannedState?.plannedWorkBlocks?.[0];
  const startDate = firstBlock?.start || task.createdAt || new Date().toISOString();
  const endDate = task.deadline;

  const estimatedHours = task.estimatedEffortHours || 0;

  const focusMinutes = task.realityState.focusSessions?.reduce((acc, s) => acc + s.durationMinutes, 0) || 0;
  const loggedHours = Math.round((focusMinutes / 60) * 10) / 10;

  const createdFrom = task.createdFrom || 'Quest';

  return {
    ...task,
    taskId: task.id,
    status,
    priority,
    startDate,
    endDate,
    estimatedHours,
    loggedHours,
    createdFrom,
    completedAt,
    realityState: {
      ...task.realityState,
      effectivePercent,
    },
    riskEngine: {
      riskScore,
      riskTier,
      breakdown: {
        progressGap: normalizedProgressGap,
        urgency: urgencyPressure,
        historicalLagBias,
        workloadDensity,
      },
      completionProbability,
      uncertaintyFlag,
    },
    priorityScore,
  };
}

export function getExpectedProgress(
  curve: { date: string; expectedPercent: number }[],
  now: Date,
): number {
  if (!curve || curve.length === 0) return 0;

  const nowTime = now.getTime();
  const sorted = [...curve].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let past = null;
  let future = null;

  for (const pt of sorted) {
    if (new Date(pt.date).getTime() <= nowTime) {
      past = pt;
    } else if (!future) {
      future = pt;
    }
  }

  if (!past) return 0;
  if (!future) return past.expectedPercent;

  const pastTime = new Date(past.date).getTime();
  const futureTime = new Date(future.date).getTime();
  if (futureTime === pastTime) return past.expectedPercent;

  const ratio = Math.max(
    0,
    Math.min(1, (nowTime - pastTime) / (futureTime - pastTime)),
  );
  return (
    past.expectedPercent +
    (future.expectedPercent - past.expectedPercent) * ratio
  );
}

export type WorkPattern = 'Last-Stretch Staller' | 'Slow Starter' | 'Steady Worker' | 'Not enough data yet';

export function calculateWorkPatternInsight(completedTasks: any[]): { label: WorkPattern; description: string } {
  // Only look at tasks that have session data and are not workspace tasks
  const validTasks = completedTasks.filter(t => !t.workspaceId && t.realityState?.focusSessions?.length > 0 && t.createdAt && t.deadline);
  
  if (validTasks.length < 3) {
    return { label: 'Not enough data yet', description: 'Complete at least 3 tasks with logged focus sessions to reveal your pattern.' };
  }

  let totalTasksAnalyzed = 0;
  
  // Averages across tasks
  let totalFirstSessionStartPercent = 0;
  let totalLateWorkPercent = 0; // % of work done in last 20% of window

  for (const t of validTasks) {
    const createdTime = new Date(t.createdAt).getTime();
    const deadlineTime = new Date(t.deadline).getTime();
    const windowMs = deadlineTime - createdTime;
    
    if (windowMs <= 0) continue; // Invalid window
    
    totalTasksAnalyzed++;
    
    const sessions = [...t.realityState.focusSessions].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 1. When did they start?
    const firstSessionTime = new Date(sessions[0].date).getTime();
    let firstSessionStartPercent = (firstSessionTime - createdTime) / windowMs;
    firstSessionStartPercent = Math.max(0, Math.min(1, firstSessionStartPercent));
    totalFirstSessionStartPercent += firstSessionStartPercent;
    
    // 2. How much work in last 20%?
    const lateThresholdTime = createdTime + windowMs * 0.8;
    let totalMinutes = 0;
    let lateMinutes = 0;
    
    for (const s of sessions) {
      const sTime = new Date(s.date).getTime();
      totalMinutes += s.durationMinutes;
      if (sTime >= lateThresholdTime) {
        lateMinutes += s.durationMinutes;
      }
    }
    
    const lateWorkPercent = totalMinutes > 0 ? lateMinutes / totalMinutes : 0;
    totalLateWorkPercent += lateWorkPercent;
  }
  
  if (totalTasksAnalyzed < 3) {
    return { label: 'Not enough data yet', description: 'Complete at least 3 tasks with valid timeframe data.' };
  }

  const avgFirstSessionPercent = totalFirstSessionStartPercent / totalTasksAnalyzed;
  const avgLateWorkPercent = totalLateWorkPercent / totalTasksAnalyzed;
  
  if (avgLateWorkPercent > 0.6) {
    return { 
      label: 'Last-Stretch Staller', 
      description: `You typically pack ${(avgLateWorkPercent * 100).toFixed(0)}% of your effort into the final 20% of your deadline window.` 
    };
  }
  
  if (avgFirstSessionPercent > 0.4) {
    return { 
      label: 'Slow Starter', 
      description: `You typically don't start until ${(avgFirstSessionPercent * 100).toFixed(0)}% of your deadline window has passed.` 
    };
  }
  
  return { 
    label: 'Steady Worker', 
    description: `You spread your work evenly across the deadline window without last-minute scrambling.` 
  };
}
