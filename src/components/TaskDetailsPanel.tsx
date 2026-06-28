import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, CheckCircle, Pin, Edit, Trash2, Save, Activity } from "lucide-react";
import { Task } from "../types";
import { cn } from "../lib/utils";

interface TaskDetailsPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (updates: Partial<Task>) => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onPin?: () => void;
}

export function TaskDetailsPanel({ task, isOpen, onClose, onEdit, onDelete, onComplete, onPin }: TaskDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      try {
        if (task.deadline) {
          setEditDeadline(new Date(task.deadline).toISOString().split("T")[0]);
        }
      } catch (e) {
        setEditDeadline("");
      }
      setIsEditing(false); // Reset edit mode on task change
    }
  }, [task, isOpen]);

  useEffect(() => {
    const event = new CustomEvent("task-drawer-toggle", { detail: { open: isOpen } });
    window.dispatchEvent(event);
    return () => {
      window.dispatchEvent(new CustomEvent("task-drawer-toggle", { detail: { open: false } }));
    };
  }, [isOpen]);

  const handleSave = () => {
    if (onEdit && task) {
      const updates: Partial<Task> = {
        title: editTitle,
        description: editDescription,
      };
      if (!task.workspaceId && editDeadline) {
        updates.deadline = new Date(`${editDeadline}T23:59:59`).toISOString();
      }
      onEdit(updates);
    }
    setIsEditing(false);
  };
  return (
    <AnimatePresence mode="wait">
      {isOpen && task && (
        <div className="fixed inset-0 z-[9000] flex justify-end items-start md:items-stretch">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={onClose}
          ></motion.div>
          <motion.div
            key={task.id} // Ensures new drawer mounts on task change
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md h-[calc(100dvh-120px)] md:h-full bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] border-b md:border-b-0 relative z-[9999] flex flex-col shadow-2xl rounded-bl-3xl md:rounded-none"
          >
            <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 font-display font-bold text-xl flex-1 mr-4 focus:outline-none focus:border-[var(--accent-primary)]"
                  autoFocus
                />
              ) : (
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] truncate max-w-[250px]">
                  {task.title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="p-2 border border-[var(--border-subtle)] rounded-full text-[var(--text-muted)] hover:text-white bg-[var(--bg-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-[220px] md:pb-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-3 flex justify-between items-center">
                  <span>Quest Directives</span>
                  {isEditing && !task.workspaceId && (
                    <input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                    />
                  )}
                </h3>
                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm border border-[var(--border-subtle)] rounded-lg p-3 min-h-[100px] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                    placeholder="No parameters provided."
                  />
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                    {task.description || "No parameters provided."}
                  </p>
                )}
              </div>

              {/* Planned Work Blocks */}
              {task.plannedState?.plannedWorkBlocks && task.plannedState.plannedWorkBlocks.length > 0 && (
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                    AI Suggested Itinerary
                  </h3>
                  <div className="space-y-3">
                    {task.plannedState.plannedWorkBlocks.map((block: any, idx: number) => {
                       const startDate = new Date(block.start);
                       const isValid = !isNaN(startDate.getTime());
                       const dateStr = isValid ? startDate.toLocaleDateString() : "Unknown";
                       const timeStr = isValid ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Unknown";
                       
                       return (
                         <div key={idx} className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                               <span className="font-bold text-sm text-[var(--text-primary)]">{block.stepName || `Session ${idx + 1}`}</span>
                               <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded-md">{block.durationMinutes || 0}m</span>
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                               Start: {dateStr} at {timeStr}
                            </div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              )}

              {/* Risk Matrix */}
              {!task.workspaceId && (
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                  Risk Matrix
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        Completion Probability
                      </span>
                      <span className="font-mono text-xs text-emerald-400">
                        {((task.riskEngine?.completionProbability || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${(task.riskEngine?.completionProbability || 0) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[var(--text-secondary)]">
                      Reality Gap
                    </span>
                    <span className="text-sm font-bold text-warning">
                      {task.riskEngine?.breakdown?.progressGap?.toFixed(1) || "0.0"}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[var(--text-secondary)]">
                      Risk Tier
                    </span>
                    <span
                      className={cn(
                        "text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded",
                        task.riskEngine?.riskTier === "Red"
                          ? "bg-red-500/20 text-red-400"
                          : task.riskEngine?.riskTier === "Yellow"
                            ? "bg-warning/20 text-warning"
                            : "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {task.riskEngine?.riskTier}
                    </span>
                  </div>
                </div>
              </div>
              )}

              {/* AI Insights & Evolution */}
              {!task.workspaceId && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500/70 mb-3 flex items-center gap-2">
                  <Sparkles size={14} /> AI Insights
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                  "Consistent momentum on tasks matching the {task.category} category
                  yields strong evolution rates. Suggestion: Dedicate 90m deep work
                  session today."
                </p>
              </div>
              )}

              {/* Post-Mortem Summary (If Completed Late or Accepted) */}
              {!task.workspaceId && (task.acceptAndLearn || (task.realityState.completedAt && task.deadline && new Date(task.realityState.completedAt).getTime() > new Date(task.deadline).getTime())) && (
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
                    <Activity size={14} /> Post-Mortem (Late Completion)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)]">Estimated Effort</span>
                      <span className="font-mono text-[var(--text-primary)]">{task.estimatedEffortHours}h</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)]">Actual Effort</span>
                      <span className="font-mono text-red-400">{(task.realityState.focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60).toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-[var(--border-subtle)] pt-2">
                      <span className="text-[var(--text-secondary)]">Planned Start</span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {task.plannedState.plannedWorkBlocks && task.plannedState.plannedWorkBlocks.length > 0 
                          ? (!isNaN(new Date(task.plannedState.plannedWorkBlocks[0].start).getTime()) ? new Date(task.plannedState.plannedWorkBlocks[0].start).toLocaleDateString() : "Invalid Date")
                          : "Not planned"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)]">Actual Start</span>
                      <span className="font-mono text-red-400">
                        {task.realityState.focusSessions.length > 0 
                          ? (!isNaN(Math.min(...task.realityState.focusSessions.map(s => new Date(s.date).getTime()))) ? new Date(Math.min(...task.realityState.focusSessions.map(s => new Date(s.date).getTime()))).toLocaleDateString() : "Invalid Date")
                          : "No sessions"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold border-t border-[var(--border-subtle)] pt-2">
                      <span className="text-red-400">Total Lag</span>
                      <span className="font-mono text-red-400">
                        {(((task.realityState.completedAt ? new Date(task.realityState.completedAt).getTime() : new Date().getTime()) - new Date(task.deadline).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours late
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <CheckCircle size={14} className="text-emerald-500" />{" "}
                {task.realityState.effectivePercent}% Sync
              </span>
              <span className="text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">
                +{(task.estimatedEffortHours || 0) * 50} XP Reward
              </span>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 grid grid-cols-4 gap-2">
              <button
                onClick={() => {
                  if (onPin) onPin();
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                  task.isPinned 
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" 
                    : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                )}
                title="Pin Task"
              >
                <Pin size={16} className={task.isPinned ? "fill-current" : ""} />
                <span className="text-[10px] uppercase font-bold mt-1">Pin</span>
              </button>

              <button
                onClick={() => {
                  if (onComplete) onComplete();
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                  task.realityState.effectivePercent >= 100
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                    : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-emerald-500/50 hover:text-emerald-500"
                )}
                title="Mark Completed"
              >
                <CheckCircle size={16} />
                <span className="text-[10px] uppercase font-bold mt-1">Done</span>
              </button>

              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-all"
                  title="Save Task"
                >
                  <Save size={16} />
                  <span className="text-[10px] uppercase font-bold mt-1">Save</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-amber-500/50 hover:text-amber-500 transition-all"
                  title="Edit Task"
                >
                  <Edit size={16} />
                  <span className="text-[10px] uppercase font-bold mt-1">Edit</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (onDelete) onDelete();
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-red-500/50 hover:text-red-500 transition-all"
                title="Delete Task"
              >
                <Trash2 size={16} />
                <span className="text-[10px] uppercase font-bold mt-1">Delete</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
