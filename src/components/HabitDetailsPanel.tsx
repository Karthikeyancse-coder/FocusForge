import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Edit, Trash2, Save, RefreshCw, Calendar, Clock, Award, Star, Flame, CheckCircle, HelpCircle } from "lucide-react";
import { Habit } from "../types";
import { format, subDays, isBefore, isAfter, parseISO, isSameDay } from "date-fns";

interface HabitDetailsPanelProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string, updates: Partial<Habit>) => void;
  onDelete?: (id: string) => void;
  onToggleDate?: (id: string, dateStr: string) => void;
}

export function HabitDetailsPanel({
  habit,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleDate
}: HabitDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<any>("Academic");
  const [editRepeatPattern, setEditRepeatPattern] = useState<any>("Daily");
  const [editDuration, setEditDuration] = useState(30);
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("09:30");
  const [isDeleteVerifying, setIsDeleteVerifying] = useState(false);

  useEffect(() => {
    if (habit) {
      setEditName(habit.name);
      setEditCategory(habit.category);
      setEditRepeatPattern(habit.repeatPattern);
      setEditDuration(habit.duration);
      setEditStartTime(habit.startTime || "09:00");
      setEditEndTime(habit.endTime || "09:30");
      setIsEditing(false);
      setIsDeleteVerifying(false);
    }
  }, [habit, isOpen]);

  if (!habit) return null;

  const handleSave = () => {
    if (onEdit) {
      onEdit(habit.id, {
        name: editName,
        category: editCategory,
        repeatPattern: editRepeatPattern,
        duration: editDuration,
        startTime: editStartTime,
        endTime: editEndTime,
        color: editCategory === "Health" ? "#10B981" : editCategory === "Career" ? "#3B82F6" : editCategory === "Personal" ? "#F59E0B" : "#A855F7",
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (isDeleteVerifying) {
      if (onDelete) {
        onDelete(habit.id);
      }
      onClose();
    } else {
      setIsDeleteVerifying(true);
    }
  };

  // Generate last 30 days list
  const past30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), 29 - i); // oldest to newest
    return d;
  });

  const totalCompletions = habit.completedDates.length;
  
  // Calculate completion rate based on how many days the habit has been active (max 30 days)
  const calculateCompletionRate = () => {
    const start = new Date(habit.startDate + "T00:00:00");
    const today = new Date();
    const totalDaysActive = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const relevantDays = Math.min(30, totalDaysActive);
    
    // Count completions in those last days
    const completionsInLastDays = past30Days.filter(d => {
      const dStr = format(d, "yyyy-MM-dd");
      return habit.completedDates.includes(dStr);
    }).length;

    return Math.round((completionsInLastDays / relevantDays) * 100);
  };

  const completionRate = calculateCompletionRate();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={onClose}
          ></motion.div>

          {/* Drawer content */}
          <motion.div
            key={habit.id}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md h-full bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] relative z-[9999] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 font-display font-bold text-xl flex-1 mr-4 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <RefreshCw size={20} className="text-purple-500 animate-spin-slow shrink-0" />
                  <h2 className="font-display font-bold text-xl text-[var(--text-primary)] truncate">
                    {habit.name}
                  </h2>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 border border-[var(--border-subtle)] rounded-full text-[var(--text-muted)] hover:text-white bg-[var(--bg-primary)] transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Habit Details Block */}
              <div className="bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] rounded-2xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 flex justify-between items-center">
                  <span>Habit Directives</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Active since {habit.startDate}
                  </span>
                </h3>

                {isEditing ? (
                  <div className="space-y-3 text-sm text-[var(--text-primary)]">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-purple-500"
                      >
                        <option value="Academic">Study</option>
                        <option value="Health">Health</option>
                        <option value="Career">Career</option>
                        <option value="Personal">Personal</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Repeat Pattern</label>
                        <select
                          value={editRepeatPattern}
                          onChange={(e) => setEditRepeatPattern(e.target.value)}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-purple-500"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Duration</label>
                        <select
                          value={editDuration}
                          onChange={(e) => setEditDuration(Number(e.target.value))}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-purple-500"
                        >
                          <option value={15}>15 mins</option>
                          <option value={30}>30 mins</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Start Time</label>
                        <input
                          type="time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">End Time</label>
                        <input
                          type="time"
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(e.target.value)}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Pattern</div>
                        <div className="text-sm font-extrabold text-[var(--text-primary)]">{habit.repeatPattern}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Duration</div>
                        <div className="text-sm font-extrabold text-[var(--text-primary)]">{habit.duration} mins</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 col-span-2">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Scheduled Window</div>
                        <div className="text-sm font-extrabold text-[var(--text-primary)]">{habit.startTime} - {habit.endTime}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Analytics Dashboard */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-3">
                  Habit Analytics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Streak Card */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/40 transition-all">
                    <div className="absolute top-3 right-3 text-orange-500/20 group-hover:scale-110 transition-transform">
                      <Flame size={32} />
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Current Streak</div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-orange-500">{habit.streak}</span>
                      <span className="text-xs font-bold text-orange-400">days</span>
                    </div>
                    <div className="text-[10px] text-orange-500/80 font-bold mt-1 flex items-center gap-1">
                      <span>🔥 Keep it up!</span>
                    </div>
                  </div>

                  {/* Longest Streak */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
                    <div className="absolute top-3 right-3 text-amber-500/20 group-hover:scale-110 transition-transform">
                      <Award size={32} />
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Longest Streak</div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-amber-500">{habit.longestStreak || habit.streak}</span>
                      <span className="text-xs font-bold text-amber-400">days</span>
                    </div>
                    <div className="text-[10px] text-amber-500/80 font-bold mt-1">
                      👑 Personal Record
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-all">
                    <div className="absolute top-3 right-3 text-blue-500/20 group-hover:scale-110 transition-transform">
                      <CheckCircle size={32} />
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Completion Rate</div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-blue-500">{completionRate}%</span>
                    </div>
                    <div className="text-[10px] text-blue-500/80 font-bold mt-1">
                      📊 Last 30 Days
                    </div>
                  </div>

                  {/* Total Completions */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    <div className="absolute top-3 right-3 text-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Star size={32} />
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Actions</div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-emerald-500">{totalCompletions}</span>
                      <span className="text-xs font-bold text-emerald-400">times</span>
                    </div>
                    <div className="text-[10px] text-emerald-500/80 font-bold mt-1">
                      ⭐ Total completions
                    </div>
                  </div>

                </div>
              </div>

              {/* Interactive Log Calendar Matrix (Last 30 Days) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Historical Record Log
                  </h3>
                  <span className="text-[9px] text-[var(--text-muted)] italic">Click dates to toggle history</span>
                </div>

                {/* 30-day matrix */}
                <div className="grid grid-cols-6 gap-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4">
                  {past30Days.map((date, idx) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const isCompleted = habit.completedDates.includes(dateStr);
                    const isBeforeStart = dateStr < habit.startDate;
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isBeforeStart}
                        onClick={() => {
                          if (onToggleDate) {
                            onToggleDate(habit.id, dateStr);
                          }
                        }}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl border text-xs font-semibold transition-all relative
                          ${isBeforeStart 
                            ? "bg-transparent border-transparent text-[var(--text-muted)]/10 cursor-not-allowed" 
                            : isCompleted 
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/10 hover:bg-emerald-500/30"
                              : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-purple-500 hover:bg-purple-500/5"
                          }`}
                      >
                        <span className="text-[10px] leading-none mb-0.5">{format(date, "d")}</span>
                        <span className="text-[8px] opacity-60 font-mono scale-90">{format(date, "MMM")}</span>
                        {isCompleted && !isBeforeStart && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-black rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 grid grid-cols-2 gap-4 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="py-3 px-4 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="py-3 px-4 rounded-xl bg-purple-600 text-white hover:bg-purple-500 font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Directives
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDelete}
                    className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 
                      ${isDeleteVerifying 
                        ? "bg-red-600/20 border-red-500 text-red-500 animate-pulse hover:bg-red-600 hover:text-white" 
                        : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5"
                      }`}
                  >
                    <Trash2 size={16} /> {isDeleteVerifying ? "Double click to delete!" : "Delete Habit"}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="py-3 px-4 rounded-xl bg-purple-600 text-white hover:bg-purple-500 font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit size={16} /> Edit Directives
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
