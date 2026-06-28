import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wand2, Clock, Cpu, ChevronRight, Sparkles, ChevronDown, ShieldAlert, Target, Activity, Settings2, Trash2, Plus, Zap, Calendar as CalendarIcon
} from "lucide-react";
import { Task } from "../types";
import { cn } from "../lib/utils";
import { useUser } from "../context/UserContext";

interface CreateTaskWizardProps {
  onClose: () => void;
  onCreate: (task: Partial<Task>) => void;
}

const TASK_TYPES = ['One-Time Task', 'Daily Habit', 'Weekly Task', 'Custom Schedule'] as const;
type TaskType = typeof TASK_TYPES[number];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Legendary'] as const;
type Difficulty = typeof DIFFICULTIES[number];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateTaskWizard({ onClose, onCreate }: CreateTaskWizardProps) {
  const { userState } = useUser();
  // Core Fields
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<TaskType>('One-Time Task');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  
  // Type-specific fields
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [effortHours, setEffortHours] = useState<number>(2);
  
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(30);
  
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState("");
  
  const [repeatRules, setRepeatRules] = useState("");

  // Advanced Fields
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [focusCategory, setFocusCategory] = useState("Academic");

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    probability: number;
    riskLevel: 'Safe' | 'Warning' | 'Critical';
    category: string;
    importance: 'Low' | 'Medium' | 'High' | 'Critical';
    failureImpact: 'Low' | 'Medium' | 'High' | 'Critical';
    focusType: string;
    subtasks: {id: string, title: string, completed: boolean}[];
    suggestedBlocks?: { stepName: string; duration: number; date: string; time: string }[];
  } | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [liveRiskScore, setLiveRiskScore] = useState<number | null>(null);
  const [liveRiskBreakdown, setLiveRiskBreakdown] = useState<string | null>(null);
  const [hasHistory, setHasHistory] = useState<boolean>(true);

  useEffect(() => {
    if (taskType !== 'One-Time Task' || !deadlineDate || !effortHours || !focusCategory) {
      setLiveRiskScore(null);
      setLiveRiskBreakdown(null);
      return;
    }

    const baseLag = userState.historicalLagByCategory[focusCategory];
    if (baseLag === undefined || baseLag === null) {
      setHasHistory(false);
      setLiveRiskScore(null);
      setLiveRiskBreakdown(null);
      return;
    }
    
    setHasHistory(true);

    const now = new Date();
    const d = new Date(`${deadlineDate}T23:59:59`);
    const totalHoursRemaining = Math.max(0, (d.getTime() - now.getTime()) / (1000 * 60 * 60));
    const daysRemaining = totalHoursRemaining / 24;
    
    const baselineCapacityHours = daysRemaining * 8; // Assumes 8 focus hours a day max
    let completionProbability = 1;
    if (effortHours > 0) {
      completionProbability = Math.min(1, baselineCapacityHours / effortHours);
    }

    let urgencyPressure = 100 - (completionProbability * 100);
    urgencyPressure = Math.max(0, Math.min(100, urgencyPressure));

    const riskScore = Math.min(100, Math.max(0, Math.round(((0.25 * urgencyPressure) + (0.2 * baseLag)) / 0.45)));
    setLiveRiskScore(riskScore);

    const reasons: string[] = [];
    if (effortHours > 4) {
      reasons.push(`it's a large task (${effortHours}h)`);
    }
    if (urgencyPressure > 50) {
      reasons.push(`the deadline is tight relative to effort`);
    }
    if (baseLag > 15) {
      reasons.push(`you typically run ${Math.round(baseLag)}% over estimate on ${focusCategory} work`);
    }

    if (reasons.length > 0) {
      if (reasons.length === 1) {
        setLiveRiskBreakdown(`Flagged risky because: ${reasons[0]}.`);
      } else if (reasons.length === 2) {
        setLiveRiskBreakdown(`Flagged risky because: ${reasons[0]} and ${reasons[1]}.`);
      } else {
        setLiveRiskBreakdown(`Flagged risky because: ${reasons.slice(0, -1).join(', ')}, and ${reasons[reasons.length - 1]}.`);
      }
    } else {
      setLiveRiskBreakdown("Task seems well-scoped and achievable based on your history.");
    }
  }, [taskType, focusCategory, deadlineDate, effortHours, userState.historicalLagByCategory]);

  const handleAnalyze = async () => {
    if (!title) return;
    setIsAnalyzing(true);
    
    let daysToDeadline = 0;
    if (deadlineDate) {
       const diff = new Date(`${deadlineDate}T23:59:59`).getTime() - Date.now();
       daysToDeadline = diff / (1000 * 60 * 60 * 24);
    }
    
    // Check if meets threshold for AI planner
    if (taskType === 'One-Time Task' && effortHours >= 3 && daysToDeadline > 1) {
       try {
          const res = await fetch("/api/gemini/planner", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                title,
                estimatedEffortHours: effortHours,
                deadline: deadlineDate,
                currentDate: new Date().toISOString().split('T')[0],
                busyBlocks: userState.busyBlocks
             })
          });
          const data = await res.json();
          
          if (data.subtasks && data.subtasks.length > 0) {
             const subtasks = data.subtasks.map((st: any) => ({
                id: Math.random().toString(),
                title: st.stepName,
                completed: false
             }));
             const blocks = data.subtasks.map((st: any) => ({
                stepName: st.stepName,
                duration: st.estimatedDurationMinutes,
                date: st.suggestedStart.date,
                time: st.suggestedStart.time
             }));
             setAnalysisResult({
               probability: 85,
               riskLevel: 'Safe',
               category: focusCategory,
               importance: 'High',
               failureImpact: 'High',
               focusType: "Deep Work",
               subtasks,
               suggestedBlocks: blocks
             });
             setIsAnalyzing(false);
             return;
          }
       } catch (e) {
          console.error(e);
       }
    }
    
    setTimeout(() => {
      const probability = effortHours > 10 ? 65 : 92;
      const riskLevel = probability < 50 ? 'Critical' : probability < 75 ? 'Warning' : 'Safe';
      
      setAnalysisResult({
        probability,
        riskLevel,
        category: focusCategory,
        importance: effortHours > 5 ? 'High' : 'Medium',
        failureImpact: difficulty === 'Legendary' || difficulty === 'Hard' ? 'High' : 'Medium',
        focusType: "Deep Work",
        subtasks: [
          { id: Math.random().toString(), title: `Research & Setup`, completed: false },
          { id: Math.random().toString(), title: `Draft Core Logic`, completed: false },
          { id: Math.random().toString(), title: `Review & Submit`, completed: false },
        ]
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  const updateBlockTime = (index: number, field: 'date' | 'time', value: string) => {
     if (!analysisResult?.suggestedBlocks) return;
     const newBlocks = [...analysisResult.suggestedBlocks];
     newBlocks[index] = { ...newBlocks[index], [field]: value };
     setAnalysisResult({ ...analysisResult, suggestedBlocks: newBlocks });
  };

  const handleCreate = () => {
    let d = new Date();
    if (deadlineDate) {
        d = new Date(`${deadlineDate}T23:59:59`);
    } else {
        d.setHours(23, 59, 59, 999);
    }
    
    let plannedWorkBlocks: any[] = [];
    if (analysisResult?.suggestedBlocks) {
        plannedWorkBlocks = analysisResult.suggestedBlocks.map(b => {
           const start = new Date(`${b.date}T${b.time}:00`);
           const end = new Date(start.getTime() + b.duration * 60000);
           return { start: start.toISOString(), end: end.toISOString(), stepName: b.stepName, durationMinutes: b.duration };
        });
    }

    onCreate({
      title,
      category: focusCategory,
      deadline: d.toISOString(),
      estimatedEffortHours: effortHours,
      focusType: analysisResult?.focusType || "Deep Work",
      failureImpact: analysisResult?.failureImpact || "Medium",
      subtasks: analysisResult?.subtasks || [],
      
      taskType: taskType === 'One-Time Task' ? 'One-Time' : taskType,
      difficulty,
      expectedOutcome,
      ...(taskType === 'Daily Habit' ? { dailyGoalDurationMinutes: dailyGoalMinutes, habitStreak: 0 } : {}),
      ...(taskType === 'Weekly Task' ? { weeklyDays: selectedDays, weeklyGoal } : {}),
      ...(taskType === 'Custom Schedule' ? { customDays: selectedDays, repeatRules } : {}),

      importance: {
        aiSuggested: analysisResult?.importance || "Medium",
        userOverride: null,
        final: analysisResult?.importance || "Medium"
      },
      plannedState: {
        expectedProgressCurve: [],
        plannedWorkBlocks
      },
      realityState: {
        confirmedPercent: 0,
        inferredPercent: 0,
        effectivePercent: 0,
        lastConfirmedAt: null,
        focusSessions: [],
        completedAt: null,
        completedRetroactively: false
      }
    });
  };

  const toggleDay = (day: string) => {
      setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  // Calculate XP
  const xpMultipliers = { 'Easy': 1, 'Medium': 1.5, 'Hard': 2.5, 'Legendary': 5 };
  let baseXP = 100;
  if (taskType === 'One-Time Task') baseXP = effortHours * 50;
  else if (taskType === 'Daily Habit') baseXP = (dailyGoalMinutes / 60) * 50;
  
  const expectedXP = Math.floor(baseXP * xpMultipliers[difficulty]);

  return (
    <motion.div 
      id="create-quest-wizard-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl relative w-full max-w-xl md:max-w-xl mx-auto flex flex-col max-h-[92vh]"
    >
      {/* Top Gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-primary)] to-cyan-400"></div>

      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-lg font-black font-display tracking-tight text-[var(--accent-primary)]">
            Create Quest
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">
            Deploy a new mission. Compact and simple.
          </p>
        </div>
        <button id="close-quest-wizard-btn" onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors bg-[var(--bg-primary)] p-1.5 rounded-full border border-[var(--border-subtle)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.0} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        
        {/* Title Input */}
        <div>
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Quest Title *</label>
          <input 
            id="create-quest-title-input"
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Build Core Infrastructure" 
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-semibold placeholder:text-[var(--text-muted)]/40"
          />
        </div>

        {/* Task Type Selector */}
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block">Mission Type</label>
            <div className="flex flex-wrap gap-1.5">
               {TASK_TYPES.map(type => {
                  const typeId = `task-type-${type.toLowerCase().replace(/\s+/g, '-')}-btn`;
                  return (
                    <button 
                      id={typeId}
                      key={type}
                      onClick={() => setTaskType(type)}
                      className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                          taskType === type 
                            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/50 shadow-[0_0_12px_rgba(0,255,157,0.1)]" 
                            : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                       {type}
                    </button>
                  );
               })}
            </div>
        </div>

        {/* Dynamic Type Fields */}
        <div className="bg-[var(--bg-secondary)]/30 border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
           {taskType === 'One-Time Task' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Deadline *</label>
                    <input 
                      id="create-quest-deadline-input"
                      type="date" 
                      value={deadlineDate}
                      onChange={e => setDeadlineDate(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Est. Hours</label>
                    <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1 focus-within:border-[var(--accent-primary)] transition-all">
                      <input 
                        id="create-quest-effort-input"
                        type="number" 
                        min="1" max="100"
                        value={effortHours}
                        onChange={e => setEffortHours(Number(e.target.value))}
                        className="w-full bg-transparent border-none py-1 focus:outline-none font-bold text-sm"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] font-black">HRS</span>
                    </div>
                 </div>
              </div>
           )}

           {taskType === 'Daily Habit' && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                 <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Daily Goal Duration (Mins)</label>
                    <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1 w-full max-w-[160px] focus-within:border-[var(--accent-primary)] transition-all">
                       <input 
                          id="create-quest-daily-goal-input"
                          type="number" min="5" max="480" step="5"
                          value={dailyGoalMinutes}
                          onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                          className="w-full bg-transparent border-none py-1 focus:outline-none font-bold text-sm"
                       />
                       <span className="text-[10px] text-[var(--text-muted)] font-black">MINS</span>
                    </div>
                 </div>
                 <p className="text-[9px] uppercase font-bold text-[var(--accent-primary)] sm:mt-4 flex items-center gap-1">
                    <Sparkles size={10}/> Builds dynamic streak upon daily completion
                 </p>
              </div>
           )}

           {(taskType === 'Weekly Task' || taskType === 'Custom Schedule') && (
              <div className="space-y-3">
                 <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Active Days</label>
                    <div className="flex flex-wrap gap-1">
                       {DAYS.map(day => (
                          <button 
                            id={`active-day-${day.toLowerCase()}-btn`}
                            key={day}
                            onClick={() => toggleDay(day)}
                            className={cn(
                               "px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                               selectedDays.includes(day)
                                 ? "bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]"
                                 : "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            )}
                          >
                             {day}
                          </button>
                       ))}
                    </div>
                 </div>
                 
                 {taskType === 'Weekly Task' && (
                    <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Weekly Goal</label>
                        <input 
                           id="create-quest-weekly-goal-input"
                           type="text" 
                           value={weeklyGoal}
                           onChange={e => setWeeklyGoal(e.target.value)}
                           placeholder="e.g. Read 3 chapters" 
                           className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                        />
                    </div>
                 )}

                 {taskType === 'Custom Schedule' && (
                    <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Repeat Rules</label>
                        <input 
                           id="create-quest-repeat-rules-input"
                           type="text" 
                           value={repeatRules}
                           onChange={e => setRepeatRules(e.target.value)}
                           placeholder="e.g. Every 2 weeks on selected days" 
                           className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                        />
                    </div>
                 )}
              </div>
           )}
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block">Mission Difficulty</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
               {DIFFICULTIES.map(diff => {
                  let colors = "border-[var(--border-subtle)] hover:border-[var(--text-primary)] text-[var(--text-secondary)] bg-[var(--bg-secondary)]";
                  if (difficulty === diff) {
                     if (diff === 'Easy') colors = "border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]";
                     if (diff === 'Medium') colors = "border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
                     if (diff === 'Hard') colors = "border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]";
                     if (diff === 'Legendary') colors = "border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]";
                  }

                  return (
                     <button 
                        id={`difficulty-${diff.toLowerCase()}-btn`}
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={cn("px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all", colors)}
                     >
                        {diff}
                     </button>
                  );
               })}
            </div>
        </div>

        {/* AI Analyze Action */}
        {!analysisResult && taskType === 'One-Time Task' && (
           <button 
             id="create-quest-ai-strategy-btn"
             onClick={handleAnalyze}
             disabled={!title || !deadlineDate || isAnalyzing}
             className="w-full py-2.5 rounded-lg border border-emerald-500/30 bg-[var(--bg-secondary)] text-emerald-400 font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
           >
             {isAnalyzing ? (
               <><div className="animate-spin h-3.5 w-3.5 border-2 border-emerald-400 rounded-full border-t-transparent"></div> Processing Logistics...</>
             ) : (
               <><Wand2 size={13} /> Generate AI Strategy</>
             )}
           </button>
        )}

        {analysisResult?.suggestedBlocks && (
           <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                 <CalendarIcon size={14} className="text-[var(--accent-primary)]" /> Suggested Itinerary
              </h3>
              <div className="space-y-2">
                 {analysisResult.suggestedBlocks.map((block, idx) => (
                    <div key={idx} className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                       <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-[var(--text-primary)] truncate">{block.stepName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Est. Duration: {block.duration}m</p>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                          <input 
                             type="date" 
                             value={block.date} 
                             onChange={e => updateBlockTime(idx, 'date', e.target.value)}
                             className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs focus:border-[var(--accent-primary)] focus:outline-none"
                          />
                          <input 
                             type="time" 
                             value={block.time} 
                             onChange={e => updateBlockTime(idx, 'time', e.target.value)}
                             className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs focus:border-[var(--accent-primary)] focus:outline-none"
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* Advanced Options Toggle */}
        <div className="border-t border-[var(--border-subtle)] pt-3">
           <button 
             id="create-quest-advanced-toggle"
             onClick={() => setShowAdvanced(!showAdvanced)}
             className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors"
           >
             <Settings2 size={12} /> {showAdvanced ? 'Hide' : 'Show'} Advanced Options <ChevronDown size={12} className={cn("transition-transform", showAdvanced && "rotate-180")} />
           </button>
           
           <AnimatePresence>
              {showAdvanced && (
                 <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="pt-3 overflow-hidden">
                    <div className="space-y-3 bg-[var(--bg-secondary)]/50 p-4 rounded-xl border border-[var(--border-subtle)]">
                        <div>
                           <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Expected Outcome (Optional)</label>
                           <input id="advanced-expected-outcome" type="text" value={expectedOutcome} onChange={e => setExpectedOutcome(e.target.value)} placeholder="What does success look like?" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs font-medium focus:border-[var(--accent-primary)] focus:outline-none transition-colors" />
                        </div>
                        <div>
                           <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Mission Notes (Optional)</label>
                           <textarea id="advanced-mission-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional context or references..." className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs font-medium focus:border-[var(--accent-primary)] focus:outline-none transition-colors resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Focus Category</label>
                              <input id="advanced-focus-category" type="text" value={focusCategory} onChange={e => setFocusCategory(e.target.value)} placeholder="e.g. Academic, Fitness" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs font-medium focus:border-[var(--accent-primary)] focus:outline-none transition-colors" />
                           </div>
                        </div>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Live Risk Preview */}
        {taskType === 'One-Time Task' && deadlineDate && effortHours > 0 && focusCategory && (
          <div className="bg-[var(--bg-secondary)]/80 border border-[var(--border-subtle)] rounded-lg p-3 flex items-start gap-2.5">
            <ShieldAlert size={16} className={liveRiskScore !== null && liveRiskScore > 50 ? "text-red-400 mt-0.5 shrink-0" : "text-amber-400 mt-0.5 shrink-0"} />
            <div className="flex-1 min-w-0">
              {!hasHistory ? (
                <p className="text-[11px] text-[var(--text-secondary)]">
                  No history yet for this category — risk estimate unavailable until you complete a few <span className="font-bold text-[var(--text-primary)]">{focusCategory}</span> tasks.
                </p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    <span className="font-bold text-[var(--text-primary)]">Procrastination Risk: {liveRiskScore}%</span> — based on your pace history for <span className="font-bold text-[var(--text-primary)]">{focusCategory}</span> tasks.
                  </p>
                  {liveRiskBreakdown && (
                    <p className="text-[10px] text-[var(--text-muted)] italic leading-relaxed">
                      {liveRiskBreakdown}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex justify-between items-center z-10 relative">
         <div className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
           <div className="flex items-center justify-center p-1.5 bg-amber-500/20 text-amber-500 rounded-lg">
              <Zap size={14} className="fill-current" />
           </div>
           <div>
              <span className="text-amber-400 text-sm font-black">{expectedXP} XP</span>
              <span className="text-[var(--text-muted)] text-[9px] block font-bold tracking-widest mt-0.5">Potential Reward</span>
           </div>
         </div>
         <button 
           id="create-quest-deploy-btn"
           onClick={handleCreate}
           disabled={!title || (taskType === 'One-Time Task' && !deadlineDate)}
           className="px-6 py-2.5 bg-[var(--accent-primary)] text-black font-extrabold uppercase tracking-widest text-[11px] rounded-lg hover:bg-[var(--accent-primary)]/90 hover:scale-[1.02] active:scale-95 shadow-[0_4px_15px_rgba(0,255,157,0.2)] disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none flex items-center gap-1.5 transition-all"
         >
           Deploy Quest <ChevronRight size={14} />
         </button>
      </div>
    </motion.div>
  );
}


