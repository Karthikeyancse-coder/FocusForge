import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, X, Maximize2, AlertCircle } from "lucide-react";
import { useUser } from "../context/UserContext";

export function GlobalTimer() {
  const { userState, updateUserState, addFocusSession, tasks } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState<number | null>(null);

  // Edge Docking States
  const [isDocked, setIsDocked] = useState(false);
  const [dockSide, setDockSide] = useState<"left" | "right">("right");
  const [dockY, setDockY] = useState<number>(300);
  const [savedPosition, setSavedPosition] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<HTMLDivElement>(null);

  const activeTimer = userState.activeTimer;
  const isTrainingPage = location.pathname === "/app/training";

  useEffect(() => {
    const handleResize = () => {
      if (savedPosition) {
        const maxX = window.innerWidth - 256;
        const maxY = window.innerHeight - 150;
        setSavedPosition((prev) => {
          if (!prev) return null;
          return {
            x: Math.max(0, Math.min(prev.x, maxX)),
            y: Math.max(0, Math.min(prev.y, maxY)),
          };
        });
      }
      if (isDocked) {
        const isMobile = window.innerWidth < 768;
        const minDockY = isMobile ? 80 : 40;
        const maxDockY = isMobile ? window.innerHeight - 160 : window.innerHeight - 100;
        setDockY((prev) => Math.max(minDockY, Math.min(prev, maxDockY)));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [savedPosition, isDocked]);

  const handleDragEnd = (event: any, info: any) => {
    if (!timerRef.current) return;

    const rect = timerRef.current.getBoundingClientRect();

    // Clamp coordinates to keep inside the viewport (prevent dragging outside visible app)
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    const clampedX = Math.max(0, Math.min(rect.left, maxX));
    const clampedY = Math.max(0, Math.min(rect.top, maxY));

    // Save position
    setSavedPosition({ x: clampedX, y: clampedY });

    // Check for docking within 40-60px threshold from either left/right viewport edge
    const dockThreshold = 60;
    if (clampedX < dockThreshold) {
      setDockSide("left");

      const isMobile = window.innerWidth < 768;
      const minDockY = isMobile ? 80 : 40;
      const maxDockY = isMobile ? window.innerHeight - 160 : window.innerHeight - 100;
      const finalDockY = Math.max(minDockY, Math.min(clampedY, maxDockY));

      setDockY(finalDockY);
      setIsDocked(true);
    } else if (window.innerWidth - (clampedX + rect.width) < dockThreshold) {
      setDockSide("right");

      const isMobile = window.innerWidth < 768;
      const minDockY = isMobile ? 80 : 40;
      const maxDockY = isMobile ? window.innerHeight - 160 : window.innerHeight - 100;
      const finalDockY = Math.max(minDockY, Math.min(clampedY, maxDockY));

      setDockY(finalDockY);
      setIsDocked(true);
    }
  };

  useEffect(() => {
    if (!activeTimer) {
      setRemaining(null);
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

      const remainingSeconds = Math.max(
        0,
        activeTimer.durationSeconds - Math.floor(elapsedTotal / 1000),
      );
      return remainingSeconds;
    };

    const rem = calculateRemaining();
    setRemaining(rem);

    if (rem <= 0 && !activeTimer.isPaused) {
      completeSession();
      return;
    }

    let intervalId: any;
    if (!activeTimer.isPaused) {
      intervalId = setInterval(() => {
        const currentRem = calculateRemaining();
        setRemaining(currentRem);

        if (currentRem <= 0) {
          // Session complete!
          clearInterval(intervalId);
          completeSession();
        }
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTimer]);

  const completeSession = () => {
    if (!activeTimer) return;

    // Convert duration back to minutes for the progress logic
    const durationMinutes = Math.round(activeTimer.durationSeconds / 60);

    addFocusSession(
      activeTimer.taskId,
      durationMinutes,
      new Date(activeTimer.startTimestamp).toISOString(),
    );

    // Clear timer
    updateUserState({ activeTimer: undefined });
  };

  const togglePause = () => {
    if (!activeTimer) return;
    const now = Date.now();
    if (activeTimer.isPaused) {
      // Resuming
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
      // Pausing
      updateUserState({
        activeTimer: {
          ...activeTimer,
          isPaused: true,
          pauseStartTimestamp: now,
        },
      });
    }
  };

  const cancelTimer = () => {
    updateUserState({ activeTimer: undefined });
  };

  const openFullscreen = () => {
    navigate(`/app/training?taskId=${activeTimer?.taskId}`);
  };

  if (!activeTimer) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const task = tasks.find((t) => t.id === activeTimer.taskId);

  // If we are on the training page, the timer logic still runs in the background above,
  // but we don't render the floating widget.
  if (isTrainingPage) return null;

  return (
    <AnimatePresence mode="wait">
      {isDocked ? (
        <motion.button
          key="docked-bubble"
          initial={{ scale: 0.8, x: dockSide === "left" ? -50 : 50, opacity: 0 }}
          animate={{ scale: 1, x: 0, opacity: 1 }}
          exit={{ scale: 0.8, x: dockSide === "left" ? -50 : 50, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={() => setIsDocked(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsDocked(false);
            }
          }}
          className={`fixed z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(31,164,99,0.4)] border-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]/90 backdrop-blur-md text-[var(--accent-primary)] font-mono font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            dockSide === "left"
              ? "left-[-28px] sm:left-[-32px] hover:left-[-12px]"
              : "right-[-28px] sm:right-[-32px] hover:right-[-12px]"
          }`}
          style={{ top: dockY }}
          aria-label={`Restore Focus Timer (${remaining !== null ? Math.ceil(remaining / 60) : "--"} minutes remaining)`}
        >
          <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-tighter leading-none mb-0.5">
            ⏱
          </span>
          <span className="text-xs sm:text-sm font-black leading-none">
            {remaining !== null ? Math.ceil(remaining / 60) : "--"}
          </span>
        </motion.button>
      ) : (
        <motion.div
          key="floating-timer"
          ref={timerRef}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          drag
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={
            savedPosition
              ? {
                  position: "fixed",
                  left: savedPosition.x,
                  top: savedPosition.y,
                  bottom: "auto",
                  right: "auto",
                }
              : undefined
          }
          className="fixed bottom-6 right-6 w-64 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-50 overflow-hidden cursor-move touch-none"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${activeTimer.isPaused ? "bg-amber-500" : "bg-green-500 animate-pulse"}`}
              />
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest truncate max-w-[120px]">
                {task?.title || "Focus Session"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={openFullscreen}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Maximize2 size={12} />
              </button>
              <button
                onClick={cancelTimer}
                className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 flex flex-col items-center justify-center">
            <div className="text-4xl font-mono font-black text-[var(--text-primary)] tracking-tighter mb-4">
              {remaining !== null ? formatTime(remaining) : "--:--"}
            </div>

            <button
              onClick={togglePause}
              className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTimer.isPaused
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black"
                  : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)]"
              }`}
            >
              {activeTimer.isPaused ? <Play size={14} /> : <Pause size={14} />}
              {activeTimer.isPaused ? "Resume" : "Pause"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
