import { useState, useEffect } from "react";
import { Task } from "../types";

export interface RecoveryAction {
  id: string;
  type: "extend_deadline" | "reduce_scope" | "emergency_focus" | "get_help" | "accept_failure";
  title: string;
  description: string;
  successRate: number; // 0-100
  timeRequired: number; // hours
  effort: "low" | "medium" | "high";
  isRecommended: boolean;
}

export interface RiskAssessment {
  taskId: string;
  taskTitle: string;
  riskScore: number; // 0-100
  riskLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "BLACK";
  procrastinationScore: number; // 0-100
  expectedProgress: number; // 0-100
  actualProgress: number; // 0-100
  daysUntilDeadline: number;
  hoursUntilDeadline: number;
  daysElapsed: number;
  totalDays: number;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  riskMessage: string;
  recommendedAction: string;
  successProbability: number; // 0-100
  interventionType: "none" | "gentle" | "direct" | "urgent" | "emergency" | "recovery";
  suggestedRecoveryActions: RecoveryAction[];
  timeToCompleteRemaining: number; // hours
  isRecoverable: boolean;
  recoveryDeadline?: Date;
}

export function calculateProcrastinationRisk(task: Task, currentDate: Date = new Date()): RiskAssessment {
  const createdDate = task.createdAt ? new Date(task.createdAt) : new Date();
  const deadline = new Date(task.deadline);
  
  // Safe defaults if dates are invalid
  if (deadline.getTime() <= createdDate.getTime()) {
    deadline.setDate(createdDate.getDate() + 1);
  }

  const totalDays = Math.max(0, (deadline.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, (currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = (deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

  const percentTimeElapsed = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 100;
  
  const isCompleted = !!task.realityState.completedAt;
  const actualProgress = isCompleted ? 100 : Math.max(task.realityState.confirmedPercent || 0, task.realityState.inferredPercent || 0);
  
  // Calculate expected progress
  let expectedProgress = percentTimeElapsed;
  if (isCompleted) expectedProgress = 100;
  else if (daysRemaining < 0) expectedProgress = 100;

  // Procrastination Score
  let procrastinationScore = expectedProgress - actualProgress;
  if (procrastinationScore < 0) procrastinationScore = 0;
  if (daysRemaining < 1 && actualProgress < 90) procrastinationScore = 100;
  procrastinationScore = Math.min(100, Math.max(0, procrastinationScore));

  const timeNeededHours = task.estimatedEffortHours || 1;
  const hoursRemaining = daysRemaining * 24;

  // Risk Level
  let riskLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "BLACK" = "GREEN";
  if (isCompleted) riskLevel = "GREEN";
  else if (daysRemaining < 0 || (daysRemaining === 0 && actualProgress < 100) || procrastinationScore >= 90) riskLevel = "BLACK";
  else if ((hoursRemaining < timeNeededHours && actualProgress < 90) || procrastinationScore >= 60) riskLevel = "RED";
  else if (procrastinationScore >= 30) riskLevel = "ORANGE";
  else if (procrastinationScore >= 10) riskLevel = "YELLOW";

  // Success Probability
  let successProbability = riskLevel === "GREEN" ? 95 : riskLevel === "YELLOW" ? 75 : riskLevel === "ORANGE" ? 45 : riskLevel === "RED" ? 15 : 5;
  if (hoursRemaining < timeNeededHours * 0.5) successProbability -= 20;
  if (hoursRemaining < timeNeededHours * 0.1) successProbability -= 30;
  if (actualProgress > 0) successProbability += 10;
  if (actualProgress > 50) successProbability += 15;
  if (daysRemaining > 5) successProbability += 10;
  successProbability = Math.max(0, Math.min(100, successProbability));

  // Urgency Level
  let urgencyLevel: 1 | 2 | 3 | 4 | 5 = riskLevel === "BLACK" ? 5 : riskLevel === "RED" ? 4 : riskLevel === "ORANGE" ? 3 : riskLevel === "YELLOW" ? 2 : 1;
  if (hoursRemaining < 1 || (daysRemaining < 0.5 && procrastinationScore > 50)) urgencyLevel = 5;
  if (procrastinationScore > 80 && urgencyLevel < 4) urgencyLevel = 4;

  // Risk Message
  let riskMessage = "Task status unknown";
  if (riskLevel === "GREEN") riskMessage = isCompleted ? "✅ Task completed! Great job!" : "✅ Great job! You're on track. Keep it up!";
  else if (riskLevel === "YELLOW") riskMessage = `⚠️ You're ${Math.round(procrastinationScore)}% behind schedule. Start working soon?`;
  else if (riskLevel === "ORANGE") riskMessage = `🟠 You're significantly behind! ${Math.round(procrastinationScore)}% behind schedule. Start TODAY!`;
  else if (riskLevel === "RED") riskMessage = `🔴 CRITICAL: You're ${Math.round(procrastinationScore)}% behind! Start NOW or you'll fail! (${Math.round(successProbability)}% success chance)`;
  else if (riskLevel === "BLACK") riskMessage = daysRemaining < 0 ? "⚫ DEADLINE MISSED: You failed to complete this task on time." : "⚫ CRITICAL: Deadline today and task not done. You WILL miss this!";

  // Recommended Action
  let recommendedAction = "Take action on this task";
  if (riskLevel === "GREEN") recommendedAction = "Continue as planned";
  else if (riskLevel === "YELLOW") recommendedAction = "Start working this week";
  else if (riskLevel === "ORANGE") recommendedAction = `Start working TODAY - Block ${Math.ceil(timeNeededHours)} hours on your calendar`;
  else if (riskLevel === "RED") recommendedAction = "START IMMEDIATELY - Emergency mode activated";
  else if (riskLevel === "BLACK") recommendedAction = daysRemaining < 0 ? "Request deadline extension or accept failure" : "Start NOW or you will definitely fail";

  // Recovery Actions
  const suggestedRecoveryActions: RecoveryAction[] = [];
  if (daysRemaining >= 0 && !isCompleted) {
    suggestedRecoveryActions.push({
      id: "extend_deadline", type: "extend_deadline", title: "Request Deadline Extension", description: "Ask for 2-3 day extension to complete quality work",
      successRate: 65, timeRequired: 0.5, effort: "low", isRecommended: successProbability < 30
    });
  }
  if (!isCompleted) {
    suggestedRecoveryActions.push({
      id: "reduce_scope", type: "reduce_scope", title: "Reduce Task Scope", description: "Complete 70% of task instead of 100% to meet deadline",
      successRate: 85, timeRequired: Math.max(0, hoursRemaining * 0.7), effort: "medium", isRecommended: successProbability < 50
    });
  }
  if ((riskLevel === "RED" || riskLevel === "ORANGE") && !isCompleted) {
    suggestedRecoveryActions.push({
      id: "emergency_focus", type: "emergency_focus", title: "Emergency Focus Mode", description: "Block all distractions and work intensively",
      successRate: 55, timeRequired: 6, effort: "high", isRecommended: true
    });
  }
  if (!isCompleted) {
    suggestedRecoveryActions.push({
      id: "get_help", type: "get_help", title: "Get Help/Delegate", description: "Ask friend/colleague to help complete this task",
      successRate: 75, timeRequired: Math.max(0, hoursRemaining * 0.5), effort: "medium", isRecommended: successProbability < 40
    });
  }
  if ((riskLevel === "BLACK" || daysRemaining < 0) && !isCompleted) {
    suggestedRecoveryActions.push({
      id: "accept_failure", type: "accept_failure", title: "Accept & Learn", description: "Accept this failure and learn to prevent next time",
      successRate: 0, timeRequired: 0, effort: "low", isRecommended: true
    });
  }

  // Intervention Type
  let interventionType: any = "none";
  if (riskLevel === "YELLOW") interventionType = "gentle";
  if (riskLevel === "ORANGE") interventionType = "direct";
  if (riskLevel === "RED") interventionType = "urgent";
  if (riskLevel === "BLACK") interventionType = "recovery";

  const isRecoverable = !(riskLevel === "BLACK" && hoursRemaining < 0) && hoursRemaining >= timeNeededHours * 0.1;
  const timeToCompleteRemaining = Math.max(0, Math.round((timeNeededHours - (timeNeededHours * (actualProgress / 100))) * 10) / 10);
  
  const riskScoresMap = { "GREEN": 10, "YELLOW": 30, "ORANGE": 60, "RED": 85, "BLACK": 100 };
  const baseScore = riskScoresMap[riskLevel];
  const riskScore = Math.max(0, Math.min(100, Math.round(baseScore + (procrastinationScore * 0.2) - (successProbability * 0.1))));

  return {
    taskId: task.id,
    taskTitle: task.title,
    riskScore,
    riskLevel,
    procrastinationScore: Math.round(procrastinationScore),
    expectedProgress: Math.round(expectedProgress),
    actualProgress: Math.round(actualProgress),
    daysUntilDeadline: Math.ceil(daysRemaining),
    hoursUntilDeadline: Math.ceil(hoursRemaining),
    daysElapsed: Math.floor(daysElapsed),
    totalDays: Math.ceil(totalDays),
    urgencyLevel,
    riskMessage,
    recommendedAction,
    successProbability: Math.round(successProbability),
    interventionType,
    suggestedRecoveryActions,
    timeToCompleteRemaining,
    isRecoverable,
    recoveryDeadline: hoursRemaining > 0 ? new Date(deadline.getTime()) : undefined
  };
}

export function sortTasksByRisk(assessments: RiskAssessment[]): RiskAssessment[] {
  const riskOrder: Record<string, number> = { "BLACK": 0, "RED": 1, "ORANGE": 2, "YELLOW": 3, "GREEN": 4 };
  
  return [...assessments].sort((a, b) => {
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (a.urgencyLevel !== b.urgencyLevel) return b.urgencyLevel - a.urgencyLevel;
    return a.daysUntilDeadline - b.daysUntilDeadline;
  });
}

export function groupTasksByRiskLevel(assessments: RiskAssessment[]): Record<string, RiskAssessment[]> {
  return {
    BLACK: assessments.filter(a => a.riskLevel === "BLACK"),
    RED: assessments.filter(a => a.riskLevel === "RED"),
    ORANGE: assessments.filter(a => a.riskLevel === "ORANGE"),
    YELLOW: assessments.filter(a => a.riskLevel === "YELLOW"),
    GREEN: assessments.filter(a => a.riskLevel === "GREEN")
  };
}

export function getTopPriority(assessments: RiskAssessment[]): RiskAssessment | null {
  const sorted = sortTasksByRisk(assessments);
  return sorted.length > 0 ? sorted[0] : null;
}

export function getCriticalTasks(assessments: RiskAssessment[]): RiskAssessment[] {
  return assessments.filter(a => a.riskLevel === "BLACK" || a.riskLevel === "RED");
}

export function useRiskCenter(tasks: Task[]) {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [groupedByRisk, setGroupedByRisk] = useState<Record<string, RiskAssessment[]>>({});
  const [topPriority, setTopPriority] = useState<RiskAssessment | null>(null);
  const [criticalTasks, setCriticalTasks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      const newAssessments = tasks.map(task => calculateProcrastinationRisk(task));
      
      setAssessments(newAssessments);
      setGroupedByRisk(groupTasksByRiskLevel(newAssessments));
      setTopPriority(getTopPriority(newAssessments));
      setCriticalTasks(getCriticalTasks(newAssessments));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tasks]);
  
  return {
    assessments,
    groupedByRisk,
    topPriority,
    criticalTasks,
    sortedByRisk: sortTasksByRisk(assessments),
    loading,
    error
  };
}
