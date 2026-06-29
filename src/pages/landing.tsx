import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { PublicThemeToggle } from "../components/PublicThemeToggle";
import { FocusForgeLogo } from "../components/ui/FocusForgeLogo";
import { 
  ArrowRight, Bot, Shield, Trophy, Zap, ChevronRight, CheckCircle2, CheckSquare, 
  Swords, ShieldAlert, Activity, Crosshair, Users, BarChart2, Calendar, Target, 
  Github, Check, X, ClipboardList, CalendarDays, Timer, Sparkles, ShieldCheck, 
  Moon, Mic, Move, GraduationCap, Briefcase, Rocket, BookOpen, User, Code, 
  Presentation, TrendingUp, Laptop, RefreshCw, PlusCircle, Cpu, Layers, Play, 
  AlertTriangle, HeartPulse, CheckCircle, Award, Sun, Flame, Coffee, Clock
} from "lucide-react";

// ==========================================
// STATIC DATA DEFINITIONS (COMPACTED)
// ==========================================
const categories = [
  {
    id: "ai",
    title: "AI Intelligence",
    subtitle: "AI-powered planning and productivity assistance.",
    description: "Smarter planning powered by AI.",
    badgeText: "7 Features",
    glowClass: "hover:border-green-500/40 hover:shadow-[0_8px_30px_rgba(34,197,94,0.12)]",
    iconGlow: "shadow-[0_0_20px_rgba(34,197,94,0.15)]",
    textAccent: "group-hover:text-green-500",
    iconColor: "text-green-500",
    bulletColor: "text-green-500",
    icon: Bot,
    features: ["Reality Sync", "Risk Center", "Recovery Missions", "AI Command Center", "AI Chat Assistant", "Voice Input (Speech-to-Text)", "AI Voice Responses"]
  },
  {
    id: "task",
    title: "Task Management",
    subtitle: "Everything needed to organize your work.",
    description: "Structure your daily goals with speed and precision.",
    badgeText: "7 Features",
    glowClass: "hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)]",
    iconGlow: "shadow-[0_0_20px_rgba(99,102,241,0.15)]",
    textAccent: "group-hover:text-indigo-500",
    iconColor: "text-indigo-500",
    bulletColor: "text-indigo-500",
    icon: ClipboardList,
    features: ["Smart Task Creation", "Edit Tasks", "Delete Tasks", "Pin Tasks", "Mark Complete", "Task Details Panel", "Priority Management"]
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "Schedule, plan and visualize your workflow.",
    description: "Timeblock your tasks for seamless day control.",
    badgeText: "3 Features",
    glowClass: "hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]",
    iconGlow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    textAccent: "group-hover:text-blue-500",
    iconColor: "text-blue-500",
    bulletColor: "text-blue-500",
    icon: CalendarDays,
    features: ["Calendar Integration", "Drag & Drop Scheduling", "Day / Week / Month Views"]
  },
  {
    id: "focus",
    title: "Focus",
    subtitle: "Stay productive with distraction-free sessions.",
    description: "Immersive session timers that protect your time blocks.",
    badgeText: "4 Features",
    glowClass: "hover:border-orange-500/40 hover:shadow-[0_8px_30px_rgba(249,115,22,0.12)]",
    iconGlow: "shadow-[0_0_20px_rgba(249,115,22,0.15)]",
    textAccent: "group-hover:text-orange-500",
    iconColor: "text-orange-500",
    bulletColor: "text-orange-500",
    icon: Timer,
    features: ["Pomodoro Focus Timer", "Pause/Resume Sessions", "Floating Focus Timer", "Edge-Docking Floating Timer"]
  },
  {
    id: "progress",
    title: "Progress",
    subtitle: "Level up through consistent productivity.",
    description: "Experience-driven characters and social competition.",
    badgeText: "3 Features",
    glowClass: "hover:border-amber-500/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]",
    iconGlow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    textAccent: "group-hover:text-amber-500",
    iconColor: "text-amber-500",
    bulletColor: "text-amber-500",
    icon: Trophy,
    features: ["XP & Gamified Progression", "Character Evolution System", "Leaderboard"]
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Visual insights into your productivity.",
    description: "Deep analytics tracking accuracy and focus pace.",
    badgeText: "2 Features",
    glowClass: "hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)]",
    iconGlow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    textAccent: "group-hover:text-purple-500",
    iconColor: "text-purple-500",
    bulletColor: "text-purple-500",
    icon: BarChart2,
    features: ["Productivity Dashboard", "Analytics & Insights"]
  }
];

const platformCategory = {
  id: "platform",
  title: "Platform & Polish",
  subtitle: "A fully polished, responsive, and customizable experience.",
  description: "An elegant, fluid, and robust multi-device interface.",
  badgeText: "6 Features",
  glowClass: "hover:border-pink-500/40 hover:shadow-[0_8px_30px_rgba(236,72,153,0.12)]",
  iconGlow: "shadow-[0_0_20px_rgba(236,72,153,0.15)]",
  textAccent: "group-hover:text-pink-500",
  iconColor: "text-pink-500",
  bulletColor: "text-pink-500",
  icon: Sparkles,
  features: ["Light & Dark Theme", "Fully Responsive Design", "Interactive Onboarding", "Premium Glassmorphism UI", "Animated RGB Effects", "Smart Productivity Notifications"]
};

const EDUCATION_DETAILS = [{ text: "Smart Study Planning", highlight: true }, { text: "Exam Deadline Management", highlight: false }, { text: "Subject Mastery Tracks", highlight: false }, { text: "Gamified Self-Learning Mode", highlight: true }];
const PROFESSIONAL_DETAILS = [{ text: "Deep Work Scheduling", highlight: true }, { text: "Meeting Buffer Automation", highlight: false }, { text: "Client Deadline Tracking", highlight: true }, { text: "Daily Performance Reports", highlight: false }];
const TEAM_DETAILS = [{ text: "Sprint Planning AI Co-pilot", highlight: true }, { text: "Resource Overload Alert", highlight: false }, { text: "Cross-platform Goal Syncing", highlight: false }, { text: "Workspace Progress Boards", highlight: true }];
const EXAM_DETAILS = [{ text: "High-yield Mock Calendars", highlight: true }, { text: "Dynamic Revision Loops", highlight: true }, { text: "Focus Pace Stabilizers", highlight: false }, { text: "Syllabus Progress Badges", highlight: false }];

