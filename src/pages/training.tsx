import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Swords,
  Target,
  Crosshair,
  Zap,
  Activity,
} from "lucide-react";
import { useUser } from "../context/UserContext";

type FocusMode =
  | "Just 15 minutes"
  | "25 Minute Sprint"
  | "50 Minute Deep Work"
  | "90 Minute Ultra Focus"
  | "Custom Session";

const MODE_DURATIONS: Record<FocusMode, number> = {
  "Just 15 minutes": 15,
  "25 Minute Sprint": 25,
  "50 Minute Deep Work": 50,
  "90 Minute Ultra Focus": 90,
  "Custom Session": 0,
};

export default function Training() {
  const {
    addFocusSession,
    confirmTaskProgress,
    updateUserState,
    confirmRetroactiveTask,
    tasks,
    userState,
  } = useUser();
  const [searchParams] = useSearchParams();
  const initialTaskId = searchParams.get("taskId") || tasks[0]?.id || "";

  const activeTimer = userState.activeTimer;

  const [mode, setMode] = useState<FocusMode>(
    activeTimer ? (activeTimer.modeName as FocusMode) : "25 Minute Sprint",
  );
  const [customMinutes, setCustomMinutes] = useState(
    activeTimer && activeTimer.modeName === "Custom Session"
      ? activeTimer.durationSeconds / 60
      : 60,
  );
  const getInitialTime = (m: FocusMode) =>
    m === "Custom Session" ? customMinutes * 60 : MODE_DURATIONS[m] * 60;

  const [timeLeft, setTimeLeft] = useState(getInitialTime("25 Minute Sprint"));
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    activeTimer ? activeTimer.taskId : initialTaskId,
  );

  const [showRetroForm, setShowRetroForm] = useState(false);
  const [retroDate, setRetroDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [retroDuration, setRetroDuration] = useState("25");
  const [retroProgress, setRetroProgress] = useState("");

  // Calculate actual time left based on activeTimer if it exists
  useEffect(() => {
    if (!activeTimer) {
      setIsActive(false);
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const elapsedTotal =
        activeTimer.isPaused && activeTimer.pauseStartTimestamp
          ? activeTimer.pauseStartTimestamp -
            activeTimer.startTimestamp -
            activeTimer.accumulatedPauseMs
          : now - activeTimer.startTimestamp - activeTimer.accumulatedPauseMs;

      return Math.max(
        0,
        activeTimer.durationSeconds - Math.floor(elapsedTotal / 1000),
      );
    };

    setIsActive(!activeTimer.isPaused);
    setSelectedTaskId(activeTimer.taskId);
    setMode(activeTimer.modeName as FocusMode);
    setTimeLeft(calculateRemaining());

    let interval: any;
    if (!activeTimer.isPaused) {
      interval = setInterval(() => {
        const rem = calculateRemaining();
        setTimeLeft(rem);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Sync initial timer when mode changes (if not active)
  useEffect(() => {
    if (!activeTimer) {
      setTimeLeft(getInitialTime(mode));
    }
  }, [mode, customMinutes, activeTimer]);

  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("taskId")) {
      const urlTaskId = searchParams.get("taskId") as string;
      if (!activeTimer) {
        setSelectedTaskId(urlTaskId);
      } else if (activeTimer.taskId !== urlTaskId) {
        // We have an active timer for another task, but URL requests a different task
        // We can ask the user if they want to cancel the current one
        const wantsToCancel = window.confirm(
          `You already have an active focus session. Do you want to cancel it to start a new one for this task?`,
        );
        if (wantsToCancel) {
          updateUserState({ activeTimer: undefined });
          setSelectedTaskId(urlTaskId);
        } else {
          // Revert URL to active timer task? Or just ignore and keep activeTimer's task
          setSelectedTaskId(activeTimer.taskId);
          navigate(`/app/training?taskId=${activeTimer.taskId}`, {
            replace: true,
          });
        }
      }
    }
  }, [searchParams, activeTimer, navigate, updateUserState]);

  const toggleTimer = () => {
    if (!selectedTaskId) {
      alert("Please select a task first.");
      return;
    }

    if (!activeTimer) {
      // Start a new session
      updateUserState({
        activeTimer: {
          taskId: selectedTaskId,
          durationSeconds: getInitialTime(mode),
          startTimestamp: Date.now(),
          isPaused: false,
          pauseStartTimestamp: null,
          accumulatedPauseMs: 0,
          modeName: mode,
        },
      });
    } else {
      // Toggle pause
      const now = Date.now();
      if (activeTimer.isPaused) {
        const pauseDuration = activeTimer.pauseStartTimestamp
          ? now - activeTimer.pauseStartTimestamp
          : 0;
        updateUserState({
          activeTimer: {
            ...activeTimer,
            isPaused: false,
            pauseStartTimestamp: null,
            accumulatedPauseMs: activeTimer.accumulatedPauseMs + pauseDuration,
          },
        });
      } else {
        updateUserState({
          activeTimer: {
            ...activeTimer,
            isPaused: true,
            pauseStartTimestamp: now,
          },
        });
      }
    }
  };

  const resetTimer = () => {
    if (activeTimer) {
      // Cancel the current active timer
      updateUserState({ activeTimer: undefined });
    }
    setIsActive(false);
    setTimeLeft(getInitialTime(mode));
  };

  const changeMode = (newMode: FocusMode) => {
    if (activeTimer) {
      alert(
        "Please stop or complete the current session before changing modes.",
      );
      return;
    }
    setMode(newMode);
    setTimeLeft(
      newMode === "Custom Session"
        ? customMinutes * 60
        : MODE_DURATIONS[newMode] * 60,
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalTime = activeTimer
    ? activeTimer.durationSeconds
    : getInitialTime(mode);
  const progress = totalTime > 0 ? 100 - (timeLeft / totalTime) * 100 : 0;

  const targetTask = tasks.find((t) => t.id === selectedTaskId);

  const estHours = targetTask?.estimatedEffortHours || 0;
  const compPercent = targetTask?.realityState.effectivePercent || 0;
  const hrsCompleted = (estHours * (compPercent / 100)).toFixed(1);
  const hrsRemaining = (estHours * (1 - compPercent / 100)).toFixed(1);

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex flex-col pb-[calc(120px+env(safe-area-inset-bottom))] md:pb-12 pt-8 md:pt-12 px-4 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full max-w-[1400px] mx-auto my-auto">
        {/* Timer UI */}
        <Card className="border-[var(--border-subtle)] shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[420px] md:min-h-[500px]">
          {isActive && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
          )}
          <CardContent className="flex flex-col items-center justify-center p-6 py-8 md:p-12 h-full">
            <div className="w-full mb-4 md:mb-8">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block text-center flex items-center justify-center gap-2">
                <Crosshair size={14} className="text-[var(--accent-primary)]" />{" "}
                Focus Target
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full sm:w-3/4 mx-auto block bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] font-semibold shadow-sm transition-all"
              >
                <option value="">Untargeted Session (XP only)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.workspaceId ? '(Shared)' : `(${t.riskEngine.riskTier})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-4 md:mb-8">
              {(
                [
                  "Just 15 minutes",
                  "25 Minute Sprint",
                  "50 Minute Deep Work",
                  "90 Minute Ultra Focus",
                  "Custom Session",
                ] as FocusMode[]
              ).map((m) => (
                <ModeButton
                  key={m}
                  active={mode === m}
                  onClick={() => changeMode(m)}
                >
                  {m}
                </ModeButton>
              ))}
            </div>

            {mode === "Custom Session" && !isActive && (
              <div className="mb-4 md:mb-8 flex items-center gap-3 bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--border-subtle)]">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-20 bg-transparent text-center font-bold text-lg outline-none text-[var(--text-primary)]"
                  min="1"
                  max="480"
                />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest pr-4">
                  Minutes
                </span>
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center w-full max-md:py-6">
              <div className="relative w-[200px] h-[200px] md:w-72 md:h-72 mb-5 md:mb-12 flex items-center justify-center">
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 288 288">
                <circle
                  cx="144"
                  cy="144"
                  r="136"
                  fill="none"
                  stroke="var(--bg-primary)"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="144"
                  cy="144"
                  r="136"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 136}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 136 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 136 * (1 - progress / 100),
                  }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              <div className="text-[52px] md:text-7xl font-bold font-display tracking-tighter text-[var(--text-primary)] relative z-10 drop-shadow-md">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 md:gap-2">
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  onClick={toggleTimer}
                  className="w-48 text-[13px] font-black uppercase tracking-widest text-black bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 shadow-[0_0_20px_rgba(31,164,99,0.4)] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isActive ? (
                    <Pause className="mr-2" />
                  ) : (
                    <Play className="mr-2" />
                  )}
                  {isActive ? "Pause" : activeTimer ? "Resume" : "Focus Now"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetTimer}
                  className="h-12 w-12 border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors"
                >
                  <RotateCcw size={20} />
                </Button>
              </div>
              <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest mt-1">
                Earns +10 XP
              </p>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Context View */}
        <Card className="min-h-[300px] md:min-h-[500px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden relative group rounded-2xl flex flex-col justify-between">
          <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[var(--bg-secondary)] to-transparent pointer-events-none z-10" />

          <div className="p-8 relative z-20 flex-1">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 mb-6">
              <Swords size={14} className="text-amber-500" /> Active Mission
              Intel
            </h2>

            {targetTask ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] leading-tight mb-3">
                    {targetTask.title}
                  </h1>
                  <div className="flex gap-2 items-center">
                    <Badge
                      variant="outline"
                      className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] font-bold uppercase tracking-widest text-[10px]"
                    >
                      {targetTask.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1"
                    >
                      <Target size={10} /> Active Target
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-inner">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1 flex items-center gap-1.5">
                      <Activity size={12} className="text-cyan-400" /> Est.
                      Hours
                    </p>
                    <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
                      {estHours}
                      <span className="text-sm text-[var(--text-muted)] ml-1">
                        hrs
                      </span>
                    </p>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-inner">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1 flex items-center gap-1.5">
                      <Target size={12} className="text-amber-400" /> Remaining
                    </p>
                    <p className="font-mono text-2xl font-bold text-amber-500">
                      {hrsRemaining}
                      <span className="text-sm text-[var(--text-muted)] ml-1">
                        hrs
                      </span>
                    </p>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-inner">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1 flex items-center gap-1.5">
                      <Zap size={12} className="text-emerald-400" /> Completed
                    </p>
                    <p className="font-mono text-2xl font-bold text-emerald-400">
                      {hrsCompleted}
                      <span className="text-sm text-[var(--text-muted)] ml-1">
                        hrs
                      </span>
                    </p>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-inner flex flex-col justify-center relative overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1 z-10">
                      Progress
                    </p>
                    <p className="font-mono text-3xl font-bold text-white z-10">
                      {compPercent.toFixed(0)}%
                    </p>
                    <motion.div
                      className="absolute bottom-0 left-0 bg-[var(--accent-primary)]/10 h-full z-0"
                      initial={{ width: 0 }}
                      animate={{ width: `${compPercent}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <Crosshair
                  size={48}
                  className="text-[var(--text-muted)] mb-2"
                />
                <p className="text-[var(--text-secondary)] font-medium">
                  Select a focus target to load mission intel.
                </p>
              </div>
            )}
          </div>

          {/* Forgiveness Window */}
          <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md relative z-20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-display font-semibold text-xs text-amber-500 uppercase tracking-widest mb-1">
                  Forgiveness Window
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold">
                  Log an offline session to maintain sync.
                </p>
              </div>
              {!showRetroForm && (
                <Button
                  size="sm"
                  onClick={() => setShowRetroForm(true)}
                  className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500 hover:text-black transition-colors rounded-lg"
                >
                  Log Retroactive
                </Button>
              )}
            </div>

            <AnimatePresence>
              {showRetroForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-[var(--text-muted)] font-bold block mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={retroDate}
                          onChange={(e) => setRetroDate(e.target.value)}
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-[var(--text-muted)] font-bold block mb-1">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          value={retroDuration}
                          onChange={(e) => setRetroDuration(e.target.value)}
                          min="1"
                          className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[var(--text-muted)] font-bold block mb-1">
                        Total Progress % (Optional Update)
                      </label>
                      <input
                        type="number"
                        value={retroProgress}
                        onChange={(e) => setRetroProgress(e.target.value)}
                        placeholder="e.g. 50"
                        min="0"
                        max="100"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRetroForm(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedTaskId && retroDate && retroDuration) {
                            addFocusSession(
                              selectedTaskId,
                              Number(retroDuration),
                              new Date(retroDate).toISOString(),
                            );
                            if (retroProgress) {
                              confirmTaskProgress(
                                selectedTaskId,
                                Number(retroProgress),
                              );
                            }
                            setShowRetroForm(false);
                            setRetroProgress("");
                          }
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase"
                      >
                        Save Session
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  key?: React.Key;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
        active
          ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm border border-[var(--accent-primary)]/50 shadow-[0_0_15px_rgba(0,255,157,0.15)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:bg-[var(--bg-secondary)]"
      }`}
    >
      {children}
    </button>
  );
}
