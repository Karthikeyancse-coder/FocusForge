import { motion } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useUser } from "../context/UserContext";
import { calculateWorkPatternInsight } from "../lib/engine";

import { ModelViewer } from "../components/ModelViewer";
import { Radar } from "lucide-react";

export default function Character() {
  const { userState, tasks } = useUser();
  const currentXP = userState.xp;
  const nextLevelXP = userState.level * 200 + 200;
  const baseLevelXP = userState.level * 200;
  const progress = Math.min(100, Math.max(0, ((currentXP - baseLevelXP) / (nextLevelXP - baseLevelXP)) * 100));

  const completedTasks = tasks.filter(t => t.realityState?.completedAt);
  const patternInsight = calculateWorkPatternInsight(completedTasks);

  let eligibleTasksCount = 0;
  let totalRemainingPercentage = 0;

  completedTasks.forEach(task => {
    if (task.realityState?.focusSessions && task.realityState.focusSessions.length > 0 && task.createdAt && task.deadline) {
      const createdAt = new Date(task.createdAt).getTime();
      const deadline = new Date(task.deadline).getTime();
      
      const firstSessionAt = Math.min(...task.realityState.focusSessions.map(s => new Date(s.date).getTime()));
      
      const windowLength = deadline - createdAt;
      
      if (windowLength > 0) {
        let timeRemaining = deadline - firstSessionAt;
        
        // Clamp the time remaining to be between 0 and windowLength
        if (timeRemaining > windowLength) timeRemaining = windowLength;
        if (timeRemaining < 0) timeRemaining = 0;

        const remainingPercentage = (timeRemaining / windowLength) * 100;
        totalRemainingPercentage += remainingPercentage;
        eligibleTasksCount++;
      }
    }
  });

  const averageRemainingPercentage = eligibleTasksCount > 0 ? Math.round(totalRemainingPercentage / eligibleTasksCount) : 0;

  return (
    <div className="p-8 pt-16 md:pt-20 space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Character Profile</h1>
          <p className="text-[var(--text-muted)] mt-1">Your productivity, embodied.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Character View */}
        <Card className="lg:col-span-2 min-h-[600px] border-[var(--accent-primary)]/20 shadow-[0_0_25px_rgba(31,164,99,0.05)] relative overflow-hidden bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <CardContent className="h-full flex flex-col justify-between p-8 relative z-10">
            <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-4xl font-black font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)]">
                    {userState.characterClass}
                  </h2>
                  <p className="text-lg font-mono text-[var(--text-secondary)] mt-2">Level {userState.level} - Apprentice</p>
               </div>
               <Badge variant="outline" className="text-sm px-3 py-1 bg-[var(--bg-elevated)] backdrop-blur-md">
                 Stage {Math.floor(userState.level / 5) || 1} Evolution
               </Badge>
            </div>

            {/* 3D placeholder */}
            <div className="flex-1 flex items-center justify-center relative my-8">
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 className="relative z-10 w-full max-w-sm"
               >
                 <ModelViewer modelPath="/models/goku_ssj.glb" className="w-full h-full" />
               </motion.div>
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                 className="absolute bottom-5 w-48 h-8 bg-black/40 rounded-[100%] blur-xl -z-10"
               />
            </div>

            <div className="glass p-6 rounded-2xl w-full max-w-xl mx-auto backdrop-blur-xl">
               <div className="flex justify-between font-mono text-sm mb-3">
                 <span className="font-bold text-[var(--accent-primary)]">XP {currentXP}</span>
                 <span className="text-[var(--text-muted)]">Next: {nextLevelXP}</span>
               </div>
               <div className="h-4 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className="h-full bg-[var(--accent-primary)] shadow-[0_0_15px_var(--xp-glow)] rounded-full"
                 />
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Achievements */}
        <div className="space-y-6">
          <Card>
             <CardContent className="p-6">
                <h3 className="font-semibold text-lg border-b border-[var(--border-subtle)] pb-3 mb-4">Combat Stats</h3>
                <div className="space-y-4">
                   <StatRow label="Focus Target Reached" value={`${userState.focusMinutesToday || 0}m`} icon="🧠" />
                   <StatRow label="Tasks Completed" value={(userState.tasksCompletedToday || 0).toString()} icon="⚡" />
                   <StatRow label="Endurance (Streak)" value={userState.streakCount.toString()} icon="🔥" />
                </div>
             </CardContent>
          </Card>

          <Card>
             <CardContent className="p-6">
                <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3 mb-4">
                  <Radar size={18} className="text-[var(--accent-primary)]" />
                  <h3 className="font-semibold text-lg">Pattern Insight</h3>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className={`text-xs px-2 py-1 ${
                    patternInsight.label === 'Last-Stretch Staller' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                    patternInsight.label === 'Slow Starter' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                    patternInsight.label === 'Steady Worker' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                    'bg-[var(--bg-elevated)]'
                  }`}>
                    {patternInsight.label}
                  </Badge>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {patternInsight.description}
                  </p>
                  
                  <div className="pt-3 border-t border-[var(--border-subtle)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Pace Profile</h4>
                    {eligibleTasksCount < 3 ? (
                      <p className="text-xs text-[var(--text-secondary)] italic">
                        Not enough data yet — complete a few more tasks to see your pace profile.
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--text-primary)]">
                        You tend to perform best starting with about <span className="font-bold text-[var(--accent-primary)]">{averageRemainingPercentage}%</span> of your deadline window remaining.
                      </p>
                    )}
                  </div>
                </div>
             </CardContent>
          </Card>

          <Card>
             <CardContent className="p-6">
                <h3 className="font-semibold text-lg border-b border-[var(--border-subtle)] pb-3 mb-4">Recent Achievements</h3>
                <div className="space-y-4">
                  <Achievement icon="🎯" title="First Blood" desc="Completed a high-risk task." />
                  <Achievement icon="🧘" title="Deep Mind" desc="Focused for 90 mins straight." />
                  <Achievement icon="🛡️" title="Unbreakable" desc="Maintained a 7-day streak." />
                </div>
             </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

function StatRow({ label, value, icon }: { label: string, value: string, icon: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-mono font-bold text-[var(--accent-primary)]">{value}</span>
    </div>
  )
}

function Achievement({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-lg shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  )
}