const USE_CASES = [
  { id: "edu", title: "Education", subtitle: "Schools, Colleges & Self Learning", description: "FocusForge provides students with gamified study quests, course planning tools, and real-time exam risk metrics to eliminate procrastination completely.", icon: GraduationCap, gradient: "from-emerald-500/20 to-teal-500/10", border: "group-hover:border-emerald-500/40", badge: "Academic", details: EDUCATION_DETAILS },
  { id: "prof", title: "Professional", subtitle: "Remote Work & Developers", description: "Engineered to safeguard focus hours. Seamlessly blocks calendars, schedules focus sessions, auto-summarizes transcripts, and maps out critical deadlines.", icon: Briefcase, gradient: "from-cyan-500/20 to-blue-500/10", border: "group-hover:border-cyan-500/40", badge: "Enterprise", details: PROFESSIONAL_DETAILS },
  { id: "teams", title: "Startup Teams", subtitle: "Sprint & Project Execution", description: "Keep your crew laser-focused. AI evaluates tasks, flags bottlenecks, predicts scheduling delays, and synchronizes priorities inside responsive team workspaces.", icon: Rocket, gradient: "from-indigo-500/20 to-purple-500/10", border: "group-hover:border-indigo-500/40", badge: "High Velocity", details: TEAM_DETAILS },
  { id: "exams", title: "Competitive Exams", subtitle: "UPSC, GRE, IELTS & Coding", description: "Designed for intensive, high-stakes preparation. Breaks massive syllabi into daily bite-sized tasks, schedules revision timers, and builds study stamina.", icon: BookOpen, gradient: "from-amber-500/20 to-orange-500/10", border: "group-hover:border-amber-500/40", badge: "Extreme Stamina", details: EXAM_DETAILS }
];

const USER_ROLES = [
  { role: "Student", subtitle: "The Academic Quester", description: "Fuses assignment trackers, deadline metrics, study reminders, and XP levels to turn hard exams into satisfying level-ups.", icon: User, color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-500/5 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)]", points: ["Track study tasks seamlessly", "Manage assignment deadlines", "Earn RPG XP & level up", "Interactive study rooms"] },
  { role: "Developer", subtitle: "The Deep Work Architect", description: "Time-blocks uninterrupted coding sprints, syncs tasks with flow metrics, docks focus timers, and automates work recovery missions.", icon: Code, color: "text-cyan-600 dark:text-cyan-400 border-cyan-500/20 dark:border-cyan-500/30 bg-cyan-500/[0.04] dark:bg-cyan-500/5 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.1)]", points: ["Sleek sprint-planning AI", "Auto calendar time-blocking", "Interactive Pomodoro docks", "Deep session analytics"] },
  { role: "Educator", subtitle: "The Progress Mentor", description: "Maps student curriculum, oversees study circles, tracks guidance milestones, and guides student focus rooms smoothly.", icon: Presentation, color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30 bg-indigo-500/[0.04] dark:bg-indigo-500/5 hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.1)]", points: ["Course planning assistant", "Guide workspace communities", "Track active student milestones", "Shared productivity leaderboards"] },
  { role: "Professional", subtitle: "The Goal Executor", description: "Aligns meetings, maps out action items, auto-schedules deep-focus zones, and compiles rich daily progress analytics.", icon: TrendingUp, color: "text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/5 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.1)]", points: ["Automated meeting filters", "Deep work zone shields", "Interactive project matrices", "Weekly performance insights"] },
  { role: "Freelancer", subtitle: "The Solo Sovereign", description: "Coordinates multi-client pipelines, tracks active billable hours, buffers unexpected project risks, and avoids deadline burnout.", icon: Laptop, color: "text-pink-600 dark:text-pink-400 border-pink-500/20 dark:border-pink-500/30 bg-pink-500/[0.04] dark:bg-pink-500/5 hover:border-pink-500/50 hover:shadow-[0_0_25px_rgba(236,72,153,0.1)]", points: ["Organize client workspaces", "Smart time logs & timers", "Buffer risk early indicators", "Burnout prevention metrics"] }
];

const PLATFORM_FEATURES_GRID = [
  { title: "AI Command Center", desc: "Unleash smart productivity via speech command prompts or automated chat. Perfect voice-controlled task scheduling.", icon: Bot, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.08] dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] border-emerald-500/30 group-hover:border-emerald-500/60" },
  { title: "Reality Sync", desc: "Compares your optimistic study goals with actual focus durations. Auto-adjusts upcoming timelines logically.", icon: RefreshCw, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/[0.08] dark:bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] border-cyan-500/30 group-hover:border-cyan-500/60" },
  { title: "Risk Center", desc: "AI scans schedule changes, workload pileups, and focus drop-offs to calculate real-time procrastination risk indexes.", icon: ShieldAlert, color: "text-red-600 dark:text-red-400 bg-red-500/[0.08] dark:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] border-red-500/30 group-hover:border-red-500/60" },
  { title: "Recovery Missions", desc: "Failing a streak? FocusForge generates recovery quests designed to break burnout and build immediate small wins.", icon: Activity, color: "text-orange-600 dark:text-orange-400 bg-orange-500/[0.08] dark:bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] border-orange-500/30 group-hover:border-orange-500/60" },
  { title: "Calendar Planning", desc: "Seamless day-blocking. Visually drag, drop, expand, or compress your focus tasks directly onto the dynamic timeline.", icon: Calendar, color: "text-blue-600 dark:text-blue-400 bg-blue-500/[0.08] dark:bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] border-blue-500/30 group-hover:border-blue-500/60" },
  { title: "Focus Timer", desc: "A floating, edge-docking Pomodoro timer. Stays with you on screen to protect active, deep study blocks.", icon: Timer, color: "text-amber-600 dark:text-amber-400 bg-amber-500/[0.08] dark:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] border-amber-500/30 group-hover:border-amber-500/60" },
  { title: "Voice Assistant", desc: "Speak naturally to log achievements, command focus timers, or dictate tasks. Voice responses provide instant guidance.", icon: Mic, color: "text-pink-600 dark:text-pink-400 bg-pink-500/[0.08] dark:bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(236,72,153,0.25)] border-pink-500/30 group-hover:border-pink-500/60" },
  { title: "Analytics Dashboard", desc: "Gaze into beautiful d3 graphs tracking task accuracy rates, historical study blocks, and focus velocity points.", icon: BarChart2, color: "text-purple-600 dark:text-purple-400 bg-purple-500/[0.08] dark:bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] border-purple-500/30 group-hover:border-purple-500/60" },
  { title: "Character Evolution", desc: "Select a starting class (Warrior, Monk, Mage). Watch your custom 3D avatar evolve as you accumulate XP points.", icon: Trophy, color: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/[0.08] dark:bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(234,179,8,0.25)] border-yellow-500/30 group-hover:border-yellow-500/60" },
  { title: "XP Progression", desc: "Get gamified reward feedback. Task completions, streaks, and long timers fuel levels, badges, and server standings.", icon: Zap, color: "text-violet-600 dark:text-violet-400 bg-violet-500/[0.08] dark:bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] border-violet-500/30 group-hover:border-violet-500/60" },
  { title: "Interactive Onboarding", desc: "An ambient step-by-step product walkthrough that introduces features cleanly and sets up your profile profile settings.", icon: Sparkles, color: "text-teal-600 dark:text-teal-400 bg-teal-500/[0.08] dark:bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(20,184,166,0.25)] border-teal-500/30 group-hover:border-teal-500/60" },
  { title: "Drag & Drop Scheduling", desc: "Instantly change priority or time blocks with a sleek drag-and-drop mechanics built using premium Dnd-Kit utilities.", icon: Move, color: "text-sky-600 dark:text-sky-400 bg-sky-500/[0.08] dark:bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.1)]", hoverGlow: "group-hover:shadow-[0_0_30px_rgba(14,165,233,0.25)] border-sky-500/30 group-hover:border-sky-500/60" }
];

