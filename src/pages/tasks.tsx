import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Check, Clock, Plus, Target, Play, BrainCircuit, Calendar as CalendarIcon, Trash2, Edit2, X, AlertCircle, Pin, ChevronDown, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "../context/UserContext";
import CreateTaskWizard from "../components/CreateTaskWizard";
import { HabitDetailsPanel } from "../components/HabitDetailsPanel";
import { cn } from "../lib/utils";
import { Task } from "../types";

type ColumnId = 'Critical' | 'High' | 'Medium' | 'Low' | 'Completed';

const COLUMN_CONFIG: Record<ColumnId, { title: string, color: string, glow: string }> = {
  Critical: { title: '🚨 Critical', color: 'border-red-500/30 bg-red-500/10 text-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
  High: { title: '🔥 High Priority', color: 'border-orange-500/30 bg-orange-500/10 text-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
  Medium: { title: '🟡 Medium Priority', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
  Low: { title: '⚪ Low Priority', color: 'border-green-500/30 bg-green-500/10 text-green-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]' },
  Completed: { title: '✅ Completed', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' }
};

export default function Tasks() {
  const { 
    tasks, 
    confirmTaskProgress, 
    addTask, 
    updateTask, 
    deleteTask,
    habits,
    completeHabit,
    updateHabit,
    deleteHabit,
    toggleHabitDate
  } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'missions' | 'habits'>('missions');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [isHabitDetailsOpen, setIsHabitDetailsOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const event = new CustomEvent("task-drawer-toggle", { detail: { open: !!selectedTask || isHabitDetailsOpen } });
    window.dispatchEvent(event);
    return () => {
      window.dispatchEvent(new CustomEvent("task-drawer-toggle", { detail: { open: false } }));
    };
  }, [selectedTask, isHabitDetailsOpen]);

  const [mobileColumn, setMobileColumn] = useState<ColumnId>('Critical');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId && tasks.length > 0) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        const column = getTaskColumn(task);
        setMobileColumn(column);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, tasks, setSearchParams]);

  const columnIds: ColumnId[] = ['Critical', 'High', 'Medium', 'Low', 'Completed'];

  const handlePrevColumn = () => {
    const currentIndex = columnIds.indexOf(mobileColumn);
    const prevIndex = (currentIndex - 1 + columnIds.length) % columnIds.length;
    setMobileColumn(columnIds[prevIndex]);
  };

  const handleNextColumn = () => {
    const currentIndex = columnIds.indexOf(mobileColumn);
    const nextIndex = (currentIndex + 1) % columnIds.length;
    setMobileColumn(columnIds[nextIndex]);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextColumn();
    } else if (isRightSwipe) {
      handlePrevColumn();
    }
  };

  // Derive columns
  const getTaskColumn = (task: Task): ColumnId => {
    if (task.realityState.effectivePercent >= 100) return 'Completed';
    if (task.importance.userOverride && ['Critical', 'High', 'Medium', 'Low'].includes(task.importance.userOverride)) {
      return task.importance.userOverride as ColumnId;
    }
    const score = task.riskEngine.riskScore;
    if (score > 75) return 'Critical';
    if (score > 50) return 'High';
    if (score > 25) return 'Medium';
    return 'Low';
  };

  const columns = useMemo(() => {
    const cols: Record<ColumnId, Task[]> = {
      Critical: [],
      High: [],
      Medium: [],
      Low: [],
      Completed: []
    };
    tasks.forEach(t => {
      const col = getTaskColumn(t);
      if (cols[col]) cols[col].push(t);
    });
    
    // Sort pinned tasks to the top of each column
    Object.keys(cols).forEach(colId => {
       cols[colId as ColumnId].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
       });
    });

    return cols;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(tasks.find(t => t.id === active.id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Only needed if we want immediate feedback, but we can do it on End for simpler state.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    let destinationColumn: ColumnId | null = null;
    
    // Check if dropped directly on a column
    if (Object.keys(COLUMN_CONFIG).includes(overId)) {
        destinationColumn = overId as ColumnId;
    } else {
        // Dropped on a card, find its column
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) destinationColumn = getTaskColumn(overTask);
    }

    if (destinationColumn) {
       const sourceColumn = getTaskColumn(task);
       if (sourceColumn !== destinationColumn) {
          if (destinationColumn === 'Completed') {
              confirmTaskProgress(task.id, 100);
          } else {
              // If moving OUT of completed, what to do about progress? Maybe reset it or leave it?
              let updates: Partial<Task> = {
                  importance: { ...task.importance, final: destinationColumn as any, userOverride: destinationColumn as any }
              };
              if (sourceColumn === 'Completed') {
                  updates.realityState = { ...task.realityState, effectivePercent: task.realityState.confirmedPercent < 100 ? task.realityState.confirmedPercent : 0, completedAt: null };
              }
              updateTask(task.id, updates);
          }
       }
    }
  };

  if (showAddForm) {
    return (
       <div className="w-full min-h-screen pt-4 pb-12 px-4 sm:px-6">
         <CreateTaskWizard 
           onClose={() => setShowAddForm(false)} 
           onCreate={(taskData) => {
             addTask(taskData);
             setShowAddForm(false);
           }} 
         />
       </div>
    );
  }

  return (
    <div className="h-full min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans relative overflow-hidden pt-[19px]">
      
      {/* Notebook Texture & Ruling Lines */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none select-none mix-blend-screen"
        animate={{ backgroundPositionY: ["0px", "40px"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        style={{
          backgroundImage: 'linear-gradient(transparent 39px, rgba(0, 255, 157, 0.05) 40px)',
          backgroundSize: '100% 40px',
        }}
      />
      <div 
        className="absolute inset-0 z-0 pointer-events-none select-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Header */}
      <div className="p-4 md:px-8 md:py-8 border-b border-[var(--border-subtle)] flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 md:gap-0 bg-[var(--bg-primary)]/80 backdrop-blur-md relative z-10 shadow-sm animate-fade-in">
         <div>
           <h1 className="text-2xl md:text-4xl font-black font-display uppercase tracking-tight mb-1 flex items-center gap-2 md:gap-3">
              <Target className="text-[var(--accent-primary)] drop-shadow-[0_0_10px_rgba(0,255,157,0.5)] h-6 w-6 md:h-8 md:w-8" /> Active Missions
           </h1>
           <p className="text-[var(--text-muted)] text-[10px] md:text-sm uppercase tracking-widest font-bold">AI-Powered Study Journal</p>
         </div>
         <Button onClick={() => setShowAddForm(true)} className="w-full md:w-auto bg-[var(--accent-primary)] text-black hover:bg-[var(--accent-primary)]/90 px-5 py-3 md:py-5 md:px-6 rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all font-bold uppercase tracking-widest text-xs md:text-sm hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
            <Plus size={16} /> Deploy Unit
         </Button>
      </div>

      {/* Tab Switcher */}
      <div className="px-4 md:px-8 py-0 md:py-3 border-b border-[var(--border-subtle)] flex-none flex bg-[var(--bg-primary)]/40 relative z-10">
        <button
          onClick={() => setActiveTab('missions')}
          className={`flex-1 md:flex-none text-center py-4 md:py-0 md:pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'missions' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
        >
          Active Missions ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`flex-1 md:flex-none text-center py-4 md:py-0 md:pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'habits' ? 'border-purple-500 text-purple-400' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
        >
          Habit Directives ({habits.length})
        </button>
      </div>

      {activeTab === 'missions' ? (
        <>
          {/* Mobile Swipeable Kanban (block md:hidden) */}
          <div 
            className="block md:hidden flex-1 flex flex-col p-4 relative z-10 overflow-y-auto pb-24"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
             {/* Small Chips Swapper */}
             <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-1">
                {columnIds.map((colId) => {
                  const count = columns[colId].length;
                  const isSelected = mobileColumn === colId;
                  
                  let borderActive = "border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_0_10px_rgba(0,255,157,0.15)]";
                  if (colId === 'Completed') {
                    borderActive = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                  } else if (colId === 'Critical') {
                    borderActive = "border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]";
                  } else if (colId === 'High') {
                    borderActive = "border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]";
                  } else if (colId === 'Medium') {
                    borderActive = "border-yellow-500/50 bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.15)]";
                  }

                  return (
                    <button
                      key={colId}
                      onClick={() => setMobileColumn(colId)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 transition-all duration-200",
                        isSelected 
                          ? borderActive
                          : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                      )}
                    >
                      {colId} ({count})
                    </button>
                  );
                })}
             </div>

             {/* Column Navigation Switcher */}
             <div className="flex justify-between items-center bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)]/60 rounded-xl px-4 py-3.5 mb-4 shadow-sm">
                <button 
                  onClick={handlePrevColumn} 
                  className="p-1 text-[var(--text-muted)] hover:text-white active:scale-90 transition-transform"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)]">
                  {COLUMN_CONFIG[mobileColumn].title} ({columns[mobileColumn].length})
                </span>
                <button 
                  onClick={handleNextColumn} 
                  className="p-1 text-[var(--text-muted)] hover:text-white active:scale-90 transition-transform"
                >
                  <ChevronRight size={20} />
                </button>
             </div>

             {/* Active Column Cards */}
             <div className="flex-1 min-h-0 flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mobileColumn}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                     {columns[mobileColumn].length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 bg-[var(--bg-secondary)]/30 border border-dashed border-[var(--border-subtle)] rounded-2xl text-center">
                           <p className="text-2xl mb-2">🎉</p>
                           <h4 className="font-bold text-sm text-[var(--text-primary)]">🎉 No tasks here</h4>
                           <p className="text-xs text-[var(--text-muted)] mt-1">Everything looks under control.</p>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           {columns[mobileColumn].map(task => (
                              <motion.div
                                 key={task.id}
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ duration: 0.2 }}
                                 onClick={() => setSelectedTask(task)}
                                 className="w-full"
                              >
                                 <TaskCard task={task} isSelected={selectedTask?.id === task.id} />
                              </motion.div>
                           ))}
                        </div>
                     )}
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>

          {/* Desktop Kanban (hidden md:block) */}
          <div className="hidden md:block flex-1 min-h-0">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex-1 overflow-x-auto p-8 overflow-y-hidden relative z-10">
                 <div className="flex gap-6 h-full min-h-[600px] items-stretch pb-4">
                    {(Object.keys(COLUMN_CONFIG) as ColumnId[]).map(colId => (
                       <KanbanColumn 
                          key={colId} 
                          id={colId} 
                          title={COLUMN_CONFIG[colId].title} 
                          tasks={columns[colId]} 
                          onClickTask={(t) => setSelectedTask(t)}
                          selectedTaskId={selectedTask?.id}
                       />
                    ))}
                 </div>
              </div>

              <DragOverlay>
                 {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        </>
      ) : (
        /* Habits Grid Layout */
        <div className="flex-1 overflow-y-auto p-8 relative z-10 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {habits.map(h => {
              const todayStr = new Date().toLocaleDateString('en-CA');
              const isCompletedToday = h.completedDates.includes(todayStr);
              
              return (
                <div
                  key={h.id}
                  onClick={() => {
                    setSelectedHabitId(h.id);
                    setIsHabitDetailsOpen(true);
                  }}
                  className={`bg-gradient-to-br from-[var(--bg-secondary)]/40 to-[var(--bg-secondary)]/70 border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xl relative overflow-hidden group transition-all cursor-pointer hover:scale-[1.01] hover:shadow-purple-500/5
                    ${isCompletedToday ? 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5' : 'hover:border-purple-500/30'}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                        {h.category}
                      </span>
                      <h2 className={`text-lg font-bold font-display text-[var(--text-primary)] mt-3 group-hover:text-purple-400 transition-colors ${isCompletedToday ? 'line-through text-[var(--text-muted)]' : ''}`}>
                        {h.name}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCompletedToday) {
                          completeHabit(h.id);
                        }
                      }}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0
                        ${isCompletedToday 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                          : "border-[var(--border-subtle)] hover:border-purple-500 hover:bg-purple-500/10"
                        }`}
                    >
                      {isCompletedToday ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)]/30 pt-4 mt-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-purple-400" />
                      <div className="text-xs">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold">Pattern</div>
                        <div className="font-bold text-[var(--text-secondary)]">{h.repeatPattern}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-purple-400" />
                      <div className="text-xs">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-extrabold">Duration</div>
                        <div className="font-bold text-[var(--text-secondary)]">{h.duration} mins</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)]/40 rounded-xl p-3">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw size={12} className="text-purple-400 animate-spin-slow shrink-0" />
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] font-mono">{h.startTime} - {h.endTime}</span>
                    </div>
                    {h.streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        🔥 {h.streak} Streak
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sliding Drawer for Task Details */}
      <AnimatePresence>
         {selectedTask && (
             <>
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                  onClick={() => setSelectedTask(null)}
               />
                               <motion.div 
                   initial={isMobile ? { y: '100%' } : { x: '100%' }} 
                   animate={isMobile ? { y: 0 } : { x: 0 }} 
                   exit={isMobile ? { y: '100%' } : { x: '100%' }}
                   transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                   className={cn(
                      "fixed bg-[var(--bg-secondary)] shadow-2xl z-[110] flex flex-col transition-all duration-300",
                      isMobile 
                         ? "bottom-0 left-0 right-0 h-[92vh] rounded-t-[2rem] border-t border-[var(--border-subtle)]" 
                         : "top-0 right-0 h-full w-full sm:w-[450px] border-l border-[var(--border-subtle)]"
                   )}
                >
                   <TaskDrawerContent 
                      task={selectedTask} 
                      onClose={() => setSelectedTask(null)} 
                      updateTask={updateTask}
                      deleteTask={deleteTask}
                      onComplete={() => { confirmTaskProgress(selectedTask.id, 100); setSelectedTask(null); }}
                      navigate={navigate}
                      isMobile={isMobile}
                   />
                </motion.div>
             </>
         )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile Quests */}
      {!selectedTask && (
         <div className="block md:hidden fixed bottom-20 right-6 z-30">
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-14 h-14 bg-[var(--accent-primary)] text-black rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,255,157,0.4)] hover:scale-105 active:scale-95 transition-all"
              id="mobile-fab"
            >
               <Plus size={24} strokeWidth={3} />
            </button>
         </div>
      )}

      <HabitDetailsPanel
        habit={habits.find(h => h.id === selectedHabitId) || null}
        isOpen={isHabitDetailsOpen}
        onClose={() => {
          setIsHabitDetailsOpen(false);
          setSelectedHabitId(null);
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

function KanbanColumn({ id, title, tasks, onClickTask, selectedTaskId }: { id: ColumnId, title: string, tasks: Task[], onClickTask: (t: Task) => void, selectedTaskId?: string, key?: React.Key }) {
  const { setNodeRef } = useSortable({ id: id, data: { type: 'Column', id } });

  return (
    <div className="w-[320px] flex-none flex flex-col bg-[var(--bg-secondary)]/40 backdrop-blur-md border border-[var(--border-subtle)]/50 rounded-2xl overflow-hidden shrink-0 shadow-xl relative z-10">
       <div className="p-4 border-b border-[var(--border-subtle)]/50 bg-[var(--bg-secondary)]/50 flex justify-between items-center backdrop-blur-xl">
          <h3 className="font-black uppercase tracking-widest text-sm">{title}</h3>
          <Badge variant="outline" className="bg-[var(--bg-primary)]/50 border-[var(--border-subtle)]/50 text-[var(--text-secondary)] backdrop-blur-md">{tasks.length}</Badge>
       </div>
       <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto space-y-3 pb-8">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
             {tasks.map(task => (
                <SortableTaskCard key={task.id} task={task} onClick={() => onClickTask(task)} isSelected={selectedTaskId === task.id} />
             ))}
          </SortableContext>
       </div>
    </div>
  );
}

function SortableTaskCard({ task, onClick, isSelected }: { task: Task, onClick: () => void, isSelected?: boolean, key?: React.Key }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={(e) => { e.stopPropagation(); onClick(); }}>
       <TaskCard task={task} isDragging={isDragging} isSelected={isSelected} />
    </div>
  );
}

function TaskCard({ task, isOverlay, isDragging, isSelected }: { task: Task, isOverlay?: boolean, isDragging?: boolean, isSelected?: boolean }) {
  const { tasks } = useUser();
  const score = task.riskEngine.riskScore;
  const isCompleted = task.realityState.effectivePercent >= 100;
  
  let accent = 'border-green-500/30';
  let badgeColor = 'text-green-500 bg-green-500/10';
  let glow = 'hover:shadow-[0_5px_15px_rgba(34,197,94,0.15)]';
  
  if (isCompleted) {
     accent = 'border-emerald-500/50';
     badgeColor = 'text-emerald-500 bg-emerald-500/10';
     glow = 'hover:shadow-[0_5px_15px_rgba(16,185,129,0.2)]';
  } else if (score > 75) {
     accent = 'border-red-500/50';
     badgeColor = 'text-red-500 bg-red-500/10';
     glow = 'hover:shadow-[0_5px_15px_rgba(239,68,68,0.2)]';
  } else if (score > 50) {
     accent = 'border-orange-500/50';
     badgeColor = 'text-orange-500 bg-orange-500/10';
     glow = 'hover:shadow-[0_5px_15px_rgba(249,115,22,0.2)]';
  } else if (score > 25) {
     accent = 'border-yellow-500/40';
     badgeColor = 'text-yellow-500 bg-yellow-500/10';
     glow = 'hover:shadow-[0_5px_15px_rgba(234,179,8,0.15)]';
  }

  return (
    <motion.div 
      layoutId={isOverlay ? undefined : task.id}
      className={cn(
        "relative bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-300",
        isOverlay ? "scale-105 shadow-[10px_10px_30px_rgba(0,0,0,0.5)] rotate-2 z-50 ring-1 ring-[var(--accent-primary)]" : glow,
        task.isPinned && "border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5",
        accent,
        isSelected && "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 shadow-[0_0_20px_rgba(0,255,157,0.45)] bg-[var(--accent-primary)]/5 scale-[1.02]"
      )}
    >
       <div className="absolute inset-0 rounded-xl ring-1 ring-white/5 pointer-events-none"></div>

       <div className="flex justify-between items-start mb-3 relative z-10">
          <Badge variant="outline" className={cn("text-[10px] uppercase font-black tracking-widest border-0 px-2 py-0.5", badgeColor)}>
             {task.category}
          </Badge>
          {task.isPinned && <div className="text-[var(--accent-primary)]"><Pin size={14} className="fill-current drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]" /></div>}
       </div>
       <h4 className="font-bold text-sm text-[var(--text-primary)] mb-4 leading-tight relative z-10">{task.title}</h4>

       <details className="relative z-10 group cursor-pointer mb-3" onClick={(e) => e.stopPropagation()}>
         <summary className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider select-none inline-flex items-center outline-none list-none [&::-webkit-details-marker]:hidden transition-colors">
            <span className="mr-1">ℹ️</span> Why is this ranked here? <ChevronDown className="ml-1 h-3 w-3 group-open:rotate-180 transition-transform inline" />
         </summary>
         <div className="mt-2 text-[11px] text-[var(--text-secondary)] italic leading-relaxed bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-subtle)] shadow-inner">
             {(() => {
                const activeTasks = tasks.filter(t => t.realityState.effectivePercent < 100);
                const rank = activeTasks.findIndex(t => t.id === task.id) + 1;
                const diffMs = new Date(task.deadline).getTime() - Date.now();
                const diffHrs = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
                const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                const dueStr = diffHrs < 24 ? `${diffHrs} hours` : `${diffDays} days`;
                return `Ranked #${rank} because: Risk Score is ${task.riskEngine.riskScore.toFixed(0)} (${task.riskEngine.riskTier}), Importance is ${task.importance.final}, and it's due in ${dueStr}.`;
             })()}
         </div>
       </details>
       
       <div className="grid grid-cols-2 gap-3 text-xs border-t border-[var(--border-subtle)] pt-3 relative z-10">
          <div>
             <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-0.5">Deadline</p>
             {task.workspaceId ? (
                <p className="font-medium text-[var(--text-secondary)] italic">Shared Task</p>
             ) : (
                <p className="font-medium text-[var(--text-primary)]">{task.deadline && !isNaN(new Date(task.deadline).getTime()) ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : 'Unknown'}</p>
             )}
          </div>
          <div>
             <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-0.5">Risk</p>
             {task.workspaceId ? (
                <p className="font-medium text-[var(--text-secondary)] italic">N/A</p>
             ) : (
                <p className={cn("font-bold", score > 75 ? 'text-red-500' : 'text-[var(--text-primary)]')}>{score.toFixed(0)}%</p>
             )}
          </div>
       </div>

       <div className="mt-3 relative z-10 flex items-center">
           {task.plannedState?.plannedWorkBlocks && task.plannedState.plannedWorkBlocks.length > 0 ? (
               <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1">
                  📅 Calendar Synced
               </Badge>
           ) : (
               <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-500 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1">
                  ⚠ Scheduling Required
               </Badge>
           )}
       </div>
    </motion.div>
  );
}

function TaskDrawerContent({ task, onClose, updateTask, deleteTask, onComplete, navigate, isMobile }: { task: Task, onClose: () => void, updateTask: any, deleteTask: any, onComplete: () => void, navigate: any, isMobile: boolean }) {
   const isCompleted = task.realityState.effectivePercent >= 100;

   const score = task.riskEngine.riskScore;
   let accent = 'text-green-500';
   if (isCompleted) accent = 'text-emerald-500';
   else if (score > 75) accent = 'text-red-500';
   else if (score > 50) accent = 'text-orange-500';
   else if (score > 25) accent = 'text-yellow-500';

   return (
      <>
         <div className={cn(
            "px-4 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)] flex-shrink-0",
            isMobile && "rounded-t-[20px]"
         )}>
            {isMobile ? (
               <h2 className="font-display font-black text-[22px] leading-tight text-[var(--text-primary)] line-clamp-2">{task.title}</h2>
            ) : (
               <h2 className="font-display font-black text-xs uppercase tracking-widest text-[var(--text-muted)]">Task Details</h2>
            )}
            <button onClick={onClose} className="p-2 border border-[var(--border-subtle)] rounded-full text-[var(--text-muted)] hover:text-white bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)]/20 transition-colors">
               <X size={16} />
            </button>
         </div>
         
         <div className={cn(
            "flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-secondary)]",
            isMobile && "pb-[220px]"
         )}>
            {isMobile ? (
               <div className="flex gap-2">
                  <Badge variant="outline" className="bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] text-[11px] h-6 px-2.5 uppercase tracking-widest font-bold">
                     {task.category}
                  </Badge>
                  {task.isPinned && (
                     <Badge variant="outline" className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 text-xs uppercase tracking-widest font-bold flex items-center gap-1">
                        <Pin size={10} className="fill-current" /> Pinned
                     </Badge>
                  )}
               </div>
            ) : (
               <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-3 font-display tracking-tight">{task.title}</h1>
                  <div className="flex gap-2">
                     <Badge variant="outline" className="bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] text-xs uppercase tracking-widest font-bold">
                        {task.category}
                     </Badge>
                     {task.isPinned && (
                        <Badge variant="outline" className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 text-xs uppercase tracking-widest font-bold flex items-center gap-1">
                           <Pin size={10} className="fill-current" /> Pinned
                        </Badge>
                     )}
                  </div>
               </div>
            )}

            <div className="grid grid-cols-2 gap-3 bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div>
                   <p className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Deadline</p>
                   {task.workspaceId ? (
                      <p className="font-bold text-[var(--text-secondary)] italic text-[16px]">Shared Task</p>
                   ) : (
                      <p className="font-bold text-[var(--text-primary)] font-mono text-[22px]">{task.deadline && !isNaN(new Date(task.deadline).getTime()) ? new Date(task.deadline).toLocaleDateString() : 'Unknown Date'}</p>
                   )}
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Risk Score</p>
                   {task.workspaceId ? (
                      <p className="font-bold text-[var(--text-secondary)] italic text-[14px]">N/A</p>
                   ) : (
                      <p className={cn("font-bold font-mono text-sm", accent)}>{task.riskEngine.riskScore.toFixed(0)}%</p>
                   )}
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Reality Gap</p>
                   <p className="font-bold text-[var(--text-primary)] font-mono text-sm">{task.riskEngine.breakdown?.progressGap?.toFixed(0) || 0}%</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Est. Remaining</p>
                   <p className="font-bold text-[var(--text-primary)] font-mono text-sm">{(task.estimatedEffortHours * (1 - task.realityState.effectivePercent / 100)).toFixed(1)}h</p>
                </div>
            </div>

            {!task.workspaceId && (
            <div className="space-y-3">
               <h3 className="text-[16px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                  <BrainCircuit size={14} className="text-cyan-500" /> AI Insights
               </h3>
               <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl">
                  <p className="text-[14px] text-[var(--text-secondary)] italic leading-relaxed">
                     "{task.riskEngine.riskScore > 50 ? 'Immediate action required to stabilize risk trajectory.' : 'Current metrics align with operational expectations.'} Recommended focus: continuous execution over the next ${(Math.max(1, (task.estimatedEffortHours * (1 - task.realityState.effectivePercent / 100)))).toFixed(0)} hours."
                  </p>
               </div>
            </div>
            )}

            {task.description && (
               <div className="space-y-3">
                  <h3 className="text-[15px] font-black uppercase tracking-widest text-[var(--text-muted)]">Directives</h3>
                  <p className="text-[14px] text-[var(--text-secondary)] whitespace-pre-wrap">{task.description}</p>
               </div>
            )}
         </div>

          <div className={cn(
             "border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] w-full flex-shrink-0 z-10 box-border",
             isMobile 
                ? "px-4 pt-3 pb-[calc(104px+env(safe-area-inset-bottom))]" 
                : "p-6 space-y-4"
          )}>
             {isMobile ? (
                <div className="grid grid-cols-2 gap-3 w-full box-border">
                   {!isCompleted && (
                      <>
                         <Button 
                            onClick={onComplete} 
                            className={cn("w-full h-[46px] text-[14px] rounded-[12px] px-2 bg-[#1fa463] hover:bg-[#1fa463]/90 text-white font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-1.5 transition-all", task.workspaceId ? "col-span-2" : "")}
                         >
                            <Check size={18} /> Complete
                         </Button>
                         {!task.workspaceId && (
                         <Button 
                            onClick={() => { navigate(`/app/training?taskId=${task.id}`); onClose(); }} 
                            className="w-full h-[46px] text-[14px] rounded-[12px] px-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-black font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,157,0.3)] flex items-center justify-center gap-1.5 transition-all"
                         >
                            <Play size={18} className="fill-current" /> Focus
                         </Button>
                         )}
                      </>
                   )}
                   <Button 
                      onClick={() => updateTask(task.id, { isPinned: !task.isPinned })} 
                      variant="outline" 
                      className={cn(
                         "w-full h-[46px] text-[14px] px-2 rounded-[12px] bg-transparent border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold uppercase tracking-wider transition-all",
                         isCompleted && "col-span-1"
                      )}
                   >
                      {task.isPinned ? 'Unpin' : 'Pin'}
                   </Button>
                   <Button 
                      onClick={() => { deleteTask(task.id); onClose(); }} 
                      variant="outline" 
                      className={cn(
                         "w-full h-[46px] text-[14px] px-2 rounded-[12px] bg-transparent border-red-500/30 hover:bg-red-500/10 text-red-500 font-bold uppercase tracking-wider transition-all",
                         isCompleted && "col-span-1"
                      )}
                   >
                      <Trash2 size={18} className="mr-1.5" /> Delete
                   </Button>
                </div>
             ) : (
                <>
                   {!isCompleted && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                         <Button 
                            onClick={onComplete} 
                            className={cn("w-full bg-[#1fa463] hover:bg-[#1fa463]/90 text-white font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all text-[13px] py-5 rounded-xl hover:scale-[1.02] active:scale-95", task.workspaceId ? "col-span-2" : "")}
                         >
                            <Check size={16} /> Mark Complete
                         </Button>
                         {!task.workspaceId && (
                         <Button 
                            onClick={() => { navigate(`/app/training?taskId=${task.id}`); onClose(); }} 
                            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-black font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2 transition-all text-[13px] py-5 rounded-xl hover:scale-[1.02] active:scale-95"
                         >
                            <Play size={16} className="fill-current" /> Focus Now
                         </Button>
                         )}
                      </div>
                   )}
                   <div className="grid grid-cols-2 gap-3">
                      <Button 
                         onClick={() => updateTask(task.id, { isPinned: !task.isPinned })} 
                         variant="outline" 
                         className="w-full bg-transparent border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold uppercase tracking-wider transition-all text-[10px] py-2.5 rounded-xl"
                      >
                         {task.isPinned ? 'Unpin Task' : 'Pin Task'}
                      </Button>
                      <Button 
                         onClick={() => { deleteTask(task.id); onClose(); }} 
                         variant="outline" 
                         className="w-full bg-transparent border-red-500/30 hover:bg-red-500/10 text-red-500 font-bold uppercase tracking-wider transition-all text-[10px] py-2.5 rounded-xl"
                      >
                         <Trash2 size={12} className="mr-2" /> Delete
                      </Button>
                   </div>
                </>
             )}
          </div>
      </>
   );
}
