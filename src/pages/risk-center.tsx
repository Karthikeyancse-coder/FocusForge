import React from "react";
import { useUser } from "../context/UserContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ShieldAlert, AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { getExpectedProgress } from "../lib/engine";

export default function RiskCenter() {
  const { tasks } = useUser();
  const navigate = useNavigate();

  const atRiskTasks = tasks
    .filter(
      (t) => t.riskEngine.riskTier !== "Green" && !t.realityState.completedAt
    )
    .sort((a, b) => {
      const tierOrder = { Red: 0, Yellow: 1, Green: 2 };
      const aTier = tierOrder[a.riskEngine.riskTier as keyof typeof tierOrder] ?? 2;
      const bTier = tierOrder[b.riskEngine.riskTier as keyof typeof tierOrder] ?? 2;
      if (aTier !== bTier) return aTier - bTier;
      
      if (b.riskEngine.riskScore !== a.riskEngine.riskScore) {
        return b.riskEngine.riskScore - a.riskEngine.riskScore;
      }
      
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  return (
    <div className="p-8 pt-16 md:pt-20 space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <ShieldAlert size={32} className="text-red-500" />
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Risk Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Diagnosis of tasks in critical condition.
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-emerald-500/10 border-emerald-500/30 flex flex-col items-center justify-center py-24">
          <ShieldAlert size={48} className="text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            Create your first quest to see risk analysis here
          </h2>
          <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-2">
            You currently have no tasks in your workspace.
          </p>
        </Card>
      ) : atRiskTasks.length === 0 ? (
        <Card className="bg-emerald-500/10 border-emerald-500/30 flex flex-col items-center justify-center py-24">
          <ShieldAlert size={48} className="text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            All Systems Nominal
          </h2>
          <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-2">
            No tasks are currently at risk.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {atRiskTasks.map((task) => {
            const isRed = task.riskEngine.riskTier === "Red";
            const completionProb = task.riskEngine.completionProbability ?? (100 - task.riskEngine.riskScore);
            const expectedPercent = getExpectedProgress(
              task.plannedState.expectedProgressCurve,
              new Date(),
            );
            const actualPercent = task.realityState.effectivePercent || 0;
            const realityGap = expectedPercent - actualPercent;
            
            const msRemaining = new Date(task.deadline).getTime() - Date.now();
            const daysRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)));
            const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));
            const timeRemainingText = msRemaining < 0 ? "Overdue" : daysRemaining > 0 ? `${daysRemaining} days left` : hoursRemaining > 0 ? `${hoursRemaining} hours left` : "Less than 1 hour";
            
            const hasData = task.realityState.focusSessions?.length > 0 || task.realityState.confirmedPercent > 0 || task.realityState.inferredPercent > 0;

            return (
              <Card
                key={task.id}
                className={cn(
                  "bg-[var(--bg-primary)] overflow-hidden border",
                  isRed ? "border-red-500/50" : "border-amber-500/50",
                )}
              >
                <div className="flex flex-col sm:flex-row">
                  <div
                    className={cn(
                      "w-2 sm:w-3 flex-shrink-0",
                      isRed ? "bg-red-500" : "bg-amber-500",
                    )}
                  />
                  <CardContent className="flex-1 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle
                          size={16}
                          className={isRed ? "text-red-500" : "text-amber-500"}
                        />
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full",
                            isRed
                              ? "bg-red-500/20 text-red-500"
                              : "bg-amber-500/20 text-amber-500",
                          )}
                        >
                          {task.riskEngine.riskTier} RISK
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                        {task.title}
                      </h3>
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        Category: {task.category}
                      </p>
                      <div className="mt-3 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-md inline-block border border-[var(--border-subtle)]">
                        <span className="font-bold text-[var(--text-primary)]">Procrastination Score:</span> Expected Progress by now: {(task.riskEngine.breakdown.progressGap + task.realityState.effectivePercent).toFixed(0)}% — Actual Progress: {task.realityState.effectivePercent.toFixed(0)}% — You're <span className="font-bold text-[var(--accent-primary)]">{task.riskEngine.breakdown.progressGap.toFixed(0)}%</span> behind schedule.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 w-full sm:w-auto">
                      <div>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                          Risk Score
                        </p>
                        <p
                          className={cn(
                            "text-2xl font-mono font-bold",
                            isRed ? "text-red-500" : "text-amber-500",
                          )}
                        >
                          {task.riskEngine.riskScore.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                          Success Prob.
                        </p>
                        <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                          {completionProb.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                          Reality Gap
                        </p>
                        {hasData ? (
                          <div>
                            <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                              {Math.max(0, realityGap).toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-[var(--text-secondary)]">
                              Expected {expectedPercent.toFixed(0)}%, Actual {actualPercent.toFixed(0)}%
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">
                            Not enough data yet
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                          Time Left
                        </p>
                        <p className={cn(
                          "text-lg font-mono font-bold",
                          msRemaining < 0 ? "text-red-500" : "text-[var(--text-primary)]"
                        )}>
                          {timeRemainingText}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <Button
                        onClick={() =>
                          navigate(`/app/recovery?taskId=${task.id}`)
                        }
                        className={cn(
                          "w-full h-12 uppercase tracking-widest text-[11px] font-black group transition-all",
                          isRed
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-amber-500 hover:bg-amber-600 text-white",
                        )}
                      >
                        Send to Recovery{" "}
                        <ArrowRight
                          size={14}
                          className="ml-2 group-hover:translate-x-1 transition-transform"
                        />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