const WORKFLOW_STEPS = [
  { id: 1, title: "Create Task", desc: "Add items via dashboard or typing naturally. Instantly set deadlines.", icon: PlusCircle },
  { id: 2, title: "AI Analysis", desc: "Gemini evaluates workload requirements, difficulty scores, and historical time constraints.", icon: Cpu },
  { id: 3, title: "Priority Calculation", desc: "FocusForge calculates dynamic risk weights to rank tasks cleanly and logically.", icon: Layers },
  { id: 4, title: "Calendar Planning", desc: "Auto time-block deep-study chunks straight into your daily agenda calendar.", icon: Calendar },
  { id: 5, title: "Focus Session", desc: "Launch the docking Pomodoro timers to block distractions completely.", icon: Play },
  { id: 6, title: "Reality Sync", desc: "Sensors track actual focus vs planned. Reality score updates in real-time.", icon: RefreshCw },
  { id: 7, title: "Risk Detection", desc: "Procrastination scanners check if performance matches milestones.", icon: AlertTriangle },
  { id: 8, title: "Recovery Mission", desc: "If risk triggers high, automated mini-quests engage to stabilize progress.", icon: HeartPulse },
  { id: 9, title: "Completion", desc: "Goal reached! AI closes task logs and locks in overall accuracy scores.", icon: CheckCircle },
  { id: 10, title: "XP Reward", desc: "Watch experience bars fill and claim server streak badges.", icon: Award },
  { id: 11, title: "Character Evolution", desc: "Rank up your selected RPG character class with custom cosmetic unlocks.", icon: Sparkles }
];

const TIMELINE_PHASES = [
  { time: "Morning", activity: "Planning & AI Time-Blocking", desc: "Wake up and greet FocusForge. Voice-log goals. Our AI co-pilot processes tasks and maps out an optimal study calendar for the day ahead.", icon: Sun, glowColor: "rgba(245,158,11,0.2)", tip: "Tip: Aim to finish your highest-risk tasks before lunch!" },
  { time: "Afternoon", activity: "Deep Focus & Pomodoro Sprints", desc: "Activate floating focus mode. Block notifications and let ambient soundscapes play while the clock clocks down. Accumulate active points.", icon: Flame, glowColor: "rgba(16,185,129,0.2)", tip: "Tip: Take a 5-minute stretch break every 25 minutes." },
  { time: "Evening", activity: "Progress Review & Streak Safes", desc: "Check off finished objectives. Complete daily habit chains. Review feedback metrics, track weekly accuracy, and look at the leaderboard.", icon: Coffee, glowColor: "rgba(99,102,241,0.2)", tip: "Tip: Congratulate your study partners in the guild!" },
  { time: "Night", activity: "AI Diagnostics & Level Evolution", desc: "AI scans reality synchronization scores. Your character claims earned XP, level progression recalculates, and the Forge prepares tomorrow's templates.", icon: Moon, glowColor: "rgba(168,85,247,0.2)", tip: "Tip: Sleep well to buffer health for tomorrow's quests." }
];

const SDG_ITEMS = [
  { 
    sdg: "SDG 3", 
    title: "Good Health & Well-being", 
    desc: "Fosters healthy habits, monitors daily stress margins, and triggers adaptive recovery missions to avoid burnout, anxiety, and task exhaustion.", 
    color: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 dark:border-emerald-500/20 bg-emerald-500/[0.04] dark:bg-emerald-500/5 hover:border-emerald-500/60 dark:hover:border-emerald-500/40 hover:shadow-[0_4px_30px_rgba(16,185,129,0.25)] dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]", 
    icon: HeartPulse,
    iconColor: "text-green-600 dark:text-white"
  },
  { 
    sdg: "SDG 4", 
    title: "Quality Education", 
    desc: "Provides smart learning paths, accessible time management calendars, and dynamic study reminders to foster elite academic performance worldwide.", 
    color: "text-cyan-600 dark:text-cyan-400 border-cyan-500/40 dark:border-cyan-500/20 bg-cyan-500/[0.04] dark:bg-cyan-500/5 hover:border-cyan-500/60 dark:hover:border-cyan-500/40 hover:shadow-[0_4px_30px_rgba(6,182,212,0.25)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]", 
    icon: BookOpen,
    iconColor: "text-blue-600 dark:text-white"
  },
  { 
    sdg: "SDG 8", 
    title: "Decent Work & Economic Growth", 
    desc: "Skins task tracking with professional analytics to maximize efficiency. Accelerates career growth, freelancers' delivery, and solo workflows.", 
    color: "text-indigo-600 dark:text-indigo-400 border-indigo-500/40 dark:border-indigo-500/20 bg-indigo-500/[0.04] dark:bg-indigo-500/5 hover:border-indigo-500/60 dark:hover:border-indigo-500/40 hover:shadow-[0_4px_30px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]", 
    icon: TrendingUp,
    iconColor: "text-violet-600 dark:text-white"
  },
  { 
    sdg: "SDG 9", 
    title: "Industry & Innovation", 
    desc: "Drives standard task systems forward via generative AI automation, cloud-sync database infrastructure, and responsive web technology.", 
    color: "text-pink-600 dark:text-pink-400 border-pink-500/40 dark:border-pink-500/20 bg-pink-500/[0.04] dark:bg-pink-500/5 hover:border-pink-500/60 dark:hover:border-pink-500/40 hover:shadow-[0_4px_30px_rgba(236,72,153,0.25)] dark:hover:shadow-[0_0_25px_rgba(236,72,153,0.15)]", 
    icon: Cpu,
    iconColor: "text-pink-600 dark:text-white"
  }
];

