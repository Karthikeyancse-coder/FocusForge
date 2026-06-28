import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { PublicThemeToggle } from "../components/PublicThemeToggle";
import { ArrowRight, Bot, Shield, Trophy, Zap, ChevronRight, CheckCircle2, CheckSquare, Swords, ShieldAlert, Activity, Crosshair, Users, BarChart2, Calendar, Target, Github, Check, X } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen w-full max-w-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-x-hidden selection:bg-[var(--accent-primary)] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-16 bg-[var(--bg-primary)]/80 backdrop-blur-md z-50 border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_15px_var(--xp-glow)] shrink-0">
              <span className="text-white font-bold font-display leading-none">F</span>
            </div>
            <span className="font-display font-bold text-base sm:text-lg tracking-tight shrink-0">FocusForge</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link to="/login" className="flex items-center shrink-0">
              <Button size="sm" className="rounded-full shadow-[0_0_15px_var(--xp-glow)] shrink-0">
                Start Forging
              </Button>
            </Link>
            <div className="w-px h-5 bg-[var(--border-subtle)] shrink-0"></div>
            <div className="flex items-center shrink-0">
              <PublicThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 px-6">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] text-sm font-semibold mb-6 border border-[var(--accent-primary)]/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
            </span>
            FocusForge AI 1.0 is live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] mb-6"
          >
            Your productivity becomes a <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[#34d399]">living story.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Students don't need another checklist. You need a system that actively prevents missed deadlines, optimizes focus, and visualizes personal growth through an evolving character.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/login">
              <Button size="lg" className="w-[309.792px] rounded-full font-bold text-[19px] px-8 h-12 shadow-[0_0_20px_var(--xp-glow)] gap-2">
                Enter the Forge <ArrowRight size={18} />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full text-base px-8 h-[47.9977px] border-[1.7037px] border-[var(--border-subtle)] group">
              View Gameplay <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
            </Button>
          </motion.div>
        </div>

        {/* Hero Visual Concept */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="max-w-6xl mx-auto mt-20 relative"
        >
          <div className="absolute inset-y-0 inset-x-12 sm:inset-x-24 md:inset-x-32 bg-gradient-to-b from-[var(--accent-primary)]/10 to-transparent blur-3xl -z-10 rounded-[100px]" />
          
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm p-4 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div className="md:col-span-1 space-y-6">
                <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
                  <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-sm text-[var(--text-secondary)] uppercase tracking-wider">
                    <Bot size={16} className="text-[var(--accent-primary)]" /> AI Coach
                  </h3>
                  <p className="text-sm">"Completing your DSA assignment today reduces deadline risk by 40%."</p>
                </div>
                <div className="p-6 rounded-xl border border-[var(--risk-high)]/30 bg-[var(--bg-primary)]/80 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <h3 className="font-display font-bold mb-2 flex items-center gap-2 text-sm text-[var(--risk-high)] uppercase tracking-wider">
                    👾 Boss Battle
                  </h3>
                  <p className="font-medium">Final Project Dragon</p>
                  <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-[var(--risk-high)] w-[30%]"></div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2 font-mono">HP: 1,200 / 5,000</p>
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 rounded-xl min-h-[300px] relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                 <div className="text-center relative z-10">
                   <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                     <div className="text-8xl drop-shadow-2xl mb-4">🗡️</div>
                   </motion.div>
                   <h2 className="font-display font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400">Cyber Samurai</h2>
                   <p className="font-mono text-sm text-[var(--text-muted)] mt-1">Level 14 - Apprentice</p>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Bot className="text-[var(--accent-primary)]" size={24} />}
            title="AI Risk Engine"
            desc="Our agent evaluates urgency and importance to identify high-risk deadlines before you miss them."
          />
          <FeatureCard 
            icon={<Trophy className="text-warning text-yellow-500" size={24} />}
            title="Character Evolution"
            desc="Every focus session and completed task levels up your companion. Your growth becomes visible."
          />
          <FeatureCard 
            icon={<Shield className="text-blue-500" size={24} />}
            title="Guilt-Free Streaks"
            desc="Earn Streak Shields every 7 days. If life happens, your streak is protected. Productivity without burnout."
          />
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mt-32 py-16 border-t border-[var(--border-subtle)]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">From Chaos to Legendary</h2>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">FocusForge AI transforms your standard academic workflow into an engaging RPG-style progression.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
             <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[var(--border-subtle)] via-[var(--accent-primary)] to-[var(--border-subtle)] opacity-30"></div>
             
             <StepBlock 
               number="01" 
               title="AI Analyzes Your Schedule" 
               desc="Input your deadlines and exams. Our AI agent calculates priority scores and identifies high-risk tasks before you miss them."
             />
             <StepBlock 
               number="02" 
               title="Fight Your Deadlines" 
               desc="Major projects turn into Boss Monsters. Every focus session and task completion deals damage to the boss."
             />
             <StepBlock 
               number="03" 
               title="Evolve Your Character" 
               desc="Earn XP to level up your companion from Novice to Ascended. Unlock new armor sets, auras, and achievements."
             />
          </div>
        </div>

        {/* Why FocusForge? Section */}
        <div className="max-w-6xl mx-auto mt-32 py-16 border-t border-[var(--border-subtle)]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Why FocusForge?</h2>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
              Every other app tracks whether you obeyed it. We track whether your life actually moved forward.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-12 md:gap-y-6">
            {/* Desktop Headers */}
            <div className="hidden md:block border-b border-[var(--border-subtle)] pb-4">
              <h3 className="text-xl font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Without FocusForge
              </h3>
            </div>
            <div className="hidden md:block border-b border-[var(--border-subtle)] pb-4">
              <h3 className="text-xl font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                With FocusForge
              </h3>
            </div>

            {/* Row 1 */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <X className="text-red-500 shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Without FocusForge</span>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  You mark a task done... or forget to. The app has no idea which.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <Check className="text-[var(--accent-primary)] shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">With FocusForge</span>
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                  Before judging you, it asks: "Did this really happen?"
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <X className="text-red-500 shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Without FocusForge</span>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Miss your planned start time, and the rest of your day just sits there, wrong.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <Check className="text-[var(--accent-primary)] shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">With FocusForge</span>
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                  One missed block triggers Cascade Recovery — your whole day reflows automatically.
                </p>
              </div>
            </div>

            {/* Row 3 */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <X className="text-red-500 shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Without FocusForge</span>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Red alerts everywhere, with no real plan to fix anything.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <Check className="text-[var(--accent-primary)] shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">With FocusForge</span>
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                  Recovery Plan tries to save the deadline first. Only suggests an extension if the math genuinely doesn't work.
                </p>
              </div>
            </div>

            {/* Row 4 */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <X className="text-red-500 shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Without FocusForge</span>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Streaks break because you forgot to check a box — not because you actually failed.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <Check className="text-[var(--accent-primary)] shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">With FocusForge</span>
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                  Forgiveness Window protects your streak. Honesty matters more than perfect logging.
                </p>
              </div>
            </div>

            {/* Row 5 */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <X className="text-red-500 shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Without FocusForge</span>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Generic countdowns that don't know how you actually work.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <Check className="text-[var(--accent-primary)] shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">With FocusForge</span>
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                  Risk Score factors in your personal historical pace — not a one-size-fits-all timer.
                </p>
              </div>
            </div>

            {/* Row 6 */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <X className="text-red-500 shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Without FocusForge</span>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Team leaderboards rank you by how much you did.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 md:bg-transparent md:border-none md:p-0 flex items-start gap-3">
              <Check className="text-[var(--accent-primary)] shrink-0 mt-1" size={18} />
              <div className="space-y-1">
                <span className="block md:hidden text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">With FocusForge</span>
                <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                  Reliability Score ranks you by how well your word matched your output.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Toolkit Section */}
        <div className="max-w-6xl mx-auto mt-32 py-16 border-t border-[var(--border-subtle)]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">A Comprehensive Toolkit for Mastery</h2>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">Everything you need to orchestrate your productivity, manage urgency, and track real-world growth.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ToolkitCard 
              icon={<CheckSquare className="text-emerald-500" size={24} />}
              title="Quests & Tasks"
              desc="Break down your workload into actionable quests. Map sub-tasks and track your progress daily."
            />
            <ToolkitCard 
              icon={<Swords className="text-orange-500" size={24} />}
              title="Focus Training"
              desc="Deep work sessions using customizable Pomodoro timers. Block distractions and deal damage to your tasks."
            />
            <ToolkitCard 
              icon={<ShieldAlert className="text-red-500" size={24} />}
              title="Risk Center"
              desc="AI-powered deadline radar. Spot high-risk, urgent items before they become late submissions."
            />
            <ToolkitCard 
              icon={<Activity className="text-blue-500" size={24} />}
              title="Reality Sync"
              desc="Bridge your virtual stats with real-world habits. Connect sleep, exercise, and studying to your character."
            />
            <ToolkitCard 
              icon={<Crosshair className="text-purple-500" size={24} />}
              title="Recovery Missions"
              desc="Fell off track? Execute specialized missions to rebuild momentum, restore streaks, and bounce back quickly."
            />
            <ToolkitCard 
              icon={<Users className="text-cyan-500" size={24} />}
              title="Workspaces"
              desc="Collaborate with peers, share study materials, and tackle massive multiplayer boss assignments together."
            />
            <ToolkitCard 
              icon={<Calendar className="text-indigo-500" size={24} />}
              title="Calendar Sync"
              desc="Visualize your timeline. Time-block your day to ensure your quests fit perfectly into your schedule."
            />
            <ToolkitCard 
              icon={<BarChart2 className="text-yellow-500" size={24} />}
              title="Deep Analytics"
              desc="Understand when you are most productive. AI Command Center provides insights into your work patterns."
            />
            <ToolkitCard 
              icon={<Target className="text-pink-500" size={24} />}
              title="Leaderboards"
              desc="Compete globally or with friends. Earn your spot among the elite and showcase your productivity rank."
            />
          </div>
        </div>

        {/* Character Classes Section */}
        <div className="max-w-6xl mx-auto mt-24">
          <div className="glass rounded-3xl p-8 md:p-16 border border-[var(--border-subtle)] relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent-primary)]/10 rounded-full blur-[120px] -z-10 -mr-32 -mt-32"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                   <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Choose Your Class</h2>
                   <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">
                     Your productivity journey is unique. Select a companion class that matches your style. Watch them evolve from Level 1 to Level 100 as you accomplish real-world goals.
                   </p>
                   
                   <div className="space-y-4">
                     <ClassItem icon="🐉" name="Dragon Monk" desc="Masters of deep focus and meditation." />
                     <ClassItem icon="⚔️" name="Cyber Samurai" desc="Disciplined task executors and planners." />
                     <ClassItem icon="🪄" name="Arcane Mage" desc="Creative problem solvers and researchers." />
                   </div>
                   
                   <Link to="/login">
                     <Button size="lg" className="mt-8 rounded-full shadow-[0_0_15px_var(--xp-glow)] gap-2">
                       More Classes <ArrowRight size={16} />
                     </Button>
                   </Link>
                </div>
                
                <div className="relative">
                   <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center p-8 relative overflow-hidden shadow-xl">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                      <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="relative z-10 text-center">
                         <div className="text-[120px] md:text-[150px] drop-shadow-2xl mb-6">🐉</div>
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-md text-sm font-mono font-medium text-[var(--text-primary)]">
                           <Zap size={14} className="text-[#facc15]" fill="#facc15" /> Level 35 - Master
                         </div>
                      </motion.div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Pricing / Monetization */}
        <div className="max-w-6xl mx-auto mt-32 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Start Forging for Free</h2>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">Level up your productivity without breaking the bank. Upgrade when you need advanced AI features.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <PricingCard 
                title="Novice" 
                price="Free" 
                desc="Perfect for students looking to fix their habits."
                features={["Smart To-Do List", "Focus Timer", "Basic Character Evolution", "Streak System"]}
             />
             <PricingCard 
                title="Legend" 
                price="$8"
                interval="/mo"
                desc="Advanced tools for competitive exams and heavy workloads."
                features={["Advanced AI Risk Planning", "Multiple Character Classes", "Analytics Dashboard", "Custom Study Room Environments", "Premium Evolutions"]}
                highlight
             />
          </div>
        </div>

        {/* Created By Section */}
        <div className="w-full max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center relative z-10">
          <h3 className="text-[#8a8a95] font-bold uppercase mb-8 tracking-[6px] text-xs text-center">
            Created By
          </h3>
          
          <a 
            href="https://github.com/Karthikeyancse-coder" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Open Karthikeyan M's GitHub profile"
            className="relative w-[90%] md:w-[420px] h-[130px] group block rounded-[999px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-black transition-all duration-300" 
            style={{ animation: 'float-card 5s ease-in-out infinite' }}
          >
            {/* Fine rotating RGB border aura */}
            <div 
              className="absolute inset-[-2px] rounded-[999px] overflow-hidden opacity-60 group-hover:opacity-95 transition-opacity duration-300"
              style={{ pointerEvents: 'none' }}
            >
              <div 
                className="absolute top-1/2 left-1/2 w-[130%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #1FA463, #22D3EE, #3B82F6, #8B5CF6, #EC4899, #FB923C, #1FA463)',
                  animation: 'rgb-rotate 10s infinite linear'
                }}
              />
            </div>

            {/* Layered soft wide rotating RGB halos behind the glass card */}
            {/* Mid Glow Layer */}
            <div 
              className="absolute inset-0 sm:inset-[-20px] md:inset-[-30px] rounded-[999px] opacity-55 group-hover:opacity-80 blur-[12px] sm:blur-[18px] md:blur-[24px] transition-all duration-300"
              style={{ pointerEvents: 'none' }}
            >
              <div className="absolute inset-0 rounded-[999px] overflow-hidden">
                <div 
                  className="absolute top-1/2 left-1/2 w-[130%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #1FA463, #22D3EE, #3B82F6, #8B5CF6, #EC4899, #FB923C, #1FA463)',
                    animation: 'rgb-rotate 10s infinite linear'
                  }}
                />
              </div>
            </div>

            {/* Outer Deep Glow Layer */}
            <div 
              className="hidden sm:block absolute sm:inset-[-30px] md:inset-[-45px] rounded-[999px] opacity-40 group-hover:opacity-65 blur-[36px] group-hover:blur-[44px] transition-all duration-300"
              style={{ pointerEvents: 'none' }}
            >
              <div className="absolute inset-0 rounded-[999px] overflow-hidden">
                <div 
                  className="absolute top-1/2 left-1/2 w-[130%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, #1FA463, #22D3EE, #3B82F6, #8B5CF6, #EC4899, #FB923C, #1FA463)',
                    animation: 'rgb-rotate 10s infinite linear'
                  }}
                />
              </div>
            </div>
            
            {/* Card Content */}
            <div 
              className="absolute inset-0 rounded-[999px] flex items-center p-4 pl-6 pr-8 md:pl-8 md:pr-10 border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.45)] transition-all duration-250 group-hover:-translate-y-[3px] group-hover:scale-[1.01]"
              style={{ 
                backgroundColor: 'rgba(18,18,20,0.82)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
              }}
            >
              <div className="flex items-center gap-5 w-full">
                <div className="relative shrink-0">
                  {/* Small glow around image */}
                  <div className="absolute inset-0 rounded-full blur-[8px] bg-white/20" />
                  <img 
                    src="https://github.com/Karthikeyancse-coder.png" 
                    alt="Karthikeyan M" 
                    className="w-[58px] h-[58px] md:w-[72px] md:h-[72px] rounded-full border-2 border-white/20 object-cover relative z-10"
                  />
                </div>
                
                <div className="flex flex-col text-left min-w-0">
                  <h4 className="text-[19px] sm:text-[24px] md:text-[29px] font-extrabold text-white leading-tight whitespace-nowrap">
                    Karthikeyan M
                  </h4>
                  <p className="text-[11px] sm:text-[13px] md:text-[14px] text-white/65 font-medium truncate">
                    Full Stack Developer • AI Engineer
                  </p>
                </div>
              </div>
            </div>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-12 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-80">
              <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
                <span className="text-[var(--bg-primary)] font-bold font-display leading-none">F</span>
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-[var(--text-primary)]">FocusForge AI</span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">© 2026 FocusForge. Built for focus, forged for legends.</p>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="font-display font-bold text-xl mb-3">{title}</h3>
      <p className="text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  )
}

