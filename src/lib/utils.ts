import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateDeadlineRisk(dueDate: Date, progress: number): 'high' | 'attention' | 'safe' {
  const now = new Date();
  const timeDifference = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDifference / (1000 * 3600 * 24));

  if (daysRemaining <= 1 && progress < 80) return 'high';
  if (daysRemaining <= 3 && progress < 50) return 'high';
  if (daysRemaining <= 5 && progress < 30) return 'attention';
  if (daysRemaining <= 7 && progress < 70) return 'attention';
  
  return 'safe';
}

export function generateFocusCoachMessage(tasksCompleted: number, streak: number, riskLevel: string) {
  if (riskLevel === 'high') {
    return "You have high-risk tasks approaching! Focus on completing them today to reduce academic risk by 40%.";
  }
  if (streak > 3) {
    return `Amazing ${streak}-day streak! Keep up the momentum, you're 2 tasks away from leveling up!`;
  }
  if (tasksCompleted === 0) {
    return "Ready to start the day? Completing your first task will give you +10 XP and build momentum.";
  }
  return "You usually focus best in the evening. Keep going!";
}
