import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MoreVertical,
  Pin,
  Edit2,
  Copy,
  FileText,
  BrainCircuit,
  Calendar,
  CheckCircle,
  Trash2,
  X,
  Sparkles,
  Play,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { Task } from "../types";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

import { useWorkspace } from "../context/WorkspaceContext";

interface TaskContextMenuProps {
  task: Task;
  onViewDetails?: () => void;
}

export default function TaskContextMenu({ task, onViewDetails }: TaskContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecoveryPlan, setShowRecoveryPlan] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteTask, duplicateTask, updateTask, confirmTaskProgress, userState } =
    useUser();
  const { userId, updateWorkspaceTask, deleteWorkspaceTask, confirmWorkspaceTaskProgress, addWorkspaceTask } = useWorkspace();
  const navigate = useNavigate();

  // Determine if current user is owner
  const currentUserId = userId || userState?.id;
  const isOwner = !(task as any).ownerId || (task as any).ownerId === currentUserId;

  const isWorkspaceTask = !!(task as any).workspaceId;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowDeleteConfirm(false);
        setShowRecoveryPlan(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  // "Hook" sounds (dummy implementations)
  const playSound = (type: string) => {
    // console.log(`Playing sound: ${type}`);
  };

  const handlePin = () => {
    if (isWorkspaceTask) {
      updateWorkspaceTask(task.id, { isPinned: !task.isPinned });
    } else {
      updateTask(task.id, { isPinned: !task.isPinned });
    }
    playSound("pin");
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    if (isWorkspaceTask) {
      addWorkspaceTask(task);
    } else {
      duplicateTask(task.id);
    }
    setIsOpen(false);
  };

  const handleComplete = () => {
    if (isWorkspaceTask) {
      confirmWorkspaceTaskProgress(task.id, 100);
    } else {
      confirmTaskProgress(task.id, 100);
    }
    playSound("complete");
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (isWorkspaceTask) {
      deleteWorkspaceTask(task.id);
    } else {
      deleteTask(task.id);
    }
    playSound("delete");
    setShowDeleteConfirm(false);
    setIsOpen(false);
  };

  const handleCalendar = () => {
    navigate("/app/calendar");
    setIsOpen(false);
  };

  return (
    <div
      className={cn("relative", isOpen ? "z-50" : "")}
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      data-state={isOpen ? "open" : "closed"}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors active:scale-95"
      >
        <MoreVertical size={18} />
      </button>

      <AnimatePresence>
        {isOpen && !showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-secondary)]/90 backdrop-blur-xl border border-[var(--border-subtle)] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
          >
            <div className="py-2">
              <button
                onClick={handlePin}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] transition-colors text-left group"
              >
                <Pin
                  size={16}
                  className={
                    task.isPinned
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
                  }
                />
                {task.isPinned ? "Unpin Task" : "Pin Task"}
              </button>
              {isOwner && (
                <button
                  onClick={() => {
                    if (onViewDetails) onViewDetails();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] transition-colors text-left group"
                >
                  <Edit2
                    size={16}
                    className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
                  />{" "}
                  Edit Task
                </button>
              )}
              <button
                onClick={() => {
                  navigate(`/app/training?taskId=${task.id}`);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] transition-colors text-left group"
              >
                <Play
                  size={16}
                  className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
                />{" "}
                Focus Now
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] transition-colors text-left group"
              >
                <Copy
                  size={16}
                  className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
                />{" "}
                Duplicate Task
              </button>
              <button
                onClick={() => {
                  if (onViewDetails) {
                    onViewDetails();
                  }
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] transition-colors text-left group"
              >
                <FileText
                  size={16}
                  className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
                />{" "}
                View Details
              </button>
              <div className="h-px bg-[var(--border-subtle)] my-1 mx-2" />
              <button
                onClick={() => {
                  setShowRecoveryPlan(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/20 transition-colors text-left group"
              >
                <BrainCircuit
                  size={16}
                  className="text-cyan-500 group-hover:text-cyan-400"
                />{" "}
                Generate AI Recovery
              </button>
              <button
                onClick={handleCalendar}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] transition-colors text-left group"
              >
                <Calendar
                  size={16}
                  className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]"
                />{" "}
                Move to Calendar
              </button>
              <div className="h-px bg-[var(--border-subtle)] my-1 mx-2" />
              <button
                onClick={handleComplete}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors text-left group"
              >
                <CheckCircle
                  size={16}
                  className="text-emerald-500 group-hover:text-emerald-400"
                />{" "}
                Mark Complete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors text-left group"
              >
                <Trash2
                  size={16}
                  className="text-red-500 group-hover:text-red-400"
                />{" "}
                Delete Task
              </button>
            </div>
          </motion.div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            ></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--bg-secondary)] border border-red-500/30 rounded-2xl p-6 relative w-full max-w-sm shadow-[0_10px_40px_rgba(239,68,68,0.2)] z-[101]"
            >
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                Delete Quest?
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* AI Recovery Plan Modal Placeholder */}
        {showRecoveryPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRecoveryPlan(false)}
            ></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[var(--bg-secondary)] border border-cyan-500/30 rounded-3xl p-6 relative w-full max-w-lg shadow-[0_10px_50px_rgba(6,182,212,0.15)] z-[101]"
            >
              <button
                onClick={() => setShowRecoveryPlan(false)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white p-1 bg-[var(--bg-primary)] rounded-full border border-[var(--border-subtle)]"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <BrainCircuit size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-white">
                    AI Recovery Plan
                  </h3>
                  <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    Target: {task.title}
                  </p>
                </div>
              </div>

              <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)] mb-6">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-cyan-500/50 pl-3">
                  "FocusForge AI suggests breaking this task into 3 manageable
                  blocks over the next 48 hours to minimize burnout risk while
                  guaranteeing deadline delivery."
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-cyan-500/5 p-3 rounded-lg border border-cyan-500/10">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    Today, 8:00 PM
                  </span>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                    2 Hours
                  </span>
                </div>
                <div className="flex justify-between items-center bg-cyan-500/5 p-3 rounded-lg border border-cyan-500/10">
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    Tomorrow, 10:00 AM
                  </span>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                    3 Hours
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowRecoveryPlan(false)}
                className="w-full py-3 bg-cyan-500 text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                Accept Plan & Auto-Schedule
              </button>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