function StepBlock({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl font-display font-black text-[var(--accent-primary)] mb-6 shadow-sm">
        {number}
      </div>
      <h3 className="text-xl font-bold font-display mb-3">{title}</h3>
      <p className="text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  )
}

function ClassItem({ icon, name, desc }: { icon: string, name: string, desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-[var(--text-primary)]">{name}</h4>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function PricingCard({ title, price, interval, desc, features, highlight = false }: { title: string, price: string, interval?: string, desc: string, features: string[], highlight?: boolean }) {
  return (
    <div className={`p-8 rounded-3xl border ${highlight ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)] shadow-[0_0_30px_var(--xp-glow)]' : 'border-[var(--border-subtle)] bg-[var(--bg-primary)]'} flex flex-col relative`}>
      {highlight && (
        <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold font-display mb-2">{title}</h3>
      <div className="flex items-end gap-1 mb-4">
        <span className="text-4xl font-black font-display">{price}</span>
        {interval && <span className="text-[var(--text-muted)] font-medium mb-1">{interval}</span>}
      </div>
      <p className="text-[var(--text-muted)] text-sm mb-8">{desc}</p>
      
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <CheckCircle2 size={18} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
            <span className="text-[var(--text-secondary)]">{f}</span>
          </li>
        ))}
      </ul>
      
      <Link to="/login" className="mt-auto">
        <Button variant={highlight ? "default" : "outline"} className="w-full rounded-2xl h-12 text-base">
          {highlight ? "Get Started" : "Start Free"}
        </Button>
      </Link>
    </div>
  )
}

function ToolkitCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] transition-all duration-300 flex flex-col items-start text-left">
      <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  )
}
