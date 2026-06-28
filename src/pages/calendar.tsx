import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Task, Habit } from '../types';
import { format, addDays, startOfDay, setHours, isSameDay, isBefore, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isValid, parseISO } from 'date-fns';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BrainCircuit, Plus, Calendar as CalendarIcon, Clock, Activity, Zap, RefreshCw, Trash2, X } from 'lucide-react';
import { TaskDetailsPanel } from '../components/TaskDetailsPanel';
import { HabitDetailsPanel } from '../components/HabitDetailsPanel';

const shouldRenderHabitOnDay = (h: Habit, d: Date): boolean => {
  const dStr = format(d, 'yyyy-MM-dd');
  if (dStr < h.startDate) return false;

  const start = new Date(h.startDate + 'T00:00:00');
  const check = new Date(dStr + 'T00:00:00');

  if (h.repeatPattern === "Daily") {
    return true;
  }
  if (h.repeatPattern === "Weekly") {
    return start.getDay() === check.getDay();
  }
  if (h.repeatPattern === "Monthly") {
    return start.getDate() === check.getDate();
  }
  if (h.repeatPattern === "Yearly") {
    return start.getDate() === check.getDate() && start.getMonth() === check.getMonth();
  }
  return true;
};

const getHabitDatesOnDay = (h: Habit, d: Date) => {
  const [sh, sm] = h.startTime.split(':').map(Number);
  const [eh, em] = h.endTime.split(':').map(Number);
  
  const startDate = new Date(d);
  startDate.setHours(sh, sm, 0, 0);
  
  const endDate = new Date(d);
  endDate.setHours(eh, em, 0, 0);
  
  return { startDate, endDate };
};

const isHabitCompletedOnDay = (h: Habit, d: Date): boolean => {
  const dStr = format(d, 'yyyy-MM-dd');
  return h.completedDates.includes(dStr);
};