const MARKET_STATS = [
  { title: "AI Productivity", desc: "Growing Market", metric: 48, suffix: "% CAGR", detail: "AI-backed task management is expanding rapidly as corporate and remote work landscapes seek automated assistance." },
  { title: "EdTech Industry", desc: "Rapid Expansion", metric: 125, suffix: "B+", detail: "Digital learning platforms require engagement loops that transition study time from basic lists to real action." },
  { title: "Remote Work", desc: "Worldwide Adoption", metric: 78, suffix: "%", detail: "A vast majority of tech professionals report working in fully flexible or hybrid environments needing independent trackers." },
  { title: "Gamification", desc: "Increasing Demand", metric: 32, suffix: "B", detail: "Applying game design mechanics (XP, avatars, quests) boosts user retention and daily goal success rates exponentially." },
  { title: "Personal Productivity", desc: "Future Ready", metric: 96, suffix: "%", detail: "Modern workers state that standard calendar tools lack active threat prediction, burnout guides, and motivation cores." }
];

const ROADMAP_MILESTONES = [
  { phase: "Phase 1", platform: "Web Platform", status: "Live Now", active: true },
  { phase: "Phase 2", platform: "Android", status: "Beta Q3 2026", active: false },
  { phase: "Phase 3", platform: "iOS Mobile", status: "In Dev Q4 2026", active: false },
  { phase: "Phase 4", platform: "Desktop App", status: "Target Q1 2027", active: false },
  { phase: "Phase 5", platform: "Enterprise", status: "Target Q2 2027", active: false },
  { phase: "Phase 6", platform: "Global Platform", status: "Vision 2028", active: false }
];

const TECH_STACK = [
  { name: "React 19", category: "Core Library", glow: "hover:border-cyan-500/40 shadow-cyan-500/5", color: "text-cyan-600 dark:text-cyan-400" },
  { name: "TypeScript", category: "Robust Typing", glow: "hover:border-blue-500/40 shadow-blue-500/5", color: "text-blue-600 dark:text-blue-400" },
  { name: "Firebase", category: "Durable Cloud DB", glow: "hover:border-orange-500/40 shadow-orange-500/5", color: "text-orange-600 dark:text-orange-400" },
  { name: "Tailwind CSS", category: "Sleek Styling", glow: "hover:border-teal-500/40 shadow-teal-500/5", color: "text-teal-600 dark:text-teal-400" },
  { name: "Framer Motion", category: "Fluid Animation", glow: "hover:border-pink-500/40 shadow-pink-500/5", color: "text-pink-600 dark:text-pink-400" },
  { name: "Speech Recog.", category: "Voice Input", glow: "hover:border-emerald-500/40 shadow-emerald-500/5", color: "text-emerald-600 dark:text-emerald-400" },
  { name: "Speech Synth.", category: "Audio Responses", glow: "hover:border-purple-500/40 shadow-purple-500/5", color: "text-purple-600 dark:text-purple-400" },
  { name: "Context API", category: "State Management", glow: "hover:border-amber-500/40 shadow-amber-500/5", color: "text-amber-600 dark:text-amber-400" },
  { name: "Lucide Icons", category: "Vector Imagery", glow: "hover:border-violet-500/40 shadow-violet-500/5", color: "text-violet-600 dark:text-violet-400" },
  { name: "Vite Bundler", category: "High Speed Build", glow: "hover:border-rose-500/40 shadow-rose-500/5", color: "text-rose-600 dark:text-rose-400" }
];

// ==========================================
// UTILITY COUNT UP COMPONENT
// ==========================================
function CountUp({ end, suffix = "", duration = 1500 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setIsInView(true); }, { threshold: 0.1 });
    if (elementRef.current) observer.observe(elementRef.current);
    return () => { if (elementRef.current) observer.unobserve(elementRef.current); };
  }, []);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) window.requestAnimationFrame(step);
      else setCount(end);
    };
    window.requestAnimationFrame(step);
  }, [isInView, end, duration]);

  return <span ref={elementRef} className="tabular-nums font-extrabold tracking-tight">{count.toLocaleString()}{suffix}</span>;
}

