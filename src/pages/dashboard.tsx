import React, { useState } from "react";
import { motion } from "motion/react";
import { useUser } from "../context/UserContext";
import { Bot, Sparkles, CheckCircle, Clock, Copy, ChevronDown, Pin, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import TaskContextMenu from "../components/TaskContextMenu";
import { TaskDetailsPanel } from "../components/TaskDetailsPanel";
import { Task } from "../types";
import { ModelViewer } from "../components/ModelViewer";

export default function Dashboard() {
  const { 
    userState, 
    tasks, 
    confirmTaskProgress, 
    acceptRecoveryPlan, 
    confirmRetroactiveTask, 
    completeOnboarding, 
    updateTask, 
    deleteTask,
    habits,
    completeHabit
  } = useUser();
  const nextTarget = userState.level * 200 + 200;
  const xpPercent = Math.min((userState.xp / nextTarget) * 100, 100);
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;
  const xpProgress = xpPercent.toFixed(1);

  const pastDueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.realityState.confirmedPercent < 100);

  const [recoveryPlans, setRecoveryPlans] = useState<Record<string, any>>({});
  const [loadingRecovery, setLoadingRecovery] = useState<string | null>(null);
  const [extensionDrafts, setExtensionDrafts] = useState<Record<string, any>>({});
  const [loadingExtension, setLoadingExtension] = useState<string | null>(null);

  const [forgiveTask, setForgiveTask] = useState<string | null>(null);
  const [forgiveDate, setForgiveDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [forgiveDuration, setForgiveDuration] = useState<string>("60");

  if (!userState.hasSeenOnboarding) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)] px-4">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden"
         >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-green-500"></div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold font-display leading-tight text-[var(--text-primary)] mb-6">
              Most apps assume your plan = reality. <span className="text-[var(--accent-primary)]">We don't.</span>
            </h1>
            
            <p className="text-lg text-[var(--text-secondary)] mb-10 leading-relaxed font-medium">
              We track what you planned versus what actually happened, then calculate the <strong className="text-[var(--text-primary)]">Reality Gap</strong> to warn you before deadlines explode.
            </p>
            
            {/* Tiny live example */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-2xl border border-[var(--border-subtle)] mb-10 shadow-inner">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Example Task</h3>
                   <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded-md">Deadline: Tomorrow</span>
               </div>
               
               <div className="mb-3">
                   <h4 className="text-[14px] font-bold text-[var(--text-primary)] leading-tight">
                      You said you'd be 60% done. You're actually at 20%.
                   </h4>
               </div>
               <div className="h-2 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                   <div className="h-full bg-[var(--accent-primary)] relative" style={{ width: '60%', opacity: 0.3 }}>
                      <div className="absolute top-0 left-0 h-full bg-amber-500 shadow-[0_0_10px_var(--accent-primary)]" style={{ width: '33.33%' }}></div>
                   </div>
               </div>
               <div className="mt-3 flex gap-4 text-[11px] font-bold uppercase tracking-wider">
                   <span className="text-amber-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Actual (20%)</span>
                   <span className="text-[var(--text-muted)] flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-[var(--text-muted)] ml-2"></span> Gap (40%)</span>
               </div>
            </div>
            
            <button 
              onClick={() => completeOnboarding()}
              className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold text-lg py-4 rounded-xl hover:scale-[1.02] shadow-xl hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] transition-all uppercase tracking-wider"
            >
               I understand
            </button>
         </motion.div>
      </div>
    );
  }

  const computeAvailableTimeHours = (taskToRecover: any) => {
    if (!taskToRecover) return 0;
    const now = new Date();
    const deadline = new Date(taskToRecover.deadline);
    if (deadline <= now) return 0;
    let availableSlots = 0;
    let curr = new Date(now);
    curr.setMinutes(0, 0, 0); 
    curr.setHours(curr.getHours() + 1);
    while (curr < deadline) {
       const h = curr.getHours();
       if (h >= 9 && h < 21) {
          const isBusy = userState.busyBlocks.some(b => {
             const start = new Date(b.start);
             const end = new Date(b.end);
             return curr >= start && curr < end;
          });
          if (!isBusy) availableSlots++;
       }
       curr.setHours(curr.getHours() + 1);
    }
    return availableSlots;
  };

  const generateRecoveryPlan = async (task: any) => {
    setLoadingRecovery(task.id);
    try {
       const availableTimeHours = computeAvailableTimeHours(task);
       const res = await fetch("/api/gemini/recovery-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              remainingCapacity: availableTimeHours,
              requiredEffort: task.estimatedEffortHours,
              historicalLagBias: task.riskEngine?.breakdown?.historicalLagBias || 50,
              deadline: task.deadline
          })
       });
       const data = await res.json();
       if (data.infeasible) {
           data.remainingCapacity = availableTimeHours;
           data.requiredEffort = task.estimatedEffortHours;
       }
       setRecoveryPlans(prev => ({...prev, [task.id]: data}));
    } catch (e) {
       console.error("Failed to generate recovery plan", e);
    } finally {
       setLoadingRecovery(null);
    }
  };

  const generateExtensionDraft = async (task: any) => {
    setLoadingExtension(task.id);
    try {
        const availableTimeHours = computeAvailableTimeHours(task);
        const res = await fetch("/api/gemini/extension-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskTitle: task.title,
                category: task.category,
                timeDeficitHours: task.estimatedEffortHours - availableTimeHours,
                realityGapSummary: `Expected ${task.plannedState.expectedProgressCurve[0]?.expectedPercent || 0}% but actual is ${task.realityState.effectivePercent.toFixed(0)}%`
            })
        });
        const data = await res.json();
        setExtensionDrafts(prev => ({...prev, [task.id]: data}));
    } finally {
        setLoadingExtension(null);
    }
  }

  return (
    <div style={{ paddingTop: '19px' }} className="my-4 md:my-8 mx-auto max-w-7xl w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] pb-12 px-4 sm:px-6 md:px-8 pt-16 md:pt-20">
      {/* Hero Section */}
      <section className="relative bg-[var(--bg-secondary)] rounded-[24px] border border-[var(--border-subtle)] overflow-hidden shadow-sm mb-12">
        <div className="relative flex flex-col min-h-[75vh] lg:h-[85vh]">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <ModelViewer modelPath="/models/goku_ssj.glb" className="absolute inset-0 w-full h-full" />
          </div>

          <div className="relative z-10 w-full flex-1 flex flex-col justify-end p-6 sm:p-10 pb-12 pointer-events-none">
            <style>{`
              @media (max-width: 768px) {
                .hero-layout-row {
                  position: static !important;
                  display: block !important;
                  height: 100% !important;
                  width: 100% !important;
                }
                .hero-title-wrapper {
                  display: none !important;
                }
                .hero-title-text {
                  display: none !important;
                }
                .hero-subtitle-text {
                  display: none !important;
                }
                .hero-stats-wrapper {
                  position: absolute !important;
                  bottom: 76px !important;
                  right: 14px !important;
                  width: auto !important;
                  justify-content: flex-end !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  z-index: 100 !important;
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                }
                .hero-stats-container {
                  gap: 8px !important;
                  justify-content: flex-end !important;
                  width: auto !important;
                  display: flex !important;
                }
                .hero-stat-card {
                  width: 54px !important;
                  height: 54px !important;
                  min-width: 54px !important;
                  border-radius: 12px !important;
                  padding: 4px !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  flex: none !important;
                }
                .hero-stat-value {
                  font-size: 18px !important;
                  font-weight: 700 !important;
                  margin-bottom: 2px !important;
                }
                .hero-stat-label {
                  font-size: 9px !important;
                  letter-spacing: normal !important;
                }
              }
            `}</style>
            <div className="hero-layout-row flex flex-col lg:flex-row justify-between items-end gap-10 w-full mb-4 pointer-events-none">
              
              <div className="hero-title-wrapper flex-1 max-w-2xl w-full pointer-events-none">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="hero-title-text text-4xl md:text-6xl font-extrabold text-[var(--accent-primary)] tracking-tight drop-shadow-2xl font-display text-center lg:text-left pointer-events-auto select-none"
                >
                  Guardian Forge
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="hero-subtitle-text block md:block pointer-events-auto"
                >
                  Cyber Focus Engine
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="hero-stats-wrapper flex items-end gap-4 w-full lg:w-auto shrink-0 justify-center lg:justify-end pointer-events-auto"
              >
                <div className="hero-stats-container flex gap-4 w-full sm:w-auto justify-center">
                  <div className="hero-stat-card flex-1 sm:flex-none bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--border-subtle)] text-center px-6 py-4 rounded-2xl shadow-xl min-w-[100px] hover:-translate-y-1 hover:shadow-[0_4px_20px_var(--xp-glow)] transition-all duration-300">
                    <p className="hero-stat-value text-3xl font-extrabold text-[var(--accent-primary)] leading-none mb-1.5">{userState.level}</p>
                    <p className="hero-stat-label text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Level</p>
                  </div>
                  <div className="hero-stat-card flex-1 sm:flex-none bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--border-subtle)] text-center px-6 py-4 rounded-2xl shadow-xl min-w-[100px] hover:-translate-y-1 hover:shadow-[0_4px_20px_var(--xp-glow)] transition-all duration-300">
                    <p className="hero-stat-value text-3xl font-extrabold text-[var(--accent-primary)] leading-none mb-1.5">{userState.streakCount}</p>
                    <p className="hero-stat-label text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Streak</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Column */}
         <div className="lg:col-span-7 space-y-10">
             {/* Forgiveness Window */}
             {pastDueTasks.length > 0 && (
                 <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-6 shadow-md mb-8">
                     <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2"><Clock className="w-5 h-5" /> Forgiveness Window Active</h3>
                     <p className="text-[var(--text-secondary)] text-sm mb-4">You have {pastDueTasks.length} past-due tasks. The engine preserved your streak, but you must report reality:</p>
                     <div className="space-y-3">
                         {pastDueTasks.map(task => (
                             <div key={task.id} className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-4 rounded-xl flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm text-[var(--text-primary)]">{task.title}</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Due {task.deadline && !isNaN(new Date(task.deadline).getTime()) ? new Date(task.deadline).toLocaleDateString() : 'Unknown Date'}</p>
                                    </div>
                                    {forgiveTask !== task.id && (
                                       <div className="flex gap-2">
                                          <button onClick={() => setForgiveTask(task.id)} className="px-3 py-1.5 bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-widest rounded-md hover:brightness-110">Resolve Gap</button>
                                       </div>
                                    )}
                                </div>
                                {forgiveTask === task.id && (
                                   <div className="mt-2 pt-3 border-t border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div>
                                          <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block uppercase tracking-wider">When did you finish?</label>
                                          <input type="datetime-local" value={forgiveDate} onChange={e => setForgiveDate(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm" />
                                       </div>
                                       <div>
                                          <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block uppercase tracking-wider">Duration (mins)?</label>
                                          <input type="number" value={forgiveDuration} onChange={e => setForgiveDuration(e.target.value)} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--accent-primary)]" />
                                       </div>
                                       <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                            <button onClick={() => setForgiveTask(null)} className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[var(--bg-primary)]">Cancel</button>
                                            <button onClick={() => {
                                                confirmRetroactiveTask(task.id, new Date(forgiveDate).toISOString(), forgiveDuration);
                                                setForgiveTask(null);
                                            }} className="px-4 py-2 bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:brightness-110 shadow-[0_4px_15px_var(--xp-glow)]">
                                                Confirm Log
                                            </button>
                                       </div>
                                   </div>
                                )}
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Forge AI Insight & Chat */}
             <div className="bg-[var(--bg-elevated)] rounded-3xl p-8 shadow-xl relative overflow-hidden group border border-[var(--border-subtle)] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-4 text-[var(--accent-primary)]/10 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                   <Bot size={160} className="-mr-8 -mt-8" />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                   <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
                     <Sparkles className="h-5 w-5 animate-pulse" />
                   </div>
                   <h3 className="text-[var(--text-primary)] font-bold text-xl">Forge AI Insight</h3>
                </div>
                <div className="bg-[var(--bg-primary)]/50 rounded-2xl p-6 mb-6 relative z-10 border border-[var(--border-subtle)]/50 backdrop-blur-sm group-hover:bg-[var(--bg-primary)]/70 transition-colors">
                   <p className="text-[var(--text-secondary)] italic leading-relaxed text-[15px]">
                      {(() => {
                         const lags = Object.entries(userState.historicalLagByCategory || {}) as [string, number][];
                         if (lags.length > 0) {
                            const [topCategory, lagValue] = lags.sort((a,b) => b[1] - a[1])[0];
                            return `"You typically need ${lagValue}% more time than estimated for ${topCategory} tasks — I've padded today's Recovery Plan accordingly."`;
                         }
                         return `"Based on your focus patterns, you are 20% more productive in the mornings. I've adjusted your suggestions."`;
                      })()}
                   </p>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden focus-within:border-[var(--accent-primary)] transition-colors">
                       <input 
                         type="text" 
                         placeholder="Ask FocusForge or log an activity..." 
                         className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                         onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                                 const target = e.currentTarget;
                                 const val = target.value;
                                 if (val.trim()) {
                                     target.value = "Analyzing risk patterns...";
                                     setTimeout(() => {
                                         target.value = "";
                                         alert("Forge AI: Looking at your Risk Engine, your most at-risk task is '" + (tasks.find(t => t.riskEngine.riskTier === 'Red')?.title || tasks[0]?.title || 'none') + "'. I recommend dedicating your next focus session to it.");
                                     }, 1500);
                                 }
                             }
                         }}
                       />
                       <button className="px-4 py-3 text-[var(--accent-primary)] hover:bg-[var(--bg-primary)] transition-colors">
                          <Bot size={18} />
                       </button>
                    </div>
                </div>
             </div>

             {/* Active Training Zone */}
             <div>
                <div className="flex items-center gap-3 mb-6">
                   <h2 className="font-bold text-[var(--text-primary)] text-xl">Active Training Zone</h2>
                </div>
                <div className="border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50 transition-all duration-300 rounded-3xl h-56 flex flex-col items-center justify-center text-center p-8 group cursor-pointer hover:-translate-y-1 hover:shadow-lg">
                   <div className="w-16 h-16 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[var(--accent-primary)]/20 transition-all duration-300">
                     <Clock className="h-8 w-8 text-[var(--accent-primary)]/80" />
                   </div>
                   <p className="font-bold text-[var(--text-primary)] text-lg mb-2">Your high-intensity focus area will appear here.</p>
                   <p className="text-sm text-[var(--text-muted)] max-w-sm">Navigate to Training to begin your focused session and earn extra XP.</p>
                </div>
             </div>

             {/* Task Cards */}
             <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                   <h2 className="font-bold text-[var(--text-primary)] text-xl">Active Tasks & Risk Analysis</h2>
                   <Link to="/app/tasks" className="text-sm font-semibold text-[var(--accent-primary)] hover:underline">View All</Link>
                </div>
// Sort tasks: pinned first
                 {[...tasks].filter(t => t.realityState.effectivePercent < 100).sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return 0;
                 }).map((task) => {
                    const isHigh = task.riskEngine.riskTier === 'Red';
                   const isMed = task.riskEngine.riskTier === 'Yellow';
                   const borderClass = isHigh ? 'border-l-red-500' : isMed ? 'border-l-amber-500' : 'border-l-[var(--accent-primary)]';
                   const badgeBg = isHigh ? 'bg-red-500/10' : isMed ? 'bg-amber-500/10' : 'bg-[var(--accent-primary)]/10';
                   const badgeText = isHigh ? 'text-red-500' : isMed ? 'text-amber-500' : 'text-[var(--accent-primary)]';
                   const riskText = isHigh ? `Crit Risk: ${task.riskEngine.riskScore.toFixed(0)}` : isMed ? `Warn Risk: ${task.riskEngine.riskScore.toFixed(0)}` : `Safe: ${task.riskEngine.riskScore.toFixed(0)}`;

                   return (
                      <motion.div 
                         initial={{opacity: 0, y: 10}}
                         animate={{opacity: 1, y: 0}}
                         key={task.id} 
                         className={`bg-[var(--bg-primary)] border-l-[6px] ${borderClass} border-t border-r border-b border-[var(--border-subtle)] rounded-2xl p-6 relative group hover:shadow-lg transition-all z-10 has-[[data-state=open]]:z-50`}>
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1 ${badgeBg} ${badgeText} text-[10px] font-extrabold rounded-md uppercase tracking-wider`}>{riskText}</span>
                                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{task.category}</span>
                               </div>
                               <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-md inline-block border border-[var(--border-subtle)] mt-1">
                                  <span className="font-bold text-[var(--text-primary)]">Procrastination Score:</span> Expected Progress by now: {(task.riskEngine.breakdown.progressGap + task.realityState.effectivePercent).toFixed(0)}% — Actual Progress: {task.realityState.effectivePercent.toFixed(0)}% — You're <span className="font-bold text-[var(--accent-primary)]">{task.riskEngine.breakdown.progressGap.toFixed(0)}%</span> behind schedule.
                               </div>
                            </div>
                            <TaskContextMenu
                               task={task}
                               onViewDetails={() => {
                                 setSelectedTaskId(task.id);
                                 setIsDetailsOpen(true);
                               }}
                            />
                         </div>
                         <h3 className="font-bold text-[var(--text-primary)] text-[17px] mb-1.5 flex items-center gap-2">
                           {task.isPinned && <Pin size={14} className="text-[var(--accent-primary)] fill-current" />}
                           {task.title}
                         </h3>

                         <details className="relative z-10 group cursor-pointer mb-3">
                           <summary className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider select-none inline-flex items-center outline-none list-none [&::-webkit-details-marker]:hidden transition-colors">
                              <span className="mr-1">ℹ️</span> Why is this ranked here? <ChevronDown className="ml-1 h-3 w-3 group-open:rotate-180 transition-transform inline" />
                           </summary>
                           <div className="mt-2 text-[11px] text-[var(--text-secondary)] italic leading-relaxed bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-subtle)] shadow-inner">
                               {(() => {
                                  if (task.workspaceId) return "Shared Task - No deadline tracking.";
                                  const activeTasks = tasks.filter(t => t.realityState.effectivePercent < 100 && !t.workspaceId);
                                  const rank = activeTasks.findIndex(t => t.id === task.id) + 1;
                                  const diffMs = new Date(task.deadline).getTime() - Date.now();
                                  const diffHrs = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
                                  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                                  const dueStr = diffHrs < 24 ? `${diffHrs} hours` : `${diffDays} days`;
                                  return `Ranked #${rank} because: Risk Score is ${task.riskEngine.riskScore.toFixed(0)} (${task.riskEngine.riskTier}), Importance is ${task.importance?.final || 'Medium'}, and it's due in ${dueStr}.`;
                               })()}
                           </div>
                         </details>
                         
                         {/* Risk Breakdown Details */}
                         {!task.workspaceId && (
                         <div className="mt-4 bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-subtle)]">
                            <div className="mb-3">
                               <h4 className="text-[14px] font-bold text-[var(--text-primary)] leading-tight">
                                  You said you'd be {(task.riskEngine.breakdown.progressGap + task.realityState.effectivePercent).toFixed(0)}% done. You're actually at {task.realityState.effectivePercent.toFixed(0)}%.
                               </h4>
                            </div>
                            <div className="h-2 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)] mb-2">
                               <div className="h-full bg-[var(--accent-primary)] relative" style={{ width: `${Math.min(100, task.riskEngine.breakdown.progressGap + task.realityState.effectivePercent)}%`, opacity: 0.3 }}>
                                  <div className="absolute top-0 left-0 h-full bg-[var(--accent-primary)]" style={{ width: `${(task.realityState.effectivePercent / Math.max(1, (task.riskEngine.breakdown.progressGap + task.realityState.effectivePercent))) * 100}%` }}></div>
                               </div>
                            </div>
                            
                            <details className="mt-3 group cursor-pointer">
                               <summary className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider select-none hover:text-[var(--text-primary)] transition-colors inline-flex items-center outline-none list-none [&::-webkit-details-marker]:hidden">
                                  Show Technical Breakdown <ChevronDown className="ml-1 h-3 w-3 group-open:rotate-180 transition-transform" />
                               </summary>
                               <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-3 border-t border-[var(--border-subtle)] pt-3">
                                  <div className="flex justify-between">
                                     <span>Gap Penalty:</span>
                                     <span className="text-[var(--text-primary)]">{(task.riskEngine.breakdown.progressGap * 0.4).toFixed(1)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                     <span>Urgency:</span>
                                     <span className="text-[var(--text-primary)]">{(task.riskEngine.breakdown.urgency * 0.25).toFixed(1)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                     <span>Lag Bias:</span>
                                     <span className="text-[var(--text-primary)]">{(task.riskEngine.breakdown.historicalLagBias * 0.2).toFixed(1)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                     <span>Workload:</span>
                                     <span className="text-[var(--text-primary)]">{(task.riskEngine.breakdown.workloadDensity * 0.15).toFixed(1)}</span>
                                  </div>
                               </div>
                            </details>
                         </div>
                         )}

                         <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider mt-5">
                            <span className="text-[var(--text-muted)] flex items-center gap-1.5 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                               {task.workspaceId ? (
                                   <span className="text-[var(--text-secondary)] italic">Shared Task</span>
                               ) : (
                                   <>
                                      <Clock className="h-3.5 w-3.5" />
                                      {task.deadline && !isNaN(new Date(task.deadline).getTime()) ? new Date(task.deadline).toLocaleDateString() : 'Unknown Date'}
                                   </>
                               )}
                            </span>
                            {task.riskEngine.uncertaintyFlag && !task.workspaceId && (
                               <span className="text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">Inferred Progress</span>
                            )}
                         </div>

                         {/* Actions for Red Tasks */}
                         {isHigh && (
                            <div className="mt-5 border-t border-[var(--border-subtle)] pt-4 space-y-4">
                               {!recoveryPlans[task.id] && !extensionDrafts[task.id] && (
                                   <div className="flex gap-2">
                                       <button 
                                           onClick={() => generateRecoveryPlan(task)}
                                           disabled={loadingRecovery === task.id}
                                           className="flex-1 bg-[var(--accent-primary)] text-white text-[11px] font-bold uppercase tracking-widest py-2 rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                           {loadingRecovery === task.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                                           Generate Recovery Plan
                                       </button>
                                   </div>
                               )}

                               {recoveryPlans[task.id] && (
                                   <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 text-sm relative overflow-hidden">
                                       <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-primary)]" />
                                       <h4 className="font-bold text-[var(--accent-primary)] mb-2 text-xs uppercase tracking-wider flex justify-between items-center">
                                           Recovery Plan Generated
                                       </h4>
                                       {recoveryPlans[task.id].infeasible ? (
                                           <div className="space-y-3">
                                               <p className="text-[var(--text-secondary)] font-medium text-xs leading-relaxed">
                                                   The required effort exceeds your remaining focus capacity. This deadline is computationally infeasible without massive burnout.
                                               </p>
                                               {!extensionDrafts[task.id] ? (
                                                   <button 
                                                       onClick={() => generateExtensionDraft(task)}
                                                       disabled={loadingExtension === task.id}
                                                       className="w-full bg-red-500/10 text-red-500 text-[11px] font-bold uppercase tracking-widest py-2 rounded-xl hover:bg-red-500/20 disabled:opacity-50 transition-all">
                                                       {loadingExtension === task.id ? 'Drafting...' : 'Draft Extension Request'}
                                                   </button>
                                               ) : null}
                                           </div>
                                       ) : (
                                           <div className="space-y-3">
                                               <p className="text-[var(--text-secondary)] font-medium text-xs leading-relaxed italic">{recoveryPlans[task.id].reasoning}</p>
                                               <div className="space-y-1 mt-2">
                                                   {recoveryPlans[task.id].schedule.map((slot: any, idx: number) => (
                                                       <div key={idx} className="flex justify-between items-center text-xs font-mono bg-[var(--bg-primary)] px-2 py-1 rounded-md">
                                                           <span>{slot.date}</span>
                                                           <span className="text-[var(--text-muted)]">{slot.start} - {slot.end}</span>
                                                       </div>
                                                   ))}
                                               </div>
                                               <button 
                                                   onClick={() => acceptRecoveryPlan(task.id, recoveryPlans[task.id])}
                                                   disabled={task.recoveryPlan.status === 'accepted'}
                                                   className="w-full mt-2 bg-[var(--bg-primary)] border border-[var(--accent-primary)]/40 text-[var(--text-primary)] text-[11px] font-bold uppercase tracking-widest py-2 rounded-xl hover:bg-[var(--accent-primary)] hover:text-white transition-all disabled:opacity-60 disabled:bg-[var(--accent-primary)] disabled:text-white disabled:hover:scale-100 disabled:cursor-default">
                                                   {task.recoveryPlan.status === 'accepted' ? 'Schedule Applied' : 'Accept Schedule'}
                                               </button>
                                           </div>
                                       )}
                                   </div>
                               )}

                               {extensionDrafts[task.id] && (
                                   <div className="bg-[var(--bg-secondary)] border border-red-500/20 rounded-xl p-4 text-sm relative overflow-hidden">
                                       <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                                       <h4 className="font-bold text-red-500 mb-2 text-xs uppercase tracking-wider flex justify-between items-center">
                                           Extension Draft Request
                                           <button 
                                              onClick={() => navigator.clipboard.writeText(extensionDrafts[task.id].draft)} 
                                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" 
                                              title="Copy to clipboard">
                                              <Copy className="h-3.5 w-3.5" />
                                           </button>
                                       </h4>
                                       <textarea 
                                           readOnly 
                                           className="w-full h-32 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs leading-relaxed text-[var(--text-secondary)] focus:outline-none resize-none"
                                           value={extensionDrafts[task.id].draft}
                                       />
                                   </div>
                               )}
                            </div>
                         )}
                      </motion.div>
                   )
                })}
                {tasks.filter(t => t.realityState.effectivePercent < 100).length === 0 && (
                   <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-subtle)]">
                     No active tasks. You are all caught up for today!
                   </div>
                )}
                
                {tasks.filter(t => t.realityState.effectivePercent >= 100).length > 0 && (
                    <div className="mt-8 pt-4 border-t border-[var(--border-subtle)]">
                        <h2 className="font-bold text-[var(--text-primary)] text-xl mb-4 text-emerald-500 flex items-center gap-2">
                           <CheckCircle className="h-5 w-5" /> Completed Tasks
                        </h2>
                        <div className="space-y-3">
                           {tasks.filter(t => t.realityState.effectivePercent >= 100).map(task => (
                               <div key={task.id} className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                                          <CheckCircle className="h-4 w-4" />
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-emerald-600 text-[15px]">{task.title}</h3>
                                          <p className="text-xs text-emerald-600/70 uppercase tracking-widest">{task.category}</p>
                                      </div>
                                  </div>
                                  <div className="text-emerald-500 font-bold text-xs uppercase tracking-wider">
                                     Fully Synced
                                  </div>
                               </div>
                           ))}
                        </div>
                    </div>
                )}
             </div>
         </div>

         {/* Right Column */}
         <div className="lg:col-span-5 space-y-8">
             {/* XP Progress Card */}
             <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-center mb-5">
                   <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Progress to Level {userState.level + 1}</p>
                   <p className="text-[var(--accent-primary)] font-bold text-lg group-hover:scale-110 transition-transform">{xpProgress}%</p>
                </div>
                <div className="w-full bg-[var(--bg-secondary)] h-3 rounded-full overflow-hidden mb-6 border border-[var(--border-subtle)]">
                   <motion.div 
                      className="bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400 h-full rounded-full" 
                      initial={{width:0}} 
                      animate={{width: `${xpPercent}%`}} 
                      transition={{duration: 1.5, ease: 'easeOut'}}
                   />
                </div>
                <div className="flex justify-between items-center text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                   <span>{userState.xp.toLocaleString()} XP</span>
                   <span>{nextTarget.toLocaleString()} XP</span>
                </div>
             </div>

             {/* Focus Metrics */}
             <div>
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-[var(--text-primary)] text-lg">Today's Performance</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl text-center border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <p className="text-4xl font-extrabold text-[var(--text-primary)] mb-2 font-display">{(userState.focusMinutesToday/60).toFixed(1)}h</p>
                      <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Focus Target</p>
                   </div>
                   <div className="bg-[var(--accent-primary)]/10 p-6 rounded-3xl text-center border border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/15 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <p className="text-4xl font-extrabold text-[var(--accent-primary)] mb-2 font-display">{userState.tasksCompletedToday}</p>
                      <p className="text-[11px] font-bold text-[var(--accent-primary)]/80 uppercase tracking-widest">Tasks Done</p>
                   </div>
                </div>
             </div>
              {/* Habits Streak Widget */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-[var(--text-primary)] text-lg">Daily Habits</h3>
                  <Link to="/app/tasks" className="text-xs font-semibold text-purple-400 hover:underline">Manage</Link>
                </div>
                {habits.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic text-center py-4">No habit directives set. Establish some in the Calendar!</p>
                ) : (
                  <div className="space-y-4">
                    {habits.slice(0, 3).map((h) => {
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const isCompletedToday = h.completedDates.includes(todayStr);
                      return (
                        <div key={h.id} className="flex justify-between items-center bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)]/45 rounded-2xl p-4">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[var(--text-primary)] truncate">{h.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">{h.repeatPattern} • {h.duration}m</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {h.streak > 0 && (
                              <span className="text-[11px] font-extrabold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                🔥 {h.streak}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (!isCompletedToday) completeHabit(h.id);
                              }}
                              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all
                                ${isCompletedToday 
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md" 
                                  : "border-[var(--border-subtle)] hover:border-purple-500 hover:bg-purple-500/10 text-[var(--text-secondary)]"
                                }`}
                            >
                              {isCompletedToday ? <CheckCircle className="w-4 h-4 text-white animate-pulse" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

             {/* Heatmap Simulation */}
             <div className="bg-[var(--risk-high)]/5 p-8 rounded-3xl border border-[var(--risk-high)]/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <p className="text-[11px] font-bold text-[var(--risk-high)]/80 uppercase mb-6 tracking-widest">Focus Intensity Heatmap</p>
                <div className="grid grid-cols-12 gap-2">
                   {Array.from({length: 24}).map((_, i) => {
                      const intensity = [10, 30, 60, 100, 100, 80, 10, 40, 90, 60, 20, 10, 5, 10, 20, 40, 70, 80, 90, 60, 40, 30, 20, 10][i];
                      return (
                         <div 
                           key={i} 
                           className="h-10 rounded-[4px] bg-[var(--risk-high)] hover:bg-[var(--risk-high)] transition-all hover:-translate-y-1 hover:shadow-[0_4px_12px_var(--risk-high)] cursor-crosshair transform-gpu" 
                           style={{opacity: intensity / 100}}
                           title={`Hour ${i}: ${intensity}% intensity`}
                         ></div>
                      )
                   })}
                </div>
             </div>
          </div>
      </div>
      <TaskDetailsPanel
        task={selectedTask}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTaskId(null);
        }}
        onPin={() => {
          if (selectedTask) updateTask(selectedTask.id, { isPinned: !selectedTask.isPinned });
        }}
        onEdit={(updates) => {
          if (selectedTask) {
             updateTask(selectedTask.id, updates);
          }
        }}
        onComplete={() => {
          if (selectedTask) confirmTaskProgress(selectedTask.id, 100);
        }}
        onDelete={() => {
          if (selectedTask && window.confirm("Are you sure you want to delete this task?")) {
            deleteTask(selectedTask.id);
            setIsDetailsOpen(false);
            setSelectedTaskId(null);
          }
        }}
      />
    </div>
  );
}
