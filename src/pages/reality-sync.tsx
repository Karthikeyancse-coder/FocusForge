import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { Card, CardContent } from "../components/ui/card";
import { useSearchParams } from "react-router-dom";
import { Activity, ChevronDown, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { getExpectedProgress } from "../lib/engine";

export default function RealitySync() {
  const { tasks, confirmTaskProgress } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTaskId = searchParams.get("taskId") || tasks[0]?.id || "";
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId);
  const [showCalculation, setShowCalculation] = useState(false);
  const [promptDismissedForTask, setPromptDismissedForTask] = useState<
    string | null
  >(null);
  const [showUpdateMode, setShowUpdateMode] = useState(false);
  const [updateValue, setUpdateValue] = useState(0);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  React.useEffect(() => {
    setShowUpdateMode(false);
    if (selectedTask) {
      setUpdateValue(selectedTask.realityState.effectivePercent);
    }
  }, [selectedTaskId, selectedTask?.id]);

  const expectedPercent = selectedTask
    ? getExpectedProgress(
        selectedTask.plannedState.expectedProgressCurve,
        new Date(),
      )
    : 0;
  const effectivePercent = selectedTask
    ? selectedTask.realityState.effectivePercent
    : 0;

  return (
    <div className="p-4 md:p-8 pt-16 md:pt-20 space-y-6 max-w-4xl mx-auto pb-[calc(160px+env(safe-area-inset-bottom))] md:pb-24">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Reality Sync
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Ground your expectations in actual execution data.
          </p>
        </div>
        <div className="w-full md:w-64 mt-2 md:mt-0">
          <select
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value);
              setSearchParams({ taskId: e.target.value });
            }}
            className="w-full h-[46px] md:h-auto bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] font-semibold"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTask ? (
        <Card className="bg-[var(--bg-primary)] border-[var(--border-subtle)] flex items-center justify-center py-24">
          <p className="text-[var(--text-muted)] font-medium">
            Select a task to view Reality Sync data.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Headline */}
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] overflow-hidden shadow-xl rounded-[16px] md:rounded-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-5 md:p-12 text-center relative">
              <RefreshCw className="absolute text-[var(--bg-secondary)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 opacity-30 md:opacity-50 z-0 pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <h2 className="text-[34px] leading-[1.15] md:text-5xl font-black font-display tracking-tight text-[var(--text-primary)] md:leading-tight">
                  "You said you'd be{" "}
                  <span className="text-blue-500">
                    {expectedPercent.toFixed(0)}%
                  </span>{" "}
                  done. You're actually at{" "}
                  <span
                    className={
                      effectivePercent < expectedPercent
                        ? "text-red-500"
                        : "text-emerald-500"
                    }
                  >
                    {effectivePercent.toFixed(0)}%
                  </span>
                  ."
                </h2>

                {/* Answerable Prompt */}
                {promptDismissedForTask !== selectedTaskId && (
                  <div className="mt-6 md:mt-8">
                    {!showUpdateMode ? (
                      <div className="space-y-4 md:space-y-4 flex flex-col items-center">
                        <h3 className="text-[15px] md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1 md:mt-0">
                          Is this really accurate?
                        </h3>
                        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center w-full md:w-auto">
                          <button
                            onClick={() =>
                              setPromptDismissedForTask(selectedTaskId)
                            }
                            className="w-full md:w-auto h-[46px] md:h-auto px-6 py-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[12px] md:rounded-xl text-[14px] md:text-sm font-bold hover:border-[var(--text-muted)] transition-colors text-[var(--text-primary)] flex items-center justify-center"
                          >
                            Yes, still accurate
                          </button>
                          <button
                            onClick={() => setShowUpdateMode(true)}
                            className="w-full md:w-auto h-[46px] md:h-auto px-6 py-2 bg-[var(--text-primary)] text-black rounded-[12px] md:rounded-xl text-[14px] md:text-sm font-bold hover:brightness-110 transition-colors flex items-center justify-center"
                          >
                            No, update my progress
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-sm w-full mx-auto p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl relative z-20">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">
                          What is your actual progress?
                        </h3>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={updateValue}
                            onChange={(e) =>
                              setUpdateValue(Number(e.target.value))
                            }
                            className="flex-1 accent-[var(--accent-primary)]"
                          />
                          <span className="text-xl font-bold font-mono text-[var(--text-primary)] w-16 text-right">
                            {updateValue}%
                          </span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 justify-end mt-4 w-full">
                          <button
                            onClick={() => setShowUpdateMode(false)}
                            className="w-full md:w-auto h-[46px] md:h-auto px-4 py-2 text-[14px] md:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              confirmTaskProgress(selectedTaskId, updateValue);
                              setShowUpdateMode(false);
                              setPromptDismissedForTask(selectedTaskId);
                            }}
                            className="w-full md:w-auto h-[46px] md:h-auto px-4 py-2 bg-[var(--accent-primary)] text-black rounded-[12px] md:rounded-lg text-[14px] md:text-sm font-bold hover:brightness-110 transition-colors flex items-center justify-center"
                          >
                            Confirm Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expected vs Actual Chart */}
                <div className="max-w-xl mx-auto pt-8">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    <span>Progress Gap</span>
                    <span>
                      {Math.max(0, expectedPercent - effectivePercent).toFixed(
                        1,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-6 bg-[var(--bg-secondary)] rounded-full overflow-hidden flex relative shadow-inner">
                    {/* Expected Target Line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[var(--text-primary)] z-20 transition-all duration-1000"
                      style={{ left: `${Math.min(100, expectedPercent)}%` }}
                    />
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 relative z-10",
                        effectivePercent >= expectedPercent
                          ? "bg-emerald-500"
                          : "bg-red-500",
                      )}
                      style={{ width: `${Math.min(100, effectivePercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    <span>0%</span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[var(--text-primary)] rounded-full"></div>{" "}
                      Expected Target
                    </span>
                    <span>100%</span>
                  </div>

                  <div className="mt-6 text-sm text-[var(--text-secondary)] font-medium bg-[var(--bg-secondary)]/50 py-2 px-4 rounded-lg inline-block border border-[var(--border-subtle)]">
                    {selectedTask.realityState.focusSessions.length === 0 &&
                      selectedTask.realityState.confirmedPercent === 0 &&
                      "No focus sessions logged yet for this task."}
                    {selectedTask.realityState.focusSessions.length > 0 &&
                      selectedTask.realityState.confirmedPercent === 0 &&
                      `Based on ${selectedTask.realityState.focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0)} logged focus minutes — not yet confirmed.`}
                    {selectedTask.realityState.confirmedPercent > 0 &&
                      `Last confirmed on ${!isNaN(new Date(selectedTask.realityState.lastConfirmedAt || Date.now()).getTime()) ? new Date(selectedTask.realityState.lastConfirmedAt || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : 'Unknown'}.`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collapsible Breakdown */}
          <Card className="bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setShowCalculation(!showCalculation)}
              className="w-full flex items-center justify-between p-6 hover:bg-[var(--bg-secondary)]/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-blue-500" />
                <span className="font-bold text-sm uppercase tracking-widest text-[var(--text-primary)]">
                  Show Calculation Breakdown
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "transition-transform text-[var(--text-muted)]",
                  showCalculation && "rotate-180",
                )}
                size={20}
              />
            </button>

            <AnimatePresence>
              {showCalculation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-4 bg-[var(--bg-secondary)]/20">
                    <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                        Expected Progress
                      </p>
                      <p className="text-xl font-mono font-bold text-[var(--text-primary)]">
                        {expectedPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                        Stated/Effective
                      </p>
                      <p className="text-xl font-mono font-bold text-[var(--text-primary)]">
                        {effectivePercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                        Historical Lag Bias
                      </p>
                      <p className="text-xl font-mono font-bold text-[var(--text-primary)]">
                        {selectedTask.riskEngine.breakdown.historicalLagBias.toFixed(
                          1,
                        )}
                      </p>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                        Workload Density
                      </p>
                      <p className="text-xl font-mono font-bold text-[var(--text-primary)]">
                        {selectedTask.riskEngine.breakdown.workloadDensity.toFixed(
                          1,
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      )}
    </div>
  );
}