// ==========================================
// MAIN LANDING COMPONENT
// ==========================================
export default function Landing() {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);
  const [activeTimelinePhase, setActiveTimelinePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev % WORKFLOW_STEPS.length) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full max-w-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-x-hidden selection:bg-[var(--accent-primary)] selection:text-white relative">
      
      {/* Background Ambient Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[5%] w-[450px] h-[450px] rounded-full bg-cyan-500/5 blur-[140px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-[60%] left-[5%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[130px] animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute top-[85%] right-[10%] w-[380px] h-[380px] rounded-full bg-emerald-500/5 blur-[120px] animate-pulse" style={{ animationDuration: "7s" }} />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-16 bg-[var(--bg-primary)]/80 backdrop-blur-md z-50 border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <FocusForgeLogo size={32} variant="gradient" className="shadow-[0_0_15px_rgba(31,164,99,0.3)] hover:scale-105 transition-transform duration-200" />
            <span className="font-display font-bold text-base sm:text-lg tracking-tight shrink-0">FocusForge</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link to="/login" className="flex items-center shrink-0">
              <Button size="sm" className="rounded-full shadow-[0_0_15px_var(--xp-glow)] shrink-0">Start Forging</Button>
            </Link>
            <div className="w-px h-5 bg-[var(--border-subtle)] shrink-0"></div>
            <div className="flex items-center shrink-0"><PublicThemeToggle /></div>
          </div>
        </div>
      </nav>

      <main className="w-full relative z-10">

        {/* ================= Hero ================= */}
        <section className="w-full pt-[130px] pb-8 md:pt-[160px] md:pb-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 text-center relative z-10">
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
        </section>

        {/* ================= Character Preview ================= */}
        <section className="w-full pb-10 md:pb-12">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 relative">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="relative"
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
          </div>
        </section>

        {/* ================= Journey ================= */}
        <section className="w-full pt-16 pb-24 md:pt-[100px] md:pb-[140px] border-t border-[var(--border-subtle)]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">From Chaos to Legendary</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">FocusForge AI transforms your standard academic workflow into an engaging RPG-style progression.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
               <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[var(--border-subtle)] via-[var(--accent-primary)] to-[var(--border-subtle)] opacity-30"></div>
               
               <StepBlock number="01" title="AI Analyzes Your Schedule" desc="Input your deadlines and exams. Our AI agent calculates priority scores and identifies high-risk tasks before you miss them." />
               <StepBlock number="02" title="Fight Your Deadlines" desc="Major projects turn into Boss Monsters. Every focus session and task completion deals damage to the boss." />
               <StepBlock number="03" title="Evolve Your Character" desc="Earn XP to level up your companion from Novice to Ascended. Unlock new armor sets, auras, and achievements." />
            </div>
          </div>
        </section>

        {/* ================= Features ================= */}
        {/* Why Choose FocusForge */}
        <section className="w-full pt-20 pb-20 md:pt-[140px] md:pb-[140px] border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <div className="text-center mb-10">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-pink-600 dark:text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full">Comparison</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">🏆 Why Choose FocusForge</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
                Standard task managers alert but ignore burnout. We fuse real AI planning with resilience loops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Traditional Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="p-8 rounded-3xl border border-red-500/20 dark:border-red-500/10 bg-red-500/[0.02] backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">❌</span>
                    <h3 className="font-display font-bold text-xl text-red-600 dark:text-red-400">Traditional Apps</h3>
                  </div>
                  <ul className="space-y-5">
                    <li className="flex items-start gap-3">
                      <X size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>Static To-Do Lists</strong>: Entirely dependent on manual edits and constant sorting logs.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>No AI Co-pilot</strong>: Standard tools cannot predict deadlines or gauge work intensity dynamically.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>No Threat Scanners</strong>: Procrastination rates increase because no alert triggers buffer states.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>No Gamification Cores</strong>: Lack of level goals, badges, or RPG elements makes task tracking boring.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <X size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>No Proactive Recovery</strong>: Streaks fail and users abandon tasks without automated safety nets.</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t border-red-500/20 dark:border-red-500/10 pt-6 mt-8">
                  <span className="text-xs text-red-700 dark:text-red-400/80 italic font-medium">Outcome: Burnout, procrastination, and manual task fatigue.</span>
                </div>
              </motion.div>

              {/* FocusForge Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="p-8 rounded-3xl border border-[var(--accent-primary)] bg-[var(--accent-primary)]/[0.04] backdrop-blur-md flex flex-col justify-between shadow-[0_0_40px_rgba(31,164,99,0.1)] relative"
              >
                <div className="absolute -top-3.5 right-6 bg-[var(--accent-primary)] text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase">The Evolution</div>
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">⚡</span>
                    <h3 className="font-display font-bold text-xl text-[var(--accent-primary)]">FocusForge Platform</h3>
                  </div>
                  <ul className="space-y-5">
                    <li className="flex items-start gap-3 group/item">
                      <Check size={18} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>AI Planning</strong>: Dynamically parses goals to design calendar blocking models auto-filled.</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <Check size={18} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>Voice Assistant</strong>: Speeds execution via micro dictation command inputs.</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <Check size={18} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>Reality Sync Verification</strong>: Measures performance accuracy to balance upcoming tasks.</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <Check size={18} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>Proactive Threat Detection</strong>: Scans schedules to flag unexpected procrastination early indicators.</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <Check size={18} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>Resilient Recovery Missions</strong>: Triggers engaging sub-quests when studies fall behind schedule.</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <Check size={18} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text-secondary)]"><strong>Character Evolution RPG</strong>: Fuses progression mechanics with avatars to build massive engagement.</span>
                    </li>
                  </ul>
                </div>
                <div className="border-t border-[var(--accent-primary)]/20 pt-6 mt-8">
                  <span className="text-xs text-[var(--accent-primary)] italic font-medium">Outcome: Legendary productivity, reduced mental stress, and sustained streaks.</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Directory */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="w-full pt-12 pb-16 md:pt-[100px] md:pb-[120px] border-t border-[var(--border-subtle)]"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Everything You Need</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
                An AI-powered productivity ecosystem combining planning, focus, automation, recovery, analytics and gamified progression into one seamless workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <motion.div
                    key={category.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                    className={`group relative flex flex-col h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/72 backdrop-blur-[14px] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${category.glowClass}`}
                  >
                    <div className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 text-[var(--text-muted)]">{category.badgeText}</div>
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`p-3 rounded-xl ${category.iconGlow} ${category.iconColor} bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] shrink-0`}>
                        <IconComponent size={24} />
                      </div>
                      <div className="min-w-0 pr-16 mt-1">
                        <h3 className={`font-display font-bold text-lg text-[var(--text-primary)] ${category.textAccent}`}>{category.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{category.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-5">{category.description}</p>
                    <div className="border-t border-[var(--border-subtle)] my-2"></div>
                    <ul className="space-y-3.5 mt-4 flex-1">
                      {category.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                          <Check size={14} className={`${category.bulletColor} shrink-0`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}

              {/* Platform & Polish Full Width on large */}
              {(() => {
                const IconComponent = platformCategory.icon;
                return (
                  <motion.div
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                    className={`group relative flex flex-col h-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/72 backdrop-blur-[14px] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl col-span-1 md:col-span-2 lg:col-span-3 ${platformCategory.glowClass}`}
                  >
                    <div className="absolute top-4 right-4 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 text-[var(--text-muted)]">{platformCategory.badgeText}</div>
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`p-3 rounded-xl ${platformCategory.iconGlow} ${platformCategory.iconColor} bg-[var(--bg-primary)]/40 border border-[var(--border-subtle)] shrink-0`}>
                        <IconComponent size={24} />
                      </div>
                      <div className="min-w-0 pr-16 mt-1">
                        <h3 className={`font-display font-bold text-lg text-[var(--text-primary)] ${platformCategory.textAccent}`}>{platformCategory.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{platformCategory.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-5">{platformCategory.description}</p>
                    <div className="border-t border-[var(--border-subtle)] my-2"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 flex-1">
                      {platformCategory.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1">
                          <Check size={14} className={`${platformCategory.bulletColor} shrink-0`} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          </div>
        </motion.section>

        {/* Character Classes */}
        <section className="w-full pt-20 pb-16 md:pt-[140px] md:pb-[120px] border-t border-[var(--border-subtle)]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <div className="glass rounded-3xl p-8 md:p-16 border border-[var(--border-subtle)] relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent-primary)]/10 rounded-full blur-[120px] -z-10 -mr-32 -mt-32"></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="flex flex-col justify-center h-full text-left">
                     <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Choose Your Class</h2>
                     <p className="text-[var(--text-muted)] text-lg mb-8 leading-relaxed">
                       Your productivity journey is unique. Select a companion class that matches your style. Watch them evolve from Level 1 to Level 100 as you accomplish real-world goals.
                     </p>
                     <div className="space-y-4">
                       <ClassItem icon="🐉" name="Dragon Monk" desc="Masters of deep focus and meditation." />
                       <ClassItem icon="⚔️" name="Cyber Samurai" desc="Disciplined task executors and planners." />
                       <ClassItem icon="🪄" name="Arcane Mage" desc="Creative problem solvers and researchers." />
                     </div>
                     <div className="flex">
                       <Link to="/login" className="inline-block mt-8">
                         <Button size="lg" className="rounded-full shadow-[0_0_15px_var(--xp-glow)] gap-2">
                           More Classes <ArrowRight size={16} />
                         </Button>
                       </Link>
                     </div>
                  </div>
                  <div className="relative flex items-center justify-center h-full">
                     <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-tr from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center p-8 relative overflow-hidden shadow-xl">
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
        </section>

        {/* ================ Platform Features ================ */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full">Capabilities</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">⚡ Platform Features</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">Every component crafted to streamline planning, shield energy, and gamify daily goals.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {PLATFORM_FEATURES_GRID.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.03 }}
                    className={`group p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col ${feat.hoverGlow}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${feat.color}`}>
                      <Icon size={20} className="transition-transform group-hover:rotate-6" />
                    </div>
                    <h3 className="font-bold text-base mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{feat.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feat.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================ Interactive Productivity Loop ================ */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">Operations Pipeline</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">🔄 Interactive Productivity Loop</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">Click any step to preview the workflow. See how FocusForge handles your goals from creation to reward.</p>
            </motion.div>
            <div className="glass p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-8">
                {WORKFLOW_STEPS.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = activeWorkflowStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveWorkflowStep(step.id)}
                      className={`relative flex items-center justify-center p-3 rounded-2xl border transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                        isActive 
                           ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] scale-110 shadow-[0_0_20px_rgba(31,164,99,0.25)]" 
                           : "bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-white/20 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                      aria-label={`Show details for Step ${step.id}: ${step.title}`}
                    >
                      <StepIcon size={18} className={isActive ? "animate-pulse" : ""} />
                      {isActive && <span className="absolute inset-0 rounded-2xl border border-[var(--accent-primary)] animate-ping opacity-75 pointer-events-none" />}
                    </button>
                  );
                })}
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full mb-8 relative overflow-hidden hidden sm:block border border-slate-200/60 dark:border-white/5">
                <motion.div className="absolute h-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-400" animate={{ left: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ width: "40%" }} />
              </div>
              <AnimatePresence mode="wait">
                {WORKFLOW_STEPS.map((step) => {
                  if (step.id !== activeWorkflowStep) return null;
                  const StepIcon = step.icon;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl bg-[var(--bg-primary)]/60 border border-[var(--border-subtle)]/60"
                    >
                      <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-[var(--border-subtle)]/60 pb-6 md:pb-0 md:pr-6">
                        <div className="text-sm font-extrabold text-[var(--accent-primary)] tracking-widest uppercase mb-1">Step {step.id.toString().padStart(2, "0")}</div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"><StepIcon size={20} /></div>
                          <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">{step.title}</h4>
                        </div>
                      </div>
                      <div className="md:col-span-9 text-center md:text-left">
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{step.desc}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          <span className="text-[10px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[var(--text-muted)] rounded px-2 py-0.5 font-mono">Status: ACTIVE PIPELINE</span>
                          <span className="text-[10px] bg-emerald-500/[0.08] dark:bg-emerald-500/10 border border-emerald-500/20 text-[var(--accent-primary)] rounded px-2 py-0.5 font-mono">Auto verified</span>
                          <span className="text-[10px] bg-cyan-500/[0.08] dark:bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded px-2 py-0.5 font-mono">No latency delay</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ================ A Day in the Life ================ */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">Daily Cadence</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">⏰ A Day in the Life</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">See how FocusForge transitions with you throughout the day to maximize potential.</p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between h-full gap-3">
                {TIMELINE_PHASES.map((phase, idx) => {
                  const PhaseIcon = phase.icon;
                  const isSelected = activeTimelinePhase === idx;
                  return (
                    <button
                      key={phase.time}
                      onClick={() => setActiveTimelinePhase(idx)}
                      className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] h-full ${
                        isSelected 
                          ? "bg-[var(--bg-secondary)] border-[var(--accent-primary)] shadow-[0_0_20px_rgba(31,164,99,0.15)]" 
                          : "bg-[var(--bg-secondary)]/40 border-[var(--border-subtle)] hover:border-slate-300 dark:hover:border-white/10"
                      }`}
                      aria-label={`View schedule for ${phase.time}: ${phase.activity}`}
                    >
                      <div className={`p-2.5 rounded-xl border ${isSelected ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                        <PhaseIcon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{phase.time}</h4>
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px] sm:max-w-none">{phase.activity}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="lg:col-span-7 flex flex-col h-full">
                <AnimatePresence mode="wait">
                  {TIMELINE_PHASES.map((phase, idx) => {
                    if (idx !== activeTimelinePhase) return null;
                    const PhaseIcon = phase.icon;
                    return (
                      <motion.div
                        key={phase.time}
                        initial={{ opacity: 0, scale: 0.98, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.98, x: -10 }}
                        transition={{ duration: 0.4 }}
                        className="p-8 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] relative overflow-hidden flex flex-col justify-between h-full min-h-[300px] lg:min-h-0"
                        style={{ boxShadow: `0 0 40px ${phase.glowColor}` }}
                      >
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-slate-800 dark:text-white"><PhaseIcon size={24} /></div>
                            <div>
                              <span className="text-xs uppercase font-extrabold text-[var(--accent-primary)] tracking-widest">{phase.time} Focus Routine</span>
                              <h3 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">{phase.activity}</h3>
                            </div>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">{phase.desc}</p>
                        </div>
                        <div className="mt-auto pt-6 border-t border-[var(--border-subtle)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <span className="text-xs italic text-[var(--accent-primary)]">{phase.tip}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] bg-[var(--bg-primary)] px-3 py-1.5 rounded-full border border-[var(--border-subtle)]/80 self-start sm:self-auto">Automated Integration</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SDGs ================= */}
        {/* Where FocusForge is Used */}
        <section className="w-full pt-20 pb-16 md:pt-[140px] md:pb-[120px] border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full">Ecosystem</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">🌍 Where FocusForge is Used</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">Designed for students, professionals, and teams who want AI-powered productivity.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {USE_CASES.map((useCase, index) => {
                const Icon = useCase.icon;
                return (
                  <motion.div
                    key={useCase.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`group p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between h-full ${useCase.border}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                            <Icon size={24} className="text-[var(--accent-primary)]" />
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/60">{useCase.badge}</span>
                        </div>
                        <h3 className="font-display font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-1">{useCase.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] font-medium mb-4">{useCase.subtitle}</p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">{useCase.description}</p>
                      </div>
                      <div className="border-t border-[var(--border-subtle)]/60 pt-4 flex flex-wrap gap-2 mt-auto">
                        {useCase.details.map((detail, dIdx) => (
                          <span key={dIdx} className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 ${detail.highlight ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20" : "bg-[var(--bg-primary)]/60 text-[var(--text-muted)] border border-[var(--border-subtle)]/40"}`}>
                            <Check size={10} className="shrink-0" /> {detail.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* User Roles */}
        <section className="w-full pt-20 pb-16 md:pt-[140px] md:pb-[120px] border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">Target Users</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">🎯 User Roles</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">Sleek systems engineered specifically for different styles of focus and workflow rules.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
              {USER_ROLES.map((role, index) => {
                const Icon = role.icon;
                return (
                  <motion.div
                    key={role.role}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`group p-6 rounded-2xl border backdrop-blur-[10px] transition-all duration-300 flex flex-col justify-between h-full ${role.color}`}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)]/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-center mb-5 shrink-0 group-hover:rotate-6 transition-transform">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white mb-0.5">{role.role}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-3">{role.subtitle}</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5">{role.description}</p>
                    </div>
                    <div className="border-t border-slate-200/60 dark:border-white/5 pt-4 space-y-2 mt-auto">
                      {role.points.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)] transition-colors">
                          <span className="text-[9px] mt-1 text-[var(--accent-primary)]">✦</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================ Product Impact (Telemetry Stats) ================ */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full">Telemetry Stats</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">📊 Product Impact</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">Track historical community results scaled across FocusForge guilds.</p>
            </motion.div>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 items-stretch">
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md text-center flex flex-col justify-between h-full">
                <h4 className="text-xs uppercase font-extrabold text-[var(--text-muted)] mb-4">Task Rate</h4>
                <div className="text-3xl font-extrabold text-[var(--accent-primary)] shadow-sm"><CountUp end={95} suffix="%" /></div>
                <p className="text-[9px] text-[var(--text-muted)] mt-4 border-t border-white/5 pt-2">Task Completion</p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md text-center flex flex-col justify-between h-full">
                <h4 className="text-xs uppercase font-extrabold text-[var(--text-muted)] mb-4">Focus Hours</h4>
                <div className="text-3xl font-extrabold text-cyan-400"><CountUp end={1200} suffix="+" /></div>
                <p className="text-[9px] text-[var(--text-muted)] mt-4 border-t border-white/5 pt-2">Deep Study logged</p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md text-center flex flex-col justify-between h-full">
                <h4 className="text-xs uppercase font-extrabold text-[var(--text-muted)] mb-4">XP Claimed</h4>
                <div className="text-3xl font-extrabold text-yellow-400"><CountUp end={500} suffix="K+" /></div>
                <p className="text-[9px] text-[var(--text-muted)] mt-4 border-t border-white/5 pt-2">XP Earned</p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md text-center flex flex-col justify-between h-full">
                <h4 className="text-xs uppercase font-extrabold text-[var(--text-muted)] mb-4">Recov. Plans</h4>
                <div className="text-3xl font-extrabold text-orange-400"><CountUp end={10} suffix="K+" /></div>
                <p className="text-[9px] text-[var(--text-muted)] mt-4 border-t border-white/5 pt-2">Recovery Missions</p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md text-center flex flex-col justify-between h-full">
                <h4 className="text-xs uppercase font-extrabold text-[var(--text-muted)] mb-4">AI Recs</h4>
                <div className="text-3xl font-extrabold text-pink-400"><CountUp end={50} suffix="K+" /></div>
                <p className="text-[9px] text-[var(--text-muted)] mt-4 border-t border-white/5 pt-2">AI Recommendations</p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md text-center flex flex-col justify-between h-full">
                <h4 className="text-xs uppercase font-extrabold text-[var(--text-muted)] mb-4">Guild Size</h4>
                <div className="text-3xl font-extrabold text-indigo-400">Growing</div>
                <p className="text-[9px] text-[var(--text-muted)] mt-4 border-t border-white/5 pt-2">Active Users</p>
              </div>
            </div>
          </div>
        </section>

        {/* SDG Alignment */}
        <section className="w-full pt-20 pb-16 md:pt-[140px] md:pb-[120px] border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.08] dark:bg-emerald-500/10 px-3 py-1 rounded-full">Global Impact</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">🌍 Sustainable Development Goals</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">Our platform actively synchronizes with key UN SDGs to deliver healthy, high-quality professional growth and wellness models.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {SDG_ITEMS.map((sdg, index) => {
                const SdgIcon = sdg.icon;
                return (
                  <motion.div
                    key={sdg.sdg}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`group p-6 rounded-2xl border backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between ${sdg.color}`}
                  >
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-white bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md">{sdg.sdg}</span>
                      <div className={`p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0 ${sdg.iconColor}`}><SdgIcon size={18} /></div>
                    </div>
                    <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-2">{sdg.title}</h3>
                    <p className="text-xs text-gray-700 dark:text-[var(--text-secondary)] leading-relaxed">{sdg.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================ Built With (Tech Stack) ================ */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">Tech Stack</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">🛠 Built With</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">The premium architecture that enables robust offline operations and low-latency rendering.</p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {TECH_STACK.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                  whileHover={{ scale: 1.03, rotate: 1 }}
                  className={`group p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${tech.glow}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-bold ${tech.color}`}>{tech.name}</span>
                    <span className="text-[8px] tracking-wider text-[var(--text-muted)] uppercase">Verified</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors leading-normal">{tech.category}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Market Opportunity */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">Prospects</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">📈 Market Opportunity</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">Harnessing macro forces in AI, remote work, and game-mechanic behavioral science.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
              {MARKET_STATS.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md relative overflow-hidden flex flex-col justify-between h-full hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300"
                >
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />
                  <div>
                    <h4 className="text-xs uppercase font-extrabold text-[var(--text-muted)] group-hover:text-purple-400 transition-colors mb-1">{stat.title}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] block mb-4">{stat.desc}</span>
                  </div>
                  <div className="my-5 flex items-baseline gap-1">
                    <CountUp end={stat.metric} suffix={stat.suffix} duration={1400} />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-normal border-t border-white/5 pt-3 mt-4">{stat.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Scalability Roadmap */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">Evolutionary Curve</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">🚀 Scalability Roadmap</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">The masterplan to expand gamified productivity across systems, mobile frameworks, and global organizations.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative">
              <div className="absolute top-[38px] left-8 right-8 h-0.5 bg-gradient-to-r from-[var(--accent-primary)] to-blue-500 opacity-30 hidden lg:block" />
              {ROADMAP_MILESTONES.map((stone, index) => (
                <motion.div
                  key={stone.platform}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`p-5 rounded-2xl border backdrop-blur-sm relative z-10 flex flex-col justify-between text-center lg:text-left h-full transition-all duration-300 ${
                    stone.active 
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_25px_rgba(31,164,99,0.25)] scale-105 lg:scale-110 z-20" 
                      : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 hover:border-slate-300 dark:hover:border-white/10"
                  }`}
                >
                  <div>
                    <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-3 ${stone.active ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]" : "bg-slate-100 dark:bg-white/5 text-[var(--text-muted)] border border-slate-200 dark:border-transparent"}`}>{stone.phase}</span>
                    <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white mb-1">{stone.platform}</h4>
                  </div>
                  <div className="mt-4 border-t border-slate-200/60 dark:border-white/5 pt-3">
                    <span className={`text-[10px] font-medium ${stone.active ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}>● {stone.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================ Pricing ================ */}
        <section className="w-full py-16 md:py-20 lg:py-28 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
            <div className="text-center mb-14">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full">Pricing</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mt-4 mb-4 tracking-tight">Start Forging for Free</h2>
              <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">Level up your productivity without breaking the bank. Upgrade when you need advanced AI features.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
               <PricingCard title="Novice" price="Free" desc="Perfect for students looking to fix their habits." features={["Smart To-Do List", "Focus Timer", "Basic Character Evolution", "Streak System"]} />
               <PricingCard title="Legend" price="$8" interval="/mo" desc="Advanced tools for competitive exams and heavy workloads." features={["Advanced AI Risk Planning", "Multiple Character Classes", "Analytics Dashboard", "Custom Study Room Environments", "Premium Evolutions"]} highlight />
            </div>
          </div>
        </section>

        {/* ================= Footer ================= */}
        {/* Creator Card */}
        <section className="w-full py-16 md:py-20 lg:py-24 border-t border-[var(--border-subtle)] relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold uppercase tracking-[4px] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full mb-8">Credits</span>
            <h3 className="text-[#8a8a95] font-bold uppercase mb-8 tracking-[6px] text-xs text-center">Created By</h3>
            <a 
              href="https://github.com/Karthikeyancse-coder" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Open Karthikeyan M's GitHub profile"
              className="relative w-[90%] md:w-[420px] h-[130px] group block rounded-[999px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-black transition-all duration-300" 
              style={{ animation: "float-card 5s ease-in-out infinite" }}
            >
              <div className="absolute inset-[-2px] rounded-[999px] overflow-hidden opacity-60 group-hover:opacity-95 transition-opacity duration-300" style={{ pointerEvents: "none" }}>
                <div className="absolute top-1/2 left-1/2 w-[130%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "conic-gradient(from 0deg, #1FA463, #22D3EE, #3B82F6, #8B5CF6, #EC4899, #FB923C, #1FA463)", animation: "rgb-rotate 10s infinite linear" }} />
              </div>
              <div className="absolute inset-0 sm:inset-[-20px] md:inset-[-30px] rounded-[999px] opacity-55 group-hover:opacity-80 blur-[12px] sm:blur-[18px] md:blur-[24px] transition-all duration-300" style={{ pointerEvents: "none" }}>
                <div className="absolute inset-0 rounded-[999px] overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 w-[130%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "conic-gradient(from 0deg, #1FA463, #22D3EE, #3B82F6, #8B5CF6, #EC4899, #FB923C, #1FA463)", animation: "rgb-rotate 10s infinite linear" }} />
                </div>
              </div>
              <div className="hidden sm:block absolute sm:inset-[-30px] md:inset-[-45px] rounded-[999px] opacity-40 group-hover:opacity-65 blur-[36px] group-hover:blur-[44px] transition-all duration-300" style={{ pointerEvents: "none" }}>
                <div className="absolute inset-0 rounded-[999px] overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 w-[130%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "conic-gradient(from 0deg, #1FA463, #22D3EE, #3B82F6, #8B5CF6, #EC4899, #FB923C, #1FA463)", animation: "rgb-rotate 10s infinite linear" }} />
                </div>
              </div>
              <div className="absolute inset-0 rounded-[999px] flex items-center p-4 pl-6 pr-8 md:pl-8 md:pr-10 border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.45)] transition-all duration-250 group-hover:-translate-y-[3px] group-hover:scale-[1.01]" style={{ backgroundColor: "rgba(18,18,20,0.82)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
                <div className="flex items-center gap-5 w-full">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full blur-[8px] bg-white/20" />
                    <img src="https://github.com/Karthikeyancse-coder.png" alt="Karthikeyan M" className="w-[58px] h-[58px] md:w-[72px] md:h-[72px] rounded-full border-2 border-white/20 object-cover relative z-10" />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <h4 className="text-[19px] sm:text-[24px] md:text-[29px] font-extrabold text-white leading-tight whitespace-nowrap">Karthikeyan M</h4>
                    <p className="text-[11px] sm:text-[13px] md:text-[14px] text-white/65 font-medium truncate">Full Stack Developer • AI Engineer</p>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-6 md:py-8 relative z-20">
         <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 opacity-80 justify-center sm:justify-start">
              <FocusForgeLogo size={28} variant="gradient" className="opacity-90" />
              <span className="font-display font-bold text-lg tracking-tight text-[var(--text-primary)]">FocusForge AI</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] w-full sm:w-auto text-center sm:text-right">© 2026 FocusForge. Built for focus, forged for legends.</p>
         </div>
      </footer>
    </div>
  );
}

// ==========================================
// REUSABLE PIECES
// ==========================================
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center mb-6">{icon}</div>
      <h3 className="font-display font-bold text-xl mb-3">{title}</h3>
      <p className="text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

function StepBlock({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl font-display font-black text-[var(--accent-primary)] mb-6 shadow-sm">{number}</div>
      <h3 className="text-xl font-bold font-display mb-3">{title}</h3>
      <p className="text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

function ClassItem({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl shrink-0">{icon}</div>
      <div>
        <h4 className="font-bold text-[var(--text-primary)]">{name}</h4>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function PricingCard({ title, price, interval, desc, features, highlight = false }: { title: string; price: string; interval?: string; desc: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`p-8 rounded-3xl border ${highlight ? "border-[var(--accent-primary)] bg-[var(--bg-secondary)] shadow-[0_0_30px_var(--xp-glow)]" : "border-[var(--border-subtle)] bg-[var(--bg-primary)]"} flex flex-col relative`}>
      {highlight && <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider font-sans">Most Popular</div>}
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
        <Button variant={highlight ? "default" : "outline"} className="w-full rounded-2xl h-12 text-base">{highlight ? "Get Started" : "Start Free"}</Button>
      </Link>
    </div>
  );
}

function ToolkitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] transition-all duration-300 flex flex-col items-start text-left">
      <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 shadow-sm">{icon}</div>
      <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}
