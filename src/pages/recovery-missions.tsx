import React, { useState, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { calculateTaskMetrics } from '../lib/engine';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useSearchParams } from 'react-router-dom';
import { Bot, Crosshair, Sparkles, Check, ChevronRight, Copy, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function RecoveryMissions() {
  const { tasks: personalTasks, userState, acceptRecoveryPlan, updateTask, deleteTask, updateUserState, addActivity } = useUser();
  const { workspaceTasks, updateWorkspaceTask, deleteWorkspaceTask, addWorkspaceActivity } = useWorkspace();
  
  const evaluatedWorkspaceTasks = useMemo(() => {
     return workspaceTasks.map(t => calculateTaskMetrics(t, userState, workspaceTasks));
  }, [workspaceTasks, userState]);
  
  const allTasks = [...personalTasks, ...evaluatedWorkspaceTasks];
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTaskId = searchParams.get('taskId');
  
  const tasksNeedingRecovery = allTasks.filter(t => t.riskEngine.riskTier !== 'Green' && !t.realityState.completedAt);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || "");
  const [showScopeEditor, setShowScopeEditor] = useState(false);
  const [newEffort, setNewEffort] = useState(1);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureToast, setFailureToast] = useState<{title: string, xp: number} | null>(null);

  React.useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
    } else if (!selectedTaskId && tasksNeedingRecovery.length > 0) {
      setSelectedTaskId(tasksNeedingRecovery[0].id);
    }
  }, [initialTaskId, tasksNeedingRecovery, selectedTaskId]);

  const selectedTask = allTasks.find(t => t.id === selectedTaskId) || tasksNeedingRecovery[0];

  React.useEffect(() => {
    if (selectedTask) {
       setNewEffort(selectedTask.estimatedEffortHours);
       setShowScopeEditor(false);
    }
  }, [selectedTask?.id]);

  const [loadingRecovery, setLoadingRecovery] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState<any>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const loadingPhrases = ["Calculating Vector...", "Simulating Timelines...", "Synthesizing Protocol..."];

  React.useEffect(() => {
     let interval: any;
     if (loadingRecovery) {
        interval = setInterval(() => {
           setLoadingIndex(prev => (prev + 1) % loadingPhrases.length);
        }, 1500);
     } else {
        setLoadingIndex(0);
     }
     return () => clearInterval(interval);
  }, [loadingRecovery]);

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
       // Standard working hours 9 AM to 9 PM
       if (h >= 9 && h < 21) {
          const isBusy = userState.busyBlocks.some(b => {
             const start = new Date(b.start);
             const end = new Date(b.end);
             return curr >= start && curr < end;
          });
          
          let isOtherAtRisk = false;
          if (!isBusy) {
             isOtherAtRisk = allTasks.some(t => {
                if (t.id === taskToRecover.id) return false;
                if ((t.riskEngine.riskTier === 'Yellow' || t.riskEngine.riskTier === 'Red') && t.recoveryPlan?.status === 'accepted') {
                   return t.recoveryPlan.proposedSchedule?.some((s: any) => {
                      let sStart: Date, sEnd: Date;
                      if (s.date && s.start) {
                         sStart = new Date(`${s.date}T${s.start}:00`);
                         sEnd = new Date(`${s.date}T${s.end}:00`);
                      } else {
                         sStart = new Date(s.start);
                         sEnd = new Date(s.end);
                      }
                      return curr >= sStart && curr < sEnd;
                   });
                }
                return false;
             });
          }
          
          if (!isBusy && !isOtherAtRisk) {
             availableSlots++;
          }
       }
       curr.setHours(curr.getHours() + 1);
    }
    
    return availableSlots;
  };

  const generateRecoveryPlan = async (task: any) => {
    setLoadingRecovery(true);
    setRecoveryPlan(null);
    const startLoading = Date.now();
    try {
       const availableTimeHours = computeAvailableTimeHours(task);
       const forceInfeasiblePath = availableTimeHours <= 0 || task.estimatedEffortHours > availableTimeHours;
       
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
       let data = await res.json();
       
       if (forceInfeasiblePath) {
          data = { ...data, infeasible: true };
       }

       if (data.infeasible) {
          data.remainingCapacity = availableTimeHours;
          data.requiredEffort = task.estimatedEffortHours;
          const draftRes = await fetch("/api/gemini/extension-draft", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                taskTitle: task.title,
                category: task.category,
                timeDeficitHours: Math.max(0, task.estimatedEffortHours - availableTimeHours),
                realityGapSummary: "Insufficient time remaining to complete the task before the deadline given other commitments."
             })
          });
          const draftData = await draftRes.json();
          data.extensionDraft = draftData.draft;
       }
       
       const elapsed = Date.now() - startLoading;
       if (elapsed < 1000) {
           await new Promise(r => setTimeout(r, 1000 - elapsed));
       }
       
       setRecoveryPlan(data);
    } catch (e) {
       console.error("Failed to generate plan");
       // Fallback logic inside server usually handles this, but just in case:
       const elapsed = Date.now() - startLoading;
       if (elapsed < 1000) {
           await new Promise(r => setTimeout(r, 1000 - elapsed));
       }
       setRecoveryPlan({
          schedule: [
             { date: new Date().toISOString().split('T')[0], start: "18:00", end: "22:00" },
             { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], start: "10:00", end: "14:00" }
          ],
          reasoning: "We've front-loaded your schedule to maximize your remaining capacity before the deadline."
       });
    } finally {
       setLoadingRecovery(false);
    }
  };

  const handleAcceptPlan = () => {
      if (!recoveryPlan || !selectedTask) return;
      
      const normalizedSchedule = recoveryPlan.schedule?.map((s: any) => {
          if (s.date && s.start && s.end) {
              return {
                  start: new Date(`${s.date}T${s.start}:00`).toISOString(),
                  end: new Date(`${s.date}T${s.end}:00`).toISOString()
              };
          }
          return s; 
      }) || [];
      
      acceptRecoveryPlan(selectedTask.id, { schedule: normalizedSchedule });
      setRecoveryPlan(null); // Reset view
  };

  const handleSaveEffort = () => {
     if (selectedTask && newEffort > 0) {
        if (selectedTask.workspaceId) {
           updateWorkspaceTask(selectedTask.id, { estimatedEffortHours: newEffort });
        } else {
           updateTask(selectedTask.id, { estimatedEffortHours: newEffort });
        }
        setShowScopeEditor(false);
     }
  };

  const handleGetHelp = () => {
     if (selectedTask) {
        if (selectedTask.workspaceId) {
           updateWorkspaceTask(selectedTask.id, { flaggedForHelp: true });
        } else {
           updateTask(selectedTask.id, { flaggedForHelp: true });
        }
     }
  };

  const handleAcceptFailure = () => {
     if (!selectedTask) return;
     const isWorkspaceTask = !!selectedTask.workspaceId;
     
     let xpPenalty = 50;
     if (selectedTask.priority === 'Critical') xpPenalty = 100;
     else if (selectedTask.priority === 'High') xpPenalty = 75;
     else if (selectedTask.priority === 'Medium') xpPenalty = 50;
     else if (selectedTask.priority === 'Low') xpPenalty = 25;
     
     let newXp = Math.max(0, userState.xp - xpPenalty);
     let newLevel = userState.level;
     
     while (newLevel > 1 && newXp < (newLevel - 1) * 200 + 200) {
        newLevel -= 1;
     }
     
     updateUserState({ xp: newXp, level: newLevel });
     
     if (isWorkspaceTask && addWorkspaceActivity) {
         addWorkspaceActivity("Mission Failed", `Mission Failed: "${selectedTask.title}"`, "delete", selectedTask.id);
     } else {
         addActivity("Mission Failed", `Mission Failed: "${selectedTask.title}"`, "delete", selectedTask.id);
     }
     
     if (isWorkspaceTask) {
         deleteWorkspaceTask(selectedTask.id);
     } else {
         deleteTask(selectedTask.id);
     }
     
     setShowFailureModal(false);
     setFailureToast({ title: selectedTask.title, xp: xpPenalty });
     
     setTimeout(() => {
         setFailureToast(null);
     }, 4000);
  };

  return (
    <div className="px-4 py-5 md:p-8 pt-16 md:pt-20 space-y-5 md:space-y-6 max-w-5xl mx-auto pb-[140px] md:pb-24 overflow-x-hidden no-scrollbar w-full box-border">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-0">
        <div>
          <h1 className="text-[28px] md:text-3xl font-display font-bold text-[var(--text-primary)] leading-tight">Recovery Missions</h1>
          <p className="text-[14px] md:text-sm text-[var(--text-secondary)] mt-1.5 md:mt-1">Generate actionable strategies for at-risk objectives.</p>
        </div>
        <div className="w-full md:w-64">
           <select 
              value={selectedTask?.id || ""}
              onChange={(e) => { setSelectedTaskId(e.target.value); setSearchParams({ taskId: e.target.value }); setRecoveryPlan(null); }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] font-semibold"
           >
              {tasksNeedingRecovery.map(t => (
                 <option key={t.id} value={t.id}>{t.title} ({t.riskEngine.riskTier})</option>
              ))}
           </select>
        </div>
      </div>

      {!selectedTask ? (
         <Card className="bg-[var(--bg-primary)] border-[var(--border-subtle)] flex flex-col items-center justify-center py-12 md:py-20 px-6 text-center overflow-hidden relative rounded-[20px] md:rounded-xl">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-72 h-64 md:h-72 bg-[var(--accent-primary)]/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center">
               <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 md:mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <Check className="text-emerald-500 w-6 h-6 md:w-7 md:h-7" />
               </div>
               
               <h2 className="text-[22px] md:text-xl font-display font-bold text-[var(--text-primary)] uppercase tracking-wide">
                  Zone Secure
               </h2>
               <p className="text-[14px] md:text-sm text-[var(--text-secondary)] mt-2 max-w-sm">
                  All active operations are in green status. No active objectives currently require crisis intervention protocols.
               </p>
               
               <div className="mt-6 md:mt-8 flex gap-2 md:gap-3 text-[11px] md:text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-4 py-2 rounded-xl border border-[var(--border-subtle)] items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block flex-shrink-0" />
                  <span>CRISIS INTERVENTION CORE: ACTIVE</span>
               </div>
            </div>
         </Card>
      ) : (
         <div className="flex flex-col gap-6 md:gap-8">
            <Card className="bg-[var(--bg-primary)] border-[var(--border-subtle)] h-fit rounded-[20px] md:rounded-xl">
               <CardContent className="p-[18px] md:p-8">
                  <div className="flex items-center gap-3 mb-5 md:mb-6">
                     <Crosshair className="text-[var(--accent-primary)] w-5 h-5 md:w-6 md:h-6" />
                     <h2 className="text-[22px] md:text-xl font-bold text-[var(--text-primary)]">Target Objective</h2>
                  </div>
                  
                  <div className="space-y-5 md:space-y-6">
                     <div>
                        <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Mission</p>
                        <p className="text-[20px] md:text-lg font-bold text-[var(--text-primary)] leading-tight">{selectedTask.title}</p>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-[var(--bg-secondary)] p-3 md:p-4 rounded-[14px] md:rounded-xl h-[88px] md:h-auto flex flex-col justify-center">
                           <p className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Comp. Prob.</p>
                           <p className="text-[24px] md:text-xl font-mono font-bold text-[var(--text-primary)]">{Math.round(selectedTask.riskEngine.completionProbability * 100)}%</p>
                        </div>
                        <div className="bg-[var(--bg-secondary)] p-3 md:p-4 rounded-[14px] md:rounded-xl h-[88px] md:h-auto flex flex-col justify-center">
                           <p className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Req. Effort</p>
                           <p className="text-[24px] md:text-xl font-mono font-bold text-[var(--text-primary)]">{selectedTask.estimatedEffortHours}h</p>
                        </div>
                        <div className="bg-[var(--bg-secondary)] p-3 md:p-4 rounded-[14px] md:rounded-xl col-span-2 md:col-span-1 h-[88px] md:h-auto flex flex-col justify-center">
                           <p className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Available</p>
                           <p className={`text-[24px] md:text-xl font-mono font-bold ${computeAvailableTimeHours(selectedTask) < selectedTask.estimatedEffortHours ? 'text-red-500' : 'text-[var(--accent-primary)]'}`}>{computeAvailableTimeHours(selectedTask)}h</p>
                        </div>
                     </div>

                     {selectedTask.recoveryPlan?.status === 'accepted' ? (
                        <div className="w-full h-14 bg-green-500/10 border border-green-500/30 text-green-500 text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-md">
                           <Check size={18} /> Plan Accepted & Initialized
                        </div>
                     ) : (
                        <div className="flex flex-col gap-3">
                           <Button 
                              onClick={() => generateRecoveryPlan(selectedTask)}
                              disabled={loadingRecovery}
                              className="w-full h-[54px] md:h-14 bg-[var(--text-primary)] text-black hover:bg-white text-[15px] md:text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl rounded-[14px] md:rounded-md"
                           >
                              {loadingRecovery ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Bot size={20} className="md:w-[18px] md:h-[18px]" />}
                              {loadingRecovery ? loadingPhrases[loadingIndex] : "Generate Recovery Strategy"}
                           </Button>
                           
                           {!recoveryPlan?.infeasible && selectedTask.riskEngine.riskTier === 'Red' && (
                              <div className="flex items-center gap-3 w-full">
                                 <Button 
                                    variant="outline"
                                    className="flex-1 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[11px] uppercase tracking-widest font-bold h-[54px] md:h-10 hover:border-amber-500/50 hover:text-amber-500 transition-colors rounded-[14px] md:rounded-md"
                                    onClick={() => setShowScopeEditor(!showScopeEditor)}
                                 >
                                    Reduce Scope
                                 </Button>
                                 {selectedTask.workspaceId && (
                                    <Button 
                                       variant="outline"
                                       className="flex-1 bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[11px] uppercase tracking-widest font-bold h-[54px] md:h-10 hover:border-blue-500/50 hover:text-blue-500 transition-colors rounded-[14px] md:rounded-md"
                                       onClick={() => handleGetHelp()}
                                    >
                                       Get Help
                                    </Button>
                                 )}
                              </div>
                           )}

                           {!recoveryPlan?.infeasible && showScopeEditor && (
                              <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 mt-2">
                                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">New Estimated Effort (Hours)</label>
                                 <div className="flex items-center gap-2">
                                    <input
                                       type="number"
                                       min={1}
                                       value={newEffort}
                                       onChange={(e) => setNewEffort(Number(e.target.value))}
                                       className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                                    />
                                    <Button 
                                       onClick={handleSaveEffort}
                                       className="bg-[var(--accent-primary)] text-black text-xs font-bold px-4 py-2 hover:scale-105 transition-transform"
                                    >
                                       Save
                                    </Button>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>

            <div className="space-y-5 md:space-y-6">
               {recoveryPlan ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                     <Card className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] overflow-hidden relative rounded-[20px] md:rounded-xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-primary)]" />
                        <CardContent className="p-[18px] md:p-8">
                           <h3 className="font-display font-bold text-[22px] md:text-xl text-[var(--accent-primary)] mb-5 md:mb-6 flex items-center gap-2">
                              <Sparkles size={20} className="w-5 h-5 md:w-5 md:h-5" /> AI Recovery Strategy
                           </h3>
                           
                           {recoveryPlan.infeasible ? (
                              <div className="space-y-5 md:space-y-6">
                                 <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                                    <p className="text-red-500 font-medium text-[14px] md:text-sm leading-relaxed">
                                       The required effort exceeds your remaining focus capacity. This deadline is computationally infeasible without massive burnout.
                                    </p>
                                 </div>

                                 <div className="space-y-4">
                                     <h4 className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Select a Recovery Protocol:</h4>
                                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                                        <div className="bg-[var(--bg-primary)] p-[18px] md:p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col h-full">
                                           <h4 className="text-[15px] md:text-sm font-bold text-[var(--text-primary)] mb-2">1. Reduce Scope</h4>
                                           <p className="text-[14px] md:text-xs text-[var(--text-secondary)] mb-4 flex-1">Renegotiate deliverables to fit within your remaining capacity.</p>
                                           {showScopeEditor ? (
                                                <div className="mt-auto">
                                                    <input
                                                       type="number"
                                                       min={1}
                                                       value={newEffort}
                                                       onChange={(e) => setNewEffort(Number(e.target.value))}
                                                       className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-[10px] md:py-2 text-[15px] md:text-sm focus:outline-none mb-3 md:mb-2 text-[var(--text-primary)]"
                                                       placeholder="Effort (hrs)"
                                                    />
                                                    <Button onClick={handleSaveEffort} className="w-full h-[46px] md:h-auto bg-amber-500 text-black text-[14px] md:text-xs font-bold py-2 hover:bg-amber-400">Save</Button>
                                                </div>
                                           ) : (
                                                <Button variant="outline" onClick={() => setShowScopeEditor(true)} className="w-full h-[46px] md:h-auto text-[14px] md:text-xs mt-auto border-[var(--border-subtle)] text-[var(--text-primary)]">Edit Scope</Button>
                                           )}
                                        </div>

                                        <div className="bg-[var(--bg-primary)] p-[18px] md:p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col h-full">
                                           <h4 className="text-[15px] md:text-sm font-bold text-[var(--text-primary)] mb-2">2. Request Extension</h4>
                                           <p className="text-[14px] md:text-xs text-[var(--text-secondary)] mb-4 flex-1">Use the AI draft below to request more time.</p>
                                           <Button variant="outline" onClick={() => {
                                               navigator.clipboard.writeText(recoveryPlan.extensionDraft);
                                               alert("Draft copied to clipboard!");
                                           }} className="w-full h-[46px] md:h-auto text-[14px] md:text-xs mt-auto border-[var(--border-subtle)] text-[var(--text-primary)]">Copy Draft</Button>
                                        </div>

                                        <div className="bg-[var(--bg-primary)] p-[18px] md:p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col h-full">
                                           <h4 className="text-[15px] md:text-sm font-bold text-[var(--text-primary)] mb-2">3. Accept and Learn</h4>
                                           <p className="text-[14px] md:text-xs text-[var(--text-secondary)] mb-4 flex-1">Acknowledge the late completion. A post-mortem will trigger automatically.</p>
                                           <Button variant="outline" onClick={() => setShowFailureModal(true)} className="w-full h-[46px] md:h-auto text-[14px] md:text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 mt-auto">Accept Failure</Button>
                                        </div>
                                     </div>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="bg-[var(--bg-primary)] p-[18px] md:p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col h-full">
                                       <p className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 md:mb-2">Extension Draft Template</p>
                                       <textarea 
                                          readOnly
                                          className="w-full flex-1 bg-transparent text-[14px] md:text-sm font-mono text-[var(--text-secondary)] leading-relaxed h-[150px] md:h-32 focus:outline-none resize-none no-scrollbar"
                                          value={recoveryPlan.extensionDraft}
                                       />
                                       <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                                           <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(recoveryPlan.extensionDraft)} className="h-[46px] md:h-9">
                                               <Copy size={16} className="mr-2 md:w-[14px] md:h-[14px]"/> <span className="text-[14px] md:text-xs">Copy to Clipboard</span>
                                           </Button>
                                       </div>
                                    </div>
                                    
                                    <div className="bg-[var(--bg-primary)] p-[18px] md:p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col h-full">
                                      <p className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 md:mb-2 border-b border-[var(--border-subtle)] pb-2">Or, push through now</p>
                                      <div className="flex-1 flex flex-col justify-center gap-4 py-4">
                                        <p className="text-[14px] md:text-sm text-[var(--text-primary)] leading-relaxed">
                                          You'd need <span className="font-bold text-red-400">{recoveryPlan.requiredEffort} hours</span> today and tomorrow combined to still finish on time — tight, but possible.
                                        </p>
                                        <div className="bg-[var(--bg-secondary)] p-4 md:p-3 rounded-lg border border-[var(--border-subtle)]">
                                          <p className="text-[14px] md:text-xs text-[var(--text-secondary)] flex justify-between items-center mb-2 md:mb-1">
                                            <span>Required Effort:</span>
                                            <span className="font-mono text-red-400 font-bold">{recoveryPlan.requiredEffort}h</span>
                                          </p>
                                          <p className="text-[14px] md:text-xs text-[var(--text-secondary)] flex justify-between items-center">
                                            <span>Remaining Capacity:</span>
                                            <span className="font-mono text-[var(--text-primary)] font-bold">{recoveryPlan.remainingCapacity}h</span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="space-y-5 md:space-y-6">
                                 {recoveryPlan.reasoning && (
                                     <p className="text-[var(--text-primary)] text-[14px] md:text-sm leading-relaxed">
                                        {recoveryPlan.reasoning}
                                     </p>
                                 )}
                                 <div className="space-y-3">
                                    <p className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Action Protocol (Proposed Schedule)</p>
                                    {recoveryPlan.schedule?.map((step: any, i: number) => (
                                       <div key={i} className="flex items-start gap-3 bg-[var(--bg-primary)] p-4 md:p-3 rounded-lg border border-[var(--border-subtle)]">
                                          <div className="mt-0.5"><ChevronRight size={16} className="text-[var(--accent-primary)] md:w-[14px] md:h-[14px]" /></div>
                                          <p className="text-[14px] md:text-sm text-[var(--text-secondary)] leading-relaxed">
                                              <span className="font-mono md:text-xs mr-2 text-[var(--text-primary)]">{step.date}</span>
                                              <span className="font-mono md:text-xs text-[var(--text-muted)]">{step.start} - {step.end}</span>
                                          </p>
                                       </div>
                                    ))}
                                 </div>
                                 
                                 <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                                     <p className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Projected New Completion Prob.</p>
                                     <p className="text-[28px] md:text-2xl font-mono font-bold text-[var(--accent-primary)]">
                                         {Math.min(99, Math.round(selectedTask.riskEngine.completionProbability * 100) + 35)}%
                                     </p>
                                 </div>

                                 <Button 
                                     onClick={handleAcceptPlan}
                                     className="w-full bg-[var(--accent-primary)] text-black font-black uppercase tracking-widest text-[13px] md:text-[11px] h-[54px] md:h-12 shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:scale-[1.02] rounded-[14px] md:rounded-md"
                                 >
                                    <Check size={20} className="mr-2 md:w-4 md:h-4" /> Accept & Initialize Plan
                                 </Button>
                              </div>
                           )}
                        </CardContent>
                     </Card>
                  </motion.div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-12 border-2 border-dashed border-[var(--border-subtle)] rounded-xl">
                     <Bot size={48} className="mb-4 text-[var(--text-muted)]" />
                     <p className="text-sm font-medium text-[var(--text-secondary)]">Awaiting strategy generation...</p>
                  </div>
               )}
            </div>
         </div>
      )}

      {showFailureModal && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-[var(--bg-primary)] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
                 <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Accept Mission Failure?</h2>
                 <p className="text-[15px] text-[var(--text-secondary)] mb-4 leading-relaxed">
                    This mission will be permanently abandoned.
                 </p>
                 <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg p-4 mb-6 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Consequences:</p>
                    <p className="text-sm text-[var(--text-primary)] flex items-center gap-2"><span className="text-red-400">•</span> Mission will be deleted.</p>
                    <p className="text-sm text-[var(--text-primary)] flex items-center gap-2"><span className="text-red-400">•</span> You will lose XP.</p>
                    <p className="text-sm text-[var(--text-primary)] flex items-center gap-2"><span className="text-red-400">•</span> This action cannot be undone.</p>
                 </div>
                 <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 border-[var(--border-subtle)] text-[var(--text-primary)]" onClick={() => setShowFailureModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20" onClick={handleAcceptFailure}>Accept Failure</Button>
                 </div>
             </div>
         </div>
      )}

      {failureToast && (
         <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[var(--bg-primary)] border border-red-500/30 rounded-xl p-4 shadow-xl backdrop-blur-md min-w-[300px] flex gap-3 animate-in fade-in slide-in-from-bottom-4">
             <div className="w-1 h-full bg-red-500 rounded-full absolute left-0 top-0" />
             <div className="ml-2">
                 <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Mission Abandoned</p>
                 <p className="text-[13px] text-[var(--text-secondary)]">You accepted failure for <span className="text-[var(--text-primary)]">"{failureToast.title}"</span></p>
                 <p className="text-[13px] font-mono text-red-400 font-bold mt-2">XP Lost: -{failureToast.xp} XP</p>
             </div>
         </div>
      )}
    </div>
  );
}