export default function Calendar() {
  const { 
    userState, 
    tasks, 
    habits,
    addTask, 
    updateBusyBlocks, 
    updateTask, 
    deleteTask, 
    confirmTaskProgress,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    toggleHabitDate
  } = useUser();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Task Creation States
  const [taskName, setTaskName] = useState("");
  const [estHours, setEstHours] = useState<number>(2);
  const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");

  // Habit Creation States
  const [habitName, setHabitName] = useState("");
  const [habitCategory, setHabitCategory] = useState("Academic");
  const [habitDuration, setHabitDuration] = useState(30);
  const [habitRepeatPattern, setHabitRepeatPattern] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly" | "Custom">("Daily");
  const [habitValidationError, setHabitValidationError] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedHabitDate, setSelectedHabitDate] = useState<string | null>(null);
  const [isHabitDetailsOpen, setIsHabitDetailsOpen] = useState(false);

  const handleDragStartBlock = (e: React.DragEvent, taskId: string, blockIdx: number) => {
    e.dataTransfer.setData("application/focusforge-block", JSON.stringify({ taskId, blockIdx }));
  };

  const handleDropBlock = (e: React.DragEvent, d: Date, slot: number) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("application/focusforge-block");
      if (!dataStr) return;
      const { taskId, blockIdx } = JSON.parse(dataStr);
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const blocks = [...(task.plannedState?.plannedWorkBlocks || [])];
      const block = blocks[blockIdx];
      if (!block) return;
      
      const originalStart = new Date(block.start);
      const originalEnd = new Date(block.end);
      const durationMs = originalEnd.getTime() - originalStart.getTime();
      
      const newStart = new Date(d);
      newStart.setHours(Math.floor(slot), Math.round((slot % 1) * 60), 0, 0);
      
      const newEnd = new Date(newStart.getTime() + durationMs);
      
      blocks[blockIdx] = {
        ...block,
        start: newStart.toISOString(),
        end: newEnd.toISOString()
      };
      
      let updates: Partial<Task> = {
        plannedState: {
          ...task.plannedState,
          plannedWorkBlocks: blocks
        }
      };
      
      if (newEnd > new Date(task.deadline)) {
        updates.deadline = newEnd.toISOString();
      }
      
      updateTask(taskId, updates);
    } catch (err) {
      console.error("Error dropping block:", err);
    }
  };
  const [searchParams, setSearchParams] = useSearchParams();
  
  const weekScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHourDecimal = useMemo(() => {
    return currentTime.getHours() + currentTime.getMinutes() / 60 + currentTime.getSeconds() / 3600;
  }, [currentTime]);

  // Right click context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, date: Date } | null>(null);

  const removeBusyBlock = (e: React.MouseEvent, blockToRemove: {start: string, end: string}) => {
     e.stopPropagation();
     updateBusyBlocks(userState.busyBlocks.filter(b => b.start !== blockToRemove.start || b.end !== blockToRemove.end));
  };

  // Drag selection state
  type CreationModeType = 'Task' | 'Habit' | 'Focus' | 'Busy' | 'Workspace Event';
  const [isDragging, setIsDragging] = useState(false);
  const [dragSelection, setDragSelection] = useState<{ start: { date: string, hour: number }, end: { date: string, hour: number } } | null>(null);
  const [creationMode, setCreationMode] = useState<CreationModeType | null>(null);
  const [showModalFor, setShowModalFor] = useState<CreationModeType | null>(null);
  const [intelExpanded, setIntelExpanded] = useState(false);
  const [capacityExpanded, setCapacityExpanded] = useState(false);

  const handleMouseDown = (date: Date, hour: number) => {
    if (!creationMode) return;
    setIsDragging(true);
    setDragSelection({ start: { date: date.toISOString(), hour }, end: { date: date.toISOString(), hour } });
    setShowModalFor(null);
  };

  const handleMouseEnter = (date: Date, hour: number) => {
    if (!creationMode) return;
    if (isDragging && dragSelection) {
      setDragSelection({ ...dragSelection, end: { date: date.toISOString(), hour } });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && dragSelection) {
      setIsDragging(false);
      setShowModalFor(creationMode);
      setCreationMode(null);
    }
  };

  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (isDragging && dragSelection && creationMode) {
        setIsDragging(false);
        setShowModalFor(creationMode);
        setCreationMode(null);
      } else if (isDragging) {
        setIsDragging(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCreationMode(null);
        if (isDragging) setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDragging, dragSelection, creationMode]);

  const handleSave = () => {
    if (showModalFor === 'Busy' && dragSelection) {
      const startHour = Math.min(dragSelection.start.hour, dragSelection.end.hour);
      const endHour = Math.max(dragSelection.start.hour, dragSelection.end.hour) + 1;
      const startDate = new Date(dragSelection.start.date);
      startDate.setHours(startHour, 0, 0, 0);
      
      const endDate = new Date(dragSelection.start.date);
      endDate.setHours(endHour, 0, 0, 0);
      
      updateBusyBlocks([...userState.busyBlocks, {
          start: startDate.toISOString(),
          end: endDate.toISOString()
      }]);
    } else if (showModalFor === 'Task' && dragSelection) {
      const startHour = Math.min(dragSelection.start.hour, dragSelection.end.hour);
      const endHour = Math.max(dragSelection.start.hour, dragSelection.end.hour) + 1;
      const startDate = new Date(dragSelection.start.date);
      startDate.setHours(startHour, 0, 0, 0);
      
      const endDate = new Date(dragSelection.start.date);
      endDate.setHours(endHour, 0, 0, 0);

      addTask({
        title: taskName || "Untitled Task",
        estimatedEffortHours: estHours || (endHour - startHour) || 2,
        importance: {
          aiSuggested: priority,
          userOverride: null,
          final: priority,
        },
        deadline: endDate.toISOString(),
        createdFrom: "Calendar",
        taskType: "One-Time",
        plannedState: {
          expectedProgressCurve: [
            { date: startDate.toISOString(), expectedPercent: 0 },
            { date: endDate.toISOString(), expectedPercent: 100 },
          ],
          plannedWorkBlocks: [
            {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              stepName: "Scheduled block",
            }
          ]
        }
      });
      setTaskName("");
      setEstHours(2);
      setPriority("Medium");
    } else if (showModalFor === 'Habit' && dragSelection) {
      if (!habitName.trim()) {
        setHabitValidationError("Habit name cannot be empty.");
        return;
      }
      if (!habitCategory) {
        setHabitValidationError("Category is required.");
        return;
      }
      if (!habitDuration) {
        setHabitValidationError("Duration is required.");
        return;
      }
      if (!habitRepeatPattern) {
        setHabitValidationError("Repeat pattern is required.");
        return;
      }

      setHabitValidationError(null);

      const startHour = Math.min(dragSelection.start.hour, dragSelection.end.hour);
      const endHour = Math.max(dragSelection.start.hour, dragSelection.end.hour) + (habitDuration / 60);
      const startDateStr = dragSelection.start.date;

      const formatTime = (hourDecimal: number) => {
        const h = Math.floor(hourDecimal);
        const m = Math.round((hourDecimal % 1) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };

      addHabit({
        name: habitName,
        category: habitCategory as any,
        duration: habitDuration,
        repeatPattern: habitRepeatPattern,
        startDate: startDateStr,
        startTime: formatTime(startHour),
        endTime: formatTime(endHour),
        color: habitCategory === "Health" ? "#10B981" : habitCategory === "Career" ? "#3B82F6" : habitCategory === "Personal" ? "#F59E0B" : "#A855F7",
        completedDates: [],
        streak: 0,
        longestStreak: 0,
        xpPerCompletion: 40,
        workspaceId: null
      });

      setHabitName("");
      setHabitCategory("Academic");
      setHabitDuration(30);
      setHabitRepeatPattern("Daily");
    }
    
    setShowModalFor(null);
    setDragSelection(null);
  };

  const view = (searchParams.get('view') as 'day' | 'week' | 'month' | 'year') || 'week';
  
  const currentDate = useMemo(() => {
    let d = new Date();
    if (view === 'day' || view === 'week') {
      const dateStr = searchParams.get('date');
      if (dateStr) {
        const parsed = parseISO(dateStr);
        if (isValid(parsed)) d = parsed;
      }
    } else if (view === 'month') {
      const y = searchParams.get('year');
      const m = searchParams.get('month');
      if (y && m) {
        d = new Date(Number(y), Number(m) - 1, 1);
      }
    } else if (view === 'year') {
      const y = searchParams.get('year');
      if (y) d = new Date(Number(y), 0, 1);
    }
    return d;
  }, [searchParams, view]);

  useEffect(() => {
    if (view === 'week' && weekScrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const scrollTarget = Math.max(0, (currentHour - 2) * 60);
      setTimeout(() => {
        weekScrollRef.current?.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }, 150);
    }
  }, [view, currentDate]);

  useEffect(() => {
    if (view === 'day' && dayScrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const scrollTarget = Math.max(0, (currentHour - 2) * 60);
      setTimeout(() => {
        dayScrollRef.current?.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }, 150);
    } else if (view === 'week') {
      setTimeout(() => {
        const headerId = `week-day-header-${format(currentDate, 'yyyy-MM-dd')}`;
        const el = document.getElementById(headerId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 150);
    } else if (view === 'month' || view === 'year') {
      setTimeout(() => {
        if (window.innerWidth < 768) {
          const mainScroll = document.querySelector('.app-root-bg');
          if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  }, [view, currentDate]);

  const navigateToView = (newView: 'day' | 'week' | 'month' | 'year', date: Date) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', newView);
    if (newView === 'day' || newView === 'week') {
      params.set('date', format(date, 'yyyy-MM-dd'));
      params.delete('year');
      params.delete('month');
    } else if (newView === 'month') {
      params.set('year', format(date, 'yyyy'));
      params.set('month', format(date, 'M'));
      params.delete('date');
    } else if (newView === 'year') {
      params.set('year', format(date, 'yyyy'));
      params.delete('month');
      params.delete('date');
    }
    setSearchParams(params);
  };

  const handlePrev = () => {
    if (view === 'month') navigateToView(view, subMonths(currentDate, 1));
    else if (view === 'week') navigateToView(view, addDays(currentDate, -7));
    else if (view === 'day') navigateToView(view, addDays(currentDate, -1));
    else navigateToView(view, subMonths(currentDate, 12));
  };

  const handleNext = () => {
    if (view === 'month') navigateToView(view, addMonths(currentDate, 1));
    else if (view === 'week') navigateToView(view, addDays(currentDate, 7));
    else if (view === 'day') navigateToView(view, addDays(currentDate, 1));
    else navigateToView(view, addMonths(currentDate, 12));
  };

  const handleToday = () => navigateToView(view, new Date());

  const daysInWeek = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  // Risk map
  const dailyRisk: Record<string, string> = {};
  for (const t of tasks) {
    for (const b of t.plannedState.plannedWorkBlocks || []) {
      const d = startOfDay(new Date(b.start)).toISOString();
      const current = dailyRisk[d] || 'Green';
      if (t.riskEngine.riskTier === 'Red') dailyRisk[d] = 'Red';
      else if (t.riskEngine.riskTier === 'Yellow' && current !== 'Red') dailyRisk[d] = 'Yellow';
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto md:overflow-hidden bg-transparent p-4 pb-[140px] md:p-0 md:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center shrink-0 px-0 py-2 md:px-8 md:py-6 border-b-0 md:border-b border-[var(--border-subtle)] gap-4 md:gap-0 mb-4 md:mb-0">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="flex items-center flex-wrap gap-1 md:gap-2">
            <button 
              onClick={() => navigateToView('year', currentDate)}
              className="text-2xl md:text-3xl font-black font-display text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              {format(currentDate, 'yyyy')}
            </button>
            
            {(view === 'month' || view === 'day' || view === 'week') && (
              <>
                <span className="text-xl md:text-2xl text-[var(--text-muted)] font-display mx-0.5 md:mx-1">&gt;</span>
                <button 
                  onClick={() => navigateToView('month', currentDate)}
                  className="text-2xl md:text-3xl font-black font-display text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  {format(currentDate, 'MMMM')}
                </button>
              </>
            )}

            {(view === 'day') && (
              <>
                <span className="text-xl md:text-2xl text-[var(--text-muted)] font-display mx-0.5 md:mx-1">&gt;</span>
                <button 
                  onClick={() => navigateToView('day', currentDate)}
                  className="text-2xl md:text-3xl font-black font-display text-[var(--accent-primary)] hover:brightness-110 transition-colors"
                >
                  {format(currentDate, 'd MMM')}
                </button>
              </>
            )}

            {(view === 'week') && (
              <>
                <span className="text-xl md:text-2xl text-[var(--text-muted)] font-display mx-0.5 md:mx-1">&gt;</span>
                <button 
                  onClick={() => navigateToView('week', currentDate)}
                  className="text-2xl md:text-3xl font-black font-display text-[var(--accent-primary)] hover:brightness-110 transition-colors"
                >
                  Week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM')}
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 md:p-2 border border-[var(--border-subtle)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all">
              <ChevronLeft size={20} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button onClick={handleNext} className="p-2 md:p-2 border border-[var(--border-subtle)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all">
              <ChevronRight size={20} className="md:w-[18px] md:h-[18px]" />
            </button>
            <button onClick={handleToday} className="px-4 py-2 min-h-[44px] md:min-h-0 text-[15px] md:text-sm font-bold border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all ml-2">
              Today
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl overflow-x-auto no-scrollbar w-full md:w-auto mt-4 md:mt-0">
          {(['day', 'week', 'month', 'year'] as const).map(v => (
            <button
              key={v}
              onClick={() => navigateToView(v, currentDate)}
              className={`px-4 md:px-5 py-2 min-h-[44px] md:min-h-0 text-[15px] md:text-sm font-bold rounded-xl transition-all capitalize flex-1 md:flex-none whitespace-nowrap ${
                view === v 
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] shadow-[0_0_15px_rgba(0,255,157,0.3)] border border-[var(--accent-primary)]/50' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-0 md:overflow-hidden relative">
        {/* Calendar View Area */}
        <div className="flex-1 bg-[var(--bg-primary)] overflow-hidden flex flex-col relative no-scrollbar min-h-[600px] md:min-h-0">
          <LayoutGroup>
            <AnimatePresence mode="wait">
              {view === 'month' && (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.35, ease: 'circOut' }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 shrink-0">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-[var(--border-subtle)] gap-px overflow-hidden">
                    {daysInMonth.map((d, i) => {
                      const isCurrentMonth = isSameMonth(d, currentDate);
                      const isToday = isSameDay(d, new Date());
                      const dIso = startOfDay(d).toISOString();
                      const r = dailyRisk[dIso];
                      
                      // Get actual tasks for the day
                      const dayTasks = tasks.filter(t => 
                        (t.plannedState.plannedWorkBlocks || []).some(b => startOfDay(new Date(b.start)).toISOString() === dIso)
                      );
                      const dayHabits = habits.filter(h => shouldRenderHabitOnDay(h, d));
                      
                      return (
                        <motion.div 
                          key={i} 
                          layoutId={`day-${format(d, 'yyyy-MM-dd')}`}
                          onClick={() => navigateToView('day', d)}
                          onDoubleClick={() => navigateToView('day', d)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, date: d });
                          }}
                          whileHover={{ scale: 1.02, zIndex: 10 }}
                          className={`bg-[var(--bg-primary)] p-1 md:p-2 relative flex flex-col ${!isCurrentMonth ? 'opacity-30' : ''} hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:shadow-[0_0_15px_rgba(0,255,157,0.2)] transition-all cursor-pointer border border-transparent overflow-hidden group`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs md:text-sm font-bold w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_10px_var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                              {format(d, 'd')}
                            </span>
                            {r && (
                              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mt-1 ${r === 'Red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : r === 'Yellow' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'}`} />
                            )}
                          </div>
                          
                          {/* Task Count Preview (visible on hover) */}
                          <div className="absolute inset-0 bg-[var(--bg-secondary)]/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none z-20 space-y-1">
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-[var(--accent-primary)]">{dayTasks.length}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Tasks</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-purple-500">{dayHabits.length}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Habits</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xl font-black text-blue-500">{i % 4 === 0 ? 1 : 0}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Focus Sessions</span>
                            </div>
                          </div>

                          <div className="hidden md:block flex-1 overflow-hidden space-y-1 relative z-10">
                            {dayTasks.slice(0, 2).map((t, idx) => (
                              <div key={`task-${idx}`} className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded px-1.5 py-0.5 truncate text-[var(--text-primary)]">
                                {t.title}
                              </div>
                            ))}
                            {dayHabits.slice(0, 1).map((h, idx) => (
                              <div key={`habit-${idx}`} className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded px-1.5 py-0.5 truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                {h.name}
                              </div>
                            ))}
                            {userState.busyBlocks.filter(b => isSameDay(new Date(b.start), d)).map((b, idx) => (
                              <div key={`busy-${idx}`} className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-500 rounded px-1.5 py-0.5 font-medium flex justify-between items-center group">
                                <span className="truncate">Busy</span>
                                <button onClick={(e) => removeBusyBlock(e, b)} className="opacity-0 group-hover:opacity-100 hover:text-red-700 transition-opacity p-0.5">
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            {(dayTasks.length + dayHabits.length) > 3 && (
                              <div className="text-[10px] text-[var(--text-muted)] font-bold px-1">
                                +{(dayTasks.length + dayHabits.length) - 3} more items
                              </div>
                            )}
                          </div>
                          
                          <div className="md:hidden flex flex-wrap gap-0.5 mt-0.5">
                            {dayTasks.slice(0,4).map((_, idx) => <div key={`t-${idx}`} className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]" />)}
                            {dayHabits.slice(0,2).map((_, idx) => <div key={`h-${idx}`} className="w-1.5 h-1.5 rounded-full bg-purple-500" />)}
                            {userState.busyBlocks.filter(b => isSameDay(new Date(b.start), d)).slice(0,2).map((_, idx) => <div key={`b-${idx}`} className="w-1.5 h-1.5 rounded-full bg-red-500" />)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {view === 'week' && (
                <motion.div
                  key="week"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col h-full min-h-0 overflow-hidden"
                >
                <div id="week-horizontal-scroll" className="flex-1 flex flex-col min-h-0 relative">
                  <div className="grid grid-cols-[45px_repeat(7,1fr)] md:grid-cols-none md:flex border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 shrink-0">
                    <div className="md:w-16 shrink-0 border-r border-[var(--border-subtle)] sticky left-0 z-30 bg-[var(--bg-secondary)]/90 backdrop-blur-md"></div>
                    {daysInWeek.map(d => {
                      const isToday = isSameDay(d, new Date());
                      const r = dailyRisk[startOfDay(d).toISOString()];
                      return (
                        <div key={d.toISOString()} id={`week-day-header-${format(d, 'yyyy-MM-dd')}`} className="md:w-auto md:flex-1 p-1 py-2 md:p-3 flex flex-col items-center justify-center border-r border-[var(--border-subtle)] last:border-0 relative">
                          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5 md:mb-1 truncate w-full text-center">{format(d, 'EEE')}</span>
                          <span className={`text-sm md:text-xl font-black w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--accent-primary)] text-black shadow-[0_0_10px_var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                            {format(d, 'd')}
                          </span>
                          {r && (
                              <div className={`absolute top-0.5 right-0.5 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${r === 'Red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : r === 'Yellow' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div ref={weekScrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative bg-[var(--bg-primary)]">
                    <div className="grid grid-cols-[45px_repeat(7,1fr)] md:grid-cols-none md:flex" style={{ height: '1440px', minHeight: '1440px' }}>
                      <div className="md:w-16 shrink-0 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 z-20 sticky left-0 backdrop-blur-md" style={{ height: '1440px' }}>
                      {hours.map(h => {
                        const slots = [h, h + 0.5];
                        return slots.map(slot => {
                          const hr = Math.floor(slot);
                          const min = (slot % 1) === 0 ? '00' : '30';
                          return (
                            <div key={slot} className="border-b border-[var(--border-subtle)]/30 relative shrink-0 text-center flex items-center justify-center" style={{ height: '30px' }}>
                              <span className="text-[8px] md:text-[10px] font-bold text-[var(--text-muted)] font-mono bg-[var(--bg-primary)]/80 px-0.5 md:px-1 rounded backdrop-blur-sm tracking-tighter md:tracking-normal">
                                {hr.toString().padStart(2, '0')}:{min}
                              </span>
                            </div>
                          );
                        });
                      })}
                    </div>
                    <div className="contents md:flex-1 md:flex" style={{ height: '1440px', minHeight: '1440px' }}>
                      {daysInWeek.map((d, i) => (
                        <div key={i} className="md:flex-1 flex flex-col border-r border-[var(--border-subtle)] last:border-0 relative bg-[var(--bg-primary)]"
                             style={{ height: '1440px' }}
                             onContextMenu={(e) => {
                               e.preventDefault();
                               setContextMenu({ x: e.clientX, y: e.clientY, date: d });
                             }}>
                        {hours.map(h => {
                          const slots = [h, h + 0.5];
                          return slots.map(slot => {
                            const isSelected = dragSelection && 
                              isSameDay(d, new Date(dragSelection.start.date)) &&
                              Math.min(dragSelection.start.hour, dragSelection.end.hour) <= slot && 
                              Math.max(dragSelection.start.hour, dragSelection.end.hour) >= slot;
                            
                            let selectColorClass = 'bg-[var(--accent-primary)]/20 border-y border-[var(--accent-primary)]';
                            if (creationMode === 'Task') selectColorClass = 'bg-blue-500/20 border-y border-blue-500';
                            else if (creationMode === 'Habit') selectColorClass = 'bg-purple-500/20 border-y border-purple-500';
                            else if (creationMode === 'Busy') selectColorClass = 'bg-red-500/20 border-y border-red-500';
                            else if (creationMode === 'Workspace Event') selectColorClass = 'bg-orange-500/20 border-y border-orange-500';

                            const isOffHours = slot < 7 || slot >= 22;
                            const bgClass = isOffHours ? 'bg-[var(--bg-secondary)]/30' : 'bg-transparent';

                            return (
                              <div key={slot} 
                                   onMouseDown={() => handleMouseDown(d, slot)}
                                   onMouseEnter={() => handleMouseEnter(d, slot)}
                                   onDragOver={(e) => e.preventDefault()}
                                   onDrop={(e) => handleDropBlock(e, d, slot)}
                                   style={{ height: '30px' }}
                                   className={`w-full border-b border-[var(--border-subtle)]/30 border-dashed transition-colors cursor-crosshair flex-shrink-0 ${bgClass} ${isSelected ? selectColorClass : 'hover:bg-[var(--bg-secondary)]/50'}`}>
                              </div>
                            );
                          });
                        })}

                        {/* Current Time Indicator */}
                        {isSameDay(d, currentTime) && (
                          <div 
                            className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                            style={{ top: `${(currentHourDecimal / 24) * 100}%` }}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)] -ml-[5px]" />
                            <div className="flex-1 h-[1.5px] bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary)]" />
                          </div>
                        )}

                        {/* Real Planned Work Blocks */}
                        {tasks.map(t => (
                           (t.plannedState?.plannedWorkBlocks || []).map((b, bIdx) => {
                              const startDate = new Date(b.start);
                              const endDate = new Date(b.end);
                              if (!isSameDay(startDate, d)) return null;
                              
                              const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                              const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                              
                              const topPercent = (startHour / 24) * 100;
                              const heightPercent = ((endHour - startHour) / 24) * 100;
                              
                              const isCompleted = t.realityState.effectivePercent >= 100;
                              const borderClass = isCompleted 
                                ? "border-emerald-500 bg-emerald-500/10 hover:border-emerald-400" 
                                : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]";

                              return (
                                <div key={`${t.id}-${bIdx}`} 
                                     draggable="true"
                                     onDragStart={(e) => handleDragStartBlock(e, t.id, bIdx)}
                                     onClick={() => {
                                       setSelectedTaskId(t.id);
                                       setIsDetailsOpen(true);
                                     }}
                                     className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 border rounded p-1 md:rounded-lg md:p-2 shadow-lg overflow-hidden group transition-colors cursor-pointer z-20 ${borderClass}`}
                                     style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}>
                                  <div className="text-[9px] md:text-xs font-bold text-[var(--text-primary)] truncate flex items-center gap-0.5 md:gap-1">
                                    {isCompleted && <Check size={10} className="md:w-3 md:h-3 text-emerald-500 shrink-0" />}
                                    <span className={isCompleted ? "line-through text-[var(--text-muted)] truncate" : "truncate"}>{b.stepName || t.title}</span>
                                  </div>
                                  <div className="text-[9px] md:text-[10px] text-[var(--text-secondary)] hidden md:block">{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</div>
                                </div>
                              );
                           })
                        ))}

                        {/* Habits (Week View) */}
                        {habits.map(h => {
                          if (!shouldRenderHabitOnDay(h, d)) return null;
                          const { startDate, endDate } = getHabitDatesOnDay(h, d);
                          const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                          const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                          
                          const topPercent = (startHour / 24) * 100;
                          const heightPercent = Math.max(((endHour - startHour) / 24) * 100, 3.5);
                          
                          const isCompleted = isHabitCompletedOnDay(h, d);
                          const categoryColor = h.color || "#A855F7";
                          const isToday = isSameDay(d, new Date());

                          return (
                            <div 
                              key={`habit-${h.id}-${format(d, 'yyyy-MM-dd')}`}
                              onClick={(e) => {
                                setSelectedHabitId(h.id);
                                setSelectedHabitDate(format(d, 'yyyy-MM-dd'));
                                setIsHabitDetailsOpen(true);
                              }}
                              className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 border-2 border-dashed rounded p-1 md:rounded-lg md:p-2 shadow-md overflow-hidden group transition-all cursor-pointer z-20 
                                ${isCompleted 
                                  ? "border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/20" 
                                  : "hover:border-purple-500 hover:shadow-purple-500/10"
                                }`}
                              style={{ 
                                top: `${topPercent}%`, 
                                height: `${heightPercent}%`,
                                backgroundColor: isCompleted ? undefined : `${categoryColor}10`,
                                borderColor: isCompleted ? undefined : `${categoryColor}80`
                              }}
                            >
                              <div className="flex items-start justify-between h-full gap-0.5 md:gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] md:text-[11px] font-extrabold text-[var(--text-primary)] truncate flex items-center gap-0.5 md:gap-1.5 leading-tight">
                                    <RefreshCw size={8} className="md:w-2.5 md:h-2.5 text-purple-500 shrink-0 hidden md:block" />
                                    <span className={isCompleted ? "line-through text-[var(--text-muted)] truncate" : "truncate"}>{h.name}</span>
                                  </div>
                                  <div className="text-[8px] md:text-[9px] text-[var(--text-secondary)] mt-0 md:mt-0.5 font-mono hidden md:block">
                                    {h.startTime} - {h.endTime}
                                  </div>
                                  {h.streak > 0 && (
                                    <div className="hidden md:inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-500 bg-orange-500/10 px-1 rounded-full mt-1">
                                      🔥 {h.streak}
                                    </div>
                                  )}
                                </div>
                                
                                {isToday && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isCompleted) {
                                        completeHabit(h.id);
                                      }
                                    }}
                                    className={`w-3 h-3 md:w-5 md:h-5 rounded-full border flex items-center justify-center transition-all shrink-0 mt-0 md:mt-0.5
                                      ${isCompleted 
                                        ? "bg-emerald-500 border-emerald-500 text-white" 
                                        : "border-[var(--border-subtle)] hover:border-purple-500 hover:bg-purple-500/10"
                                      }`}
                                  >
                                    {isCompleted && <Check size={8} className="md:w-2.5 md:h-2.5" strokeWidth={3} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Busy Blocks */}
                        {userState.busyBlocks.map((b, bIdx) => {
                              const startDate = new Date(b.start);
                              const endDate = new Date(b.end);
                              if (!isSameDay(startDate, d)) return null;
                              
                              const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                              const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                              
                              const topPercent = (startHour / 24) * 100;
                              const heightPercent = ((endHour - startHour) / 24) * 100;
                              
                              return (
                                <div key={`busy-${bIdx}`} className="absolute left-0.5 right-0.5 md:left-1 md:right-1 bg-red-500/10 border border-red-500/30 rounded p-1 md:rounded-lg md:p-2 shadow-sm overflow-hidden z-10 group"
                                     style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}>
                                  <div className="flex justify-between items-start">
                                    <div className="text-[9px] md:text-xs font-bold text-red-500 truncate">Busy</div>
                                    <button onClick={(e) => removeBusyBlock(e, b)} className="opacity-0 group-hover:opacity-100 hover:text-red-700 transition-opacity text-red-500 mt-0.5">
                                      <Trash2 size={12} className="w-2.5 h-2.5 md:w-3 md:h-3 hidden md:block" />
                                    </button>
                                  </div>
                                  <div className="text-[9px] md:text-[10px] text-red-500/70 hidden md:block">{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</div>
                                </div>
                              );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                </div>
                </div>
              </motion.div>
            )}

              {view === 'day' && (
                <motion.div
                  key="day"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.35, ease: 'circOut' }}
                  className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] z-20"
                  layoutId={`day-${format(currentDate, 'yyyy-MM-dd')}`}
                >
                  <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[var(--text-primary)]">{format(currentDate, 'EEEE')}</h2>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">{format(currentDate, 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-black font-mono text-[var(--accent-primary)]">85%</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Focus Score</div>
                      </div>
                    </div>
                  </div>
                  <div ref={dayScrollRef} className="flex-1 overflow-y-auto no-scrollbar flex relative bg-[var(--bg-primary)]">
                    <div className="w-20 shrink-0 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 z-10" style={{ height: '1440px' }}>
                      {hours.map(h => {
                        const slots = [h, h + 0.5];
                        return slots.map(slot => {
                          const hr = Math.floor(slot);
                          const min = (slot % 1) === 0 ? '00' : '30';
                          return (
                            <div key={slot} className="border-b border-[var(--border-subtle)]/30 relative shrink-0 text-center flex items-center justify-center" style={{ height: '30px' }}>
                              <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono">
                                {hr.toString().padStart(2, '0')}:{min}
                              </span>
                            </div>
                          );
                        });
                      })}
                    </div>
                    <div className="flex-1 flex flex-col relative" style={{ height: '1440px' }}
                         onContextMenu={(e) => {
                           e.preventDefault();
                           setContextMenu({ x: e.clientX, y: e.clientY, date: currentDate });
                         }}>
                      {hours.map(h => {
                        const slots = [h, h + 0.5];
                        return slots.map(slot => {
                          const isSelected = dragSelection && 
                            isSameDay(currentDate, new Date(dragSelection.start.date)) &&
                            Math.min(dragSelection.start.hour, dragSelection.end.hour) <= slot && 
                            Math.max(dragSelection.start.hour, dragSelection.end.hour) >= slot;
                          
                          let selectColorClass = 'bg-[var(--accent-primary)]/20 border-y border-[var(--accent-primary)]';
                          if (creationMode === 'Task') selectColorClass = 'bg-blue-500/20 border-y border-blue-500';
                          else if (creationMode === 'Habit') selectColorClass = 'bg-purple-500/20 border-y border-purple-500';
                          else if (creationMode === 'Focus') selectColorClass = 'bg-[var(--accent-primary)]/20 border-y border-[var(--accent-primary)]';
                          else if (creationMode === 'Busy') selectColorClass = 'bg-red-500/20 border-y border-red-500';
                          else if (creationMode === 'Workspace Event') selectColorClass = 'bg-orange-500/20 border-y border-orange-500';

                          const isOffHours = slot < 7 || slot >= 22;
                          const bgClass = isOffHours ? 'bg-[var(--bg-secondary)]/30' : 'bg-transparent';

                          return (
                            <div key={slot} 
                                 onMouseDown={() => handleMouseDown(currentDate, slot)}
                                 onMouseEnter={() => handleMouseEnter(currentDate, slot)}
                                 onDragOver={(e) => e.preventDefault()}
                                 onDrop={(e) => handleDropBlock(e, currentDate, slot)}
                                 style={{ height: '30px' }}
                                 className={`w-full border-b border-[var(--border-subtle)]/30 border-dashed transition-colors cursor-crosshair flex-shrink-0 ${bgClass} ${isSelected ? selectColorClass : 'hover:bg-[var(--bg-secondary)]/50'}`}>
                            </div>
                          );
                        });
                      })}

                      {/* Current Time Indicator */}
                      {isSameDay(currentDate, currentTime) && (
                        <div 
                          className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                          style={{ top: `${(currentHourDecimal / 24) * 100}%` }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)] -ml-[5px]" />
                          <div className="flex-1 h-[1.5px] bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary)]" />
                        </div>
                      )}

                      {/* Real Planned Work Blocks (Day View) */}
                      {tasks.map(t => (
                         (t.plannedState?.plannedWorkBlocks || []).map((b, bIdx) => {
                            const startDate = new Date(b.start);
                            const endDate = new Date(b.end);
                            if (!isSameDay(startDate, currentDate)) return null;
                            
                            const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                            const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                            
                            const topPercent = (startHour / 24) * 100;
                            const heightPercent = ((endHour - startHour) / 24) * 100;
                            
                            const isCompleted = t.realityState.effectivePercent >= 100;
                            const borderClass = isCompleted 
                              ? "border-emerald-500 bg-emerald-500/10 hover:border-emerald-400" 
                              : "border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]";

                            return (
                              <div key={`${t.id}-${bIdx}`} 
                                   draggable="true"
                                   onDragStart={(e) => handleDragStartBlock(e, t.id, bIdx)}
                                   onClick={() => {
                                     setSelectedTaskId(t.id);
                                     setIsDetailsOpen(true);
                                   }}
                                   className={`absolute left-4 right-8 border rounded-2xl p-4 shadow-xl flex flex-col group transition-colors cursor-pointer z-20 ${borderClass}`}
                                   style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5">
                                    {isCompleted && <Check size={14} className="text-emerald-500 shrink-0" />}
                                    <span className={isCompleted ? "line-through text-[var(--text-muted)]" : ""}>{b.stepName || t.title}</span>
                                  </div>
                                  {isCompleted ? (
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded">Completed</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold uppercase tracking-widest rounded">Planned</span>
                                  )}
                                </div>
                                <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-auto">
                                  <Clock size={12}/> {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                                </div>
                              </div>
                            );
                         })
                      ))}

                      {/* Habits (Day View) */}
                      {habits.map(h => {
                        if (!shouldRenderHabitOnDay(h, currentDate)) return null;
                        const { startDate, endDate } = getHabitDatesOnDay(h, currentDate);
                        const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                        const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                        
                        const topPercent = (startHour / 24) * 100;
                        const heightPercent = Math.max(((endHour - startHour) / 24) * 100, 4);
                        
                        const isCompleted = isHabitCompletedOnDay(h, currentDate);
                        const categoryColor = h.color || "#A855F7";
                        const isToday = isSameDay(currentDate, new Date());

                        return (
                          <div 
                            key={`habit-day-${h.id}`}
                            onClick={(e) => {
                              setSelectedHabitId(h.id);
                              setSelectedHabitDate(format(currentDate, 'yyyy-MM-dd'));
                              setIsHabitDetailsOpen(true);
                            }}
                            className={`absolute left-4 right-8 border-2 border-dashed rounded-2xl p-4 shadow-xl flex flex-col group transition-all cursor-pointer z-20 
                              ${isCompleted 
                                ? "border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/20" 
                                : "hover:border-purple-500 hover:shadow-purple-500/10"
                              }`}
                            style={{ 
                              top: `${topPercent}%`, 
                              height: `${heightPercent}%`,
                              backgroundColor: isCompleted ? undefined : `${categoryColor}10`,
                              borderColor: isCompleted ? undefined : `${categoryColor}80`
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-purple-500 transition-colors flex items-center gap-1.5">
                                <RefreshCw size={14} className="text-purple-500 shrink-0" />
                                <span className={isCompleted ? "line-through text-[var(--text-muted)]" : ""}>{h.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {h.streak > 0 && (
                                  <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-widest rounded-full">🔥 Streak: {h.streak}</span>
                                )}
                                {isCompleted ? (
                                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded">Completed</span>
                                ) : (
                                  <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-widest rounded">Habit</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                                <Clock size={12}/> {h.startTime} - {h.endTime}
                              </div>
                              {isToday && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isCompleted) {
                                      completeHabit(h.id);
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0
                                    ${isCompleted 
                                      ? "bg-emerald-500 border-emerald-500 text-white" 
                                      : "border-[var(--border-subtle)] hover:border-purple-500 hover:bg-purple-500/10"
                                    }`}
                                >
                                  {isCompleted && <Check size={12} strokeWidth={3} />}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Busy Blocks (Day View) */}
                      {userState.busyBlocks.map((b, bIdx) => {
                            const startDate = new Date(b.start);
                            const endDate = new Date(b.end);
                            if (!isSameDay(startDate, currentDate)) return null;
                            
                            const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                            const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                            
                            const topPercent = (startHour / 24) * 100;
                            const heightPercent = ((endHour - startHour) / 24) * 100;
                            
                            return (
                              <div key={`busy-${bIdx}`} className="absolute left-4 right-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 shadow-sm flex flex-col z-10 group"
                                   style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="text-sm font-bold text-red-500">Busy Time</div>
                                  <button onClick={(e) => removeBusyBlock(e, b)} className="opacity-0 group-hover:opacity-100 hover:text-red-700 transition-opacity text-red-500 p-1">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <div className="text-xs text-red-500/70 flex items-center gap-2 mt-auto">
                                  <Clock size={12}/> {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                                </div>
                              </div>
                            );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'year' && (
                <motion.div
                  key="year"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: 'circOut' }}
                  className="flex-1 overflow-y-auto no-scrollbar p-2 md:p-8 lg:p-6 flex flex-col items-center"
                >
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-8 lg:gap-[20px] w-full lg:max-w-[1000px] lg:my-auto">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const monthDate = new Date(currentDate.getFullYear(), i, 1);
                      return (
                        <motion.div 
                          key={i} 
                          layoutId={`month-${i}`}
                          onClick={() => navigateToView('month', monthDate)}
                          onDoubleClick={() => navigateToView('month', monthDate)}
                          whileHover={{ scale: 1.03, zIndex: 10 }}
                          className="bg-[var(--bg-secondary)]/30 border border-[var(--border-subtle)] p-2 md:p-4 lg:p-[16px] rounded-[12px] md:rounded-2xl lg:rounded-[18px] hover:border-[var(--accent-primary)]/50 hover:shadow-[0_0_20px_rgba(0,255,157,0.1)] transition-colors cursor-pointer min-w-0 lg:h-[200px] flex flex-col lg:justify-center"
                        >
                          <h4 className="text-[10px] sm:text-xs md:text-sm lg:text-[18px] font-bold text-[var(--text-primary)] mb-2 md:mb-4 lg:mb-[12px] truncate leading-tight text-center md:text-left">
                            <span className="lg:hidden">{format(monthDate, 'MMM')}</span>
                            <span className="hidden lg:inline">{format(monthDate, 'MMMM')}</span>
                          </h4>
                          <div className="grid grid-cols-7 gap-0.5 md:gap-1 lg:gap-[4px] pointer-events-none w-full lg:max-w-[140px] mx-auto md:mx-0">
                            {Array.from({ length: 30 }).map((_, j) => {
                              const rand = Math.random();
                              let colorClass = 'bg-[var(--bg-primary)] border border-[var(--border-subtle)]'; // Gray
                              if (rand > 0.9) colorClass = 'bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'; // Bright Green
                              else if (rand > 0.7) colorClass = 'bg-[var(--accent-primary)]/50'; // Green
                              else if (rand > 0.5) colorClass = 'bg-amber-500/80'; // Yellow
                              else if (rand > 0.4) colorClass = 'bg-red-500/80'; // Red
                              
                              return <div key={j} className={`aspect-square rounded-[1px] md:rounded-sm ${colorClass}`}></div>
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>

        {/* Right Side Capacity Panel */}
        <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 flex flex-col overflow-y-auto no-scrollbar">
          <div className="p-4 md:p-6 space-y-6">
            
            {/* Productivity Intelligence */}
            <div className="bg-[var(--intel-bg)] border border-[var(--intel-border)] rounded-2xl p-4 md:p-5 shadow-[var(--intel-shadow)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 opacity-80"></div>
              <button
                className="w-full flex items-center justify-between text-left md:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded min-h-[44px]"
                onClick={() => { if (window.innerWidth < 768) setIntelExpanded(!intelExpanded); }}
                aria-expanded={intelExpanded}
                aria-controls="productivity-intel-content"
              >
                <h3 className="font-bold text-[13px] uppercase tracking-widest text-[var(--intel-header)] flex items-center gap-2 m-0">
                  <BrainCircuit size={16}/> Productivity Intel
                </h3>
                <div className="md:hidden text-[var(--intel-header)]">
                  {intelExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              <div
                id="productivity-intel-content"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${intelExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:mt-4'}`}
              >
                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                  <div className="bg-[var(--intel-stat-bg)] border border-[var(--intel-stat-border)] rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-[var(--intel-stat-label)] tracking-widest mb-1">Today's Capacity</div>
                    <div className="text-lg font-black text-[var(--intel-stat-val)]">85%</div>
                  </div>
                  <div className="bg-[var(--intel-stat-bg)] border border-[var(--intel-stat-border-risk)] rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-[var(--intel-stat-label)] tracking-widest mb-1">Current Risk</div>
                    <div className="text-lg font-black text-[var(--intel-stat-val-risk)]">Medium</div>
                  </div>
                  <div className="bg-[var(--intel-stat-bg)] border border-[var(--intel-stat-border-sync)] rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-[var(--intel-stat-label)] tracking-widest mb-1">Reality Sync</div>
                    <div className="text-lg font-black text-[var(--intel-stat-val-sync)]">92%</div>
                  </div>
                  <div className="bg-[var(--intel-stat-bg)] border border-[var(--intel-stat-border)] rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-[var(--intel-stat-label)] tracking-widest mb-1">Available Hours</div>
                    <div className="text-lg font-black text-[var(--intel-stat-val)]">3.0h</div>
                  </div>
                </div>

                <div className="bg-[var(--intel-rec-bg)] border border-[var(--intel-rec-border)] rounded-lg p-3 relative z-10">
                  <div className="text-[10px] uppercase font-bold text-[var(--intel-rec-title)] tracking-widest mb-1 flex items-center gap-1"><Zap size={10}/> Recommended Focus Time</div>
                  <p className="text-xs text-[var(--intel-rec-desc)] font-medium leading-relaxed">
                    You have a 3-hour free block today from 6 PM to 9 PM. Ideal for completing: <strong className="font-semibold text-[var(--intel-rec-mission)]">Hackathon UI</strong>.
                  </p>
                </div>

                <div className="absolute -bottom-10 -right-10 text-[var(--accent-primary)] opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <BrainCircuit size={150}/>
                </div>
              </div>
            </div>

            {/* Capacity Stats */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 md:p-5 shadow-lg">
              <button
                className="w-full flex items-center justify-between text-left md:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded min-h-[44px]"
                onClick={() => { if (window.innerWidth < 768) setCapacityExpanded(!capacityExpanded); }}
                aria-expanded={capacityExpanded}
                aria-controls="capacity-stats-content"
              >
                <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 m-0">
                  <Activity size={16} className="text-[var(--text-muted)]"/>
                  Weekly Capacity Forecast
                </h3>
                <div className="md:hidden text-[var(--text-primary)]">
                  {capacityExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              <div
                id="capacity-stats-content"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${capacityExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:mt-4'}`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] font-medium">Total Hours</span>
                      <span className="text-[var(--text-primary)] font-mono font-bold">168h</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--text-muted)] w-[100%]"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] font-medium">Busy</span>
                      <span className="text-[var(--text-primary)] font-mono font-bold">90h</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] w-[53%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] font-medium">Tasks</span>
                      <span className="text-[var(--text-primary)] font-mono font-bold">25h</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] w-[15%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] font-medium">Habits</span>
                      <span className="text-[var(--text-primary)] font-mono font-bold">10h</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] w-[6%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)] font-medium">Free Hours</span>
                      <span className="text-[var(--accent-primary)] font-mono font-bold">43h</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)] w-[25%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3 pl-1">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setCreationMode(creationMode === 'Task' ? null : 'Task')}
                  className={`flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)] border rounded-2xl transition-all group
                  ${creationMode === 'Task' ? 'border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-[var(--border-subtle)] hover:border-blue-500 hover:text-blue-500'}`}>
                  <Plus size={20} className={`mb-2 transition-colors ${creationMode === 'Task' ? 'text-blue-500' : 'text-[var(--text-muted)] group-hover:text-blue-500'}`}/>
                  <span className={`text-xs font-bold transition-colors ${creationMode === 'Task' ? 'text-blue-500' : 'text-[var(--text-primary)] group-hover:text-blue-500'}`}>Task</span>
                </button>
                <button 
                  onClick={() => setCreationMode(creationMode === 'Habit' ? null : 'Habit')}
                  className={`flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)] border rounded-2xl transition-all group
                  ${creationMode === 'Habit' ? 'border-purple-500 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-[var(--border-subtle)] hover:border-purple-500 hover:text-purple-500'}`}>
                  <RefreshCw size={20} className={`mb-2 transition-colors ${creationMode === 'Habit' ? 'text-purple-500' : 'text-[var(--text-muted)] group-hover:text-purple-500'}`}/>
                  <span className={`text-xs font-bold transition-colors ${creationMode === 'Habit' ? 'text-purple-500' : 'text-[var(--text-primary)] group-hover:text-purple-500'}`}>Habit</span>
                </button>
                <button 
                  onClick={() => setCreationMode(creationMode === 'Focus' ? null : 'Focus')}
                  className={`flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)] border rounded-2xl transition-all group
                  ${creationMode === 'Focus' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_15px_rgba(0,255,157,0.1)]' : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'}`}>
                  <Zap size={20} className={`mb-2 transition-colors ${creationMode === 'Focus' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]'}`}/>
                  <span className={`text-xs font-bold transition-colors ${creationMode === 'Focus' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]'}`}>Focus</span>
                </button>
                <button 
                  onClick={() => setCreationMode(creationMode === 'Busy' ? null : 'Busy')}
                  className={`flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)] border rounded-2xl transition-all group
                  ${creationMode === 'Busy' ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-[var(--border-subtle)] hover:border-red-500 hover:text-red-500'}`}>
                  <Clock size={20} className={`mb-2 transition-colors ${creationMode === 'Busy' ? 'text-red-500' : 'text-[var(--text-muted)] group-hover:text-red-500'}`}/>
                  <span className={`text-xs font-bold transition-colors ${creationMode === 'Busy' ? 'text-red-500' : 'text-[var(--text-primary)] group-hover:text-red-500'}`}>Busy</span>
                </button>
                <button 
                  onClick={() => setCreationMode(creationMode === 'Workspace Event' ? null : 'Workspace Event')}
                  className={`col-span-2 flex items-center justify-center p-3 bg-[var(--bg-primary)] border rounded-2xl transition-all group gap-2
                  ${creationMode === 'Workspace Event' ? 'border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-[var(--border-subtle)] hover:border-orange-500 hover:text-orange-500'}`}>
                  <CalendarIcon size={16} className={`transition-colors ${creationMode === 'Workspace Event' ? 'text-orange-500' : 'text-[var(--text-muted)] group-hover:text-orange-500'}`}/>
                  <span className={`text-xs font-bold transition-colors ${creationMode === 'Workspace Event' ? 'text-orange-500' : 'text-[var(--text-primary)] group-hover:text-orange-500'}`}>Workspace Event</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Context Menu overlay */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-50 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl p-2 w-48 overflow-hidden"
            >
              <div className="px-3 py-2 text-xs font-bold text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                {format(contextMenu.date, 'MMM d, yyyy')}
              </div>
              <button className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-blue-500 rounded-lg transition-colors flex items-center gap-2" onClick={() => { setCreationMode('Task'); setContextMenu(null); }}>
                <Plus size={14} /> Add Task
              </button>
              <button className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-purple-500 rounded-lg transition-colors flex items-center gap-2" onClick={() => { setCreationMode('Habit'); setContextMenu(null); }}>
                <RefreshCw size={14} /> Add Habit
              </button>
              <button className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-[var(--accent-primary)] rounded-lg transition-colors flex items-center gap-2" onClick={() => { setCreationMode('Focus'); setContextMenu(null); }}>
                <Zap size={14} /> Focus Session
              </button>
              <button className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-red-500 rounded-lg transition-colors flex items-center gap-2" onClick={() => { setCreationMode('Busy'); setContextMenu(null); }}>
                <Clock size={14} /> Mark Busy Time
              </button>
              <button className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-orange-500 rounded-lg transition-colors flex items-center gap-2" onClick={() => { setCreationMode('Workspace Event'); setContextMenu(null); }}>
                <CalendarIcon size={14} /> Workspace Event
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Creation Mode Badge */}
      <AnimatePresence>
        {creationMode && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-24 md:bottom-8 left-1/2 z-50 px-6 py-3 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-3 w-max max-w-[90vw] -translate-x-1/2
              ${creationMode === 'Task' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                creationMode === 'Habit' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
                creationMode === 'Focus' ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]' :
                creationMode === 'Busy' ? 'bg-red-500/20 border-red-500/50 text-red-500' :
                'bg-orange-500/20 border-orange-500/50 text-orange-400'
              }`}
          >
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 
                ${creationMode === 'Task' ? 'bg-blue-500' :
                  creationMode === 'Habit' ? 'bg-purple-500' :
                  creationMode === 'Focus' ? 'bg-[var(--accent-primary)]' :
                  creationMode === 'Busy' ? 'bg-red-500' :
                  'bg-orange-500'
                }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 
                ${creationMode === 'Task' ? 'bg-blue-500' :
                  creationMode === 'Habit' ? 'bg-purple-500' :
                  creationMode === 'Focus' ? 'bg-[var(--accent-primary)]' :
                  creationMode === 'Busy' ? 'bg-red-500' :
                  'bg-orange-500'
                }`}></span>
            </span>
            <span className="font-bold text-sm tracking-wide">
              {creationMode} Creation Mode
            </span>
            <span className="text-[10px] opacity-70 ml-2 border border-current rounded px-1.5 py-0.5">Drag to Create (ESC to cancel)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creation Modals Overlay */}
      <AnimatePresence>
        {showModalFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowModalFor(null); setDragSelection(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                <h2 className="text-lg md:text-xl font-display font-black text-[var(--text-primary)] flex items-center gap-2">
                  {showModalFor === 'Task' && <><Plus className="text-blue-500" size={20} /> New Task</>}
                  {showModalFor === 'Habit' && <><RefreshCw className="text-purple-500" size={20} /> New Habit</>}
                  {showModalFor === 'Focus' && <><Zap className="text-[var(--accent-primary)]" size={20} /> Focus Session</>}
                  {showModalFor === 'Busy' && <><Clock className="text-red-500" size={20} /> Mark Busy Time</>}
                  {showModalFor === 'Workspace Event' && <><CalendarIcon className="text-orange-500" size={20} /> Workspace Event</>}
                </h2>
              </div>
              
              {/* Common info: Selected Time */}
              {dragSelection && (() => {
                const sHour = Math.min(dragSelection.start.hour, dragSelection.end.hour);
                const eHour = Math.max(dragSelection.start.hour, dragSelection.end.hour) + 0.5;
                const formatTimeDecimal = (val: number) => {
                  const h = Math.floor(val);
                  const m = Math.round((val % 1) * 60);
                  const period = h >= 12 ? 'PM' : 'AM';
                  const dispH = h % 12 === 0 ? 12 : h % 12;
                  const mStr = m.toString().padStart(2, '0');
                  return `${dispH}:${mStr} ${period}`;
                };
                return (
                  <div className="bg-[var(--bg-secondary)]/50 px-6 py-3 border-b border-[var(--border-subtle)] flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Clock size={14} /> 
                    <span className="font-bold text-[var(--text-primary)]">
                      {format(new Date(dragSelection.start.date), 'MMM d, yyyy')}
                    </span>
                    <span className="opacity-50">•</span>
                    <span>
                      {formatTimeDecimal(sHour)} - {formatTimeDecimal(eHour)}
                    </span>
                    <span className="opacity-50">•</span>
                    <span className="font-mono text-xs text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-1.5 rounded">
                      {(eHour - sHour).toFixed(1)}h
                    </span>
                  </div>
                );
              })()}

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto no-scrollbar">
                
                {showModalFor === 'Task' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Task Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Hackathon UI" 
                        value={taskName}
                        onChange={e => setTaskName(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-blue-500 transition-all" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Estimated Hours</label>
                        <input 
                          type="number" 
                          value={estHours}
                          onChange={e => setEstHours(Number(e.target.value))}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-blue-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Priority</label>
                        <select 
                          value={priority}
                          onChange={e => setPriority(e.target.value as any)}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-blue-500 transition-all"
                        >
                          <option value="Critical">🚨 Critical</option>
                          <option value="High">🔥 High Priority</option>
                          <option value="Medium">🟡 Medium</option>
                          <option value="Low">⚪ Low</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {showModalFor === 'Habit' && (
                  <>
                    {habitValidationError && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs px-3 py-2.5 rounded-lg font-semibold flex items-center gap-1.5">
                        <span>⚠️</span> {habitValidationError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Habit Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. DSA Practice" 
                        value={habitName}
                        onChange={e => setHabitName(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-purple-500 transition-all" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Category</label>
                        <select 
                          value={habitCategory}
                          onChange={e => setHabitCategory(e.target.value)}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-purple-500 transition-all"
                        >
                          <option value="Academic">Study</option>
                          <option value="Health">Health</option>
                          <option value="Career">Career</option>
                          <option value="Personal">Personal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Duration</label>
                        <select 
                          value={habitDuration}
                          onChange={e => setHabitDuration(Number(e.target.value))}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-purple-500 transition-all"
                        >
                          <option value={15}>15 mins</option>
                          <option value={30}>30 mins</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Repeat Pattern</label>
                      <div className="grid grid-cols-5 gap-2">
                        {['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'].map((p) => (
                          <button 
                            key={p} 
                            type="button"
                            onClick={() => setHabitRepeatPattern(p as any)}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${habitRepeatPattern === p ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {showModalFor === 'Focus' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Session Name</label>
                      <input type="text" placeholder="e.g. Deep Work Sprint" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Focus Mode</label>
                      <div className="space-y-2">
                        {['Deep Work', 'Pomodoro', 'Sprint'].map((m, i) => (
                          <label key={m} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${i === 0 ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50'}`}>
                            <input type="radio" name="focus_mode" defaultChecked={i === 0} className="accent-[var(--accent-primary)]" />
                            <span className={`text-sm font-bold ${i === 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{m}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {showModalFor === 'Busy' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Reason</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['College', 'Work', 'Travel', 'Meeting', 'Personal', 'Custom'].map((r, i) => (
                          <button key={r} className={`py-2 text-sm font-bold rounded-lg border transition-all ${i === 0 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-red-500/50 hover:text-[var(--text-primary)]'}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {showModalFor === 'Workspace Event' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Name</label>
                      <input type="text" placeholder="e.g. Design Sync" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-orange-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Workspace</label>
                      <select className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-orange-500 transition-all">
                        <option>Alpha Team</option>
                        <option>Study Group</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Members</label>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xs font-bold text-blue-500">A</div>
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-xs font-bold text-purple-500">B</div>
                        <button className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500 transition-colors">
                          <Plus size={14}/>
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--bg-secondary)]/30">
                <button onClick={() => { setShowModalFor(null); setDragSelection(null); }} className="px-5 py-2.5 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className={`px-5 py-2.5 text-sm font-black text-white rounded-lg shadow-lg hover:brightness-110 transition-all flex items-center gap-2
                  ${showModalFor === 'Task' ? 'bg-blue-600 shadow-blue-500/20' : 
                    showModalFor === 'Habit' ? 'bg-purple-600 shadow-purple-500/20' : 
                    showModalFor === 'Focus' ? 'bg-emerald-600 shadow-emerald-500/20 text-black' : 
                    showModalFor === 'Busy' ? 'bg-red-600 shadow-red-500/20' : 
                    'bg-orange-600 shadow-orange-500/20'}`}>
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskDetailsPanel
        task={tasks.find(t => t.id === selectedTaskId) || null}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTaskId(null);
        }}
        onEdit={(updates) => {
          if (selectedTaskId) {
            updateTask(selectedTaskId, updates);
          }
        }}
        onDelete={() => {
          if (selectedTaskId) {
            deleteTask(selectedTaskId);
            setIsDetailsOpen(false);
            setSelectedTaskId(null);
          }
        }}
        onComplete={() => {
          if (selectedTaskId) {
            confirmTaskProgress(selectedTaskId, 100);
          }
        }}
      />

      <HabitDetailsPanel
        habit={habits.find(h => h.id === selectedHabitId) || null}
        isOpen={isHabitDetailsOpen}
        onClose={() => {
          setIsHabitDetailsOpen(false);
          setSelectedHabitId(null);
          setSelectedHabitDate(null);
        }}
        onEdit={(id, updates) => {
          updateHabit(id, updates);
        }}
        onDelete={(id) => {
          deleteHabit(id);
        }}
        onToggleDate={(id, dateStr) => {
          toggleHabitDate(id, dateStr);
        }}
      />

    </div>
  );
}

