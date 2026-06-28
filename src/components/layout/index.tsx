import React, { useState, useEffect, useRef } from "react";
import avatarImage from "../../assets/images/regenerated_image_1782639023135.jpg";
import {
  Outlet,
  NavLink,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Swords,
  UserCircle,
  Sun,
  Moon,
  LogOut,
  Calendar,
  Activity,
  ShieldAlert,
  Crosshair,
  Bot,
  Users,
  BarChart2,
  Home,
  Timer,
  Grid,
  X,
  Trophy,
  Sparkles,
  AlertCircle,
  Bell,
} from "lucide-react";
import { useTheme } from "../theme-provider";
import { useUser } from "../../context/UserContext";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import AICommandBubble from "../AICommandBubble";
import { Button } from "../ui/button";

const parseMessage = (msg: string) => {
  if (msg.includes(" — ")) {
    const parts = msg.split(" — ");
    return { title: parts[0], body: parts[1] };
  }
  if (msg.includes(": ")) {
    const parts = msg.split(": ");
    const secondPart = parts[1];
    const splitIndex = secondPart.search(/[.!]/);
    if (splitIndex !== -1 && splitIndex < secondPart.length - 1) {
      return {
        title: `${parts[0]}: ${secondPart.substring(0, splitIndex + 1).trim()}`,
        body: secondPart.substring(splitIndex + 1).trim()
      };
    }
    return { title: parts[0], body: parts[1] };
  }
  const splitIndex = msg.search(/[.!]/);
  if (splitIndex !== -1 && splitIndex < msg.length - 1) {
    return {
      title: msg.substring(0, splitIndex + 1).trim(),
      body: msg.substring(splitIndex + 1).trim()
    };
  }
  return { title: "Mission Alert", body: msg };
};

export default function Layout() {
  const { theme, setTheme } = useTheme();
  const { userState, reminders, dismissReminder, loadDemoData } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showOtherSheet, setShowOtherSheet] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const prevLevelRef = useRef(userState.level);

  const [isMobileView, setIsMobileView] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const sentNotificationsRef = useRef<Set<string>>(new Set());
  const activeNotificationRef = useRef<Notification | null>(null);
  const activeNotificationsMapRef = useRef<Record<string, Notification>>({});

  interface NotificationHistoryItem {
    id: string;
    title: string;
    body: string;
    timestamp: number;
    priority: "Green" | "Blue" | "Orange" | "Red";
    read: boolean;
    taskId?: string;
  }

  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mobile_notification_history");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mobile_notification_history", JSON.stringify(notificationHistory));
    }
  }, [notificationHistory]);

  const mapPriority = (tier: string, subTier?: string): "Green" | "Blue" | "Orange" | "Red" => {
    if (subTier === "Critical" || tier === "Red") return "Red";
    if (tier === "Yellow") return "Orange";
    if (tier === "Green") return "Green";
    return "Blue";
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const isMobile = window.innerWidth < 768;
      if (isMobile && Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          setPermissionState(perm);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!isMobileView) return;
    if (!reminders || reminders.length === 0) return;

    // Check Quiet Hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMins = currentHour * 60 + currentMinute;

    const quietStartStr = localStorage.getItem("quiet_hours_start") || "22:00";
    const quietEndStr = localStorage.getItem("quiet_hours_end") || "07:00";
    const quietEnabled = localStorage.getItem("quiet_hours_enabled") === "true";

    const [sH, sM] = quietStartStr.split(":").map(Number);
    const [eH, eM] = quietEndStr.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    let isQuietHours = false;
    if (quietEnabled) {
      if (startMins <= endMins) {
        isQuietHours = currentTimeInMins >= startMins && currentTimeInMins <= endMins;
      } else {
        isQuietHours = currentTimeInMins >= startMins || currentTimeInMins <= endMins;
      }
    }

    const isGroupingEnabled = localStorage.getItem("notification_grouping") !== "false";

    // Track analytics helper
    const trackNotificationEvent = (eventId: string, eventType: string) => {
      try {
        const stored = localStorage.getItem("notification_analytics_log") || "[]";
        const logs = JSON.parse(stored);
        logs.push({
          id: eventId,
          event: eventType,
          timestamp: Date.now()
        });
        localStorage.setItem("notification_analytics_log", JSON.stringify(logs));
      } catch (e) {
        console.error("Failed to write notification analytics:", e);
      }
    };

    // Filter unprocessed reminders
    const newReminders = reminders.filter(r => !sentNotificationsRef.current.has(r.id));
    if (newReminders.length === 0) return;

    // Filter by Quiet Hours (only let Red/Critical alerts through during Quiet Hours)
    const eligibleReminders = newReminders.filter(rem => {
      const priority = mapPriority(rem.tier, rem.subTier);
      const isCritical = priority === "Red";
      if (isQuietHours && !isCritical) {
        trackNotificationEvent(rem.id, "Ignored");
        return false;
      }
      return true;
    });

    if (eligibleReminders.length === 0) return;

    // Separate by type
    const tasks = eligibleReminders.filter(r => r.taskId || r.message.toLowerCase().includes("task") || r.message.toLowerCase().includes("deadline") || r.message.toLowerCase().includes("mission"));
    const habits = eligibleReminders.filter(r => r.message.toLowerCase().includes("habit"));
    const focus = eligibleReminders.filter(r => r.message.toLowerCase().includes("focus") || r.message.toLowerCase().includes("session"));
    const rest = eligibleReminders.filter(r => !tasks.includes(r) && !habits.includes(r) && !focus.includes(r));

    interface TriggerItem {
      id: string;
      title: string;
      body: string;
      taskId?: string;
      priority: "Green" | "Blue" | "Orange" | "Red";
      constituentIds: string[];
      deepLink: string;
    }

    const finalTriggers: TriggerItem[] = [];

    if (isGroupingEnabled) {
      if (tasks.length > 1) {
        finalTriggers.push({
          id: `grouped-tasks-${Date.now()}`,
          title: "FocusForge Tasks Update",
          body: `You have ${tasks.length} tasks due today. Tap to open missions.`,
          priority: "Orange",
          constituentIds: tasks.map(t => t.id),
          deepLink: "/app/tasks",
        });
      } else if (tasks.length === 1) {
        const r = tasks[0];
        const parsed = parseMessage(r.message);
        finalTriggers.push({
          id: r.id,
          title: parsed.title,
          body: parsed.body,
          taskId: r.taskId,
          priority: mapPriority(r.tier, r.subTier),
          constituentIds: [r.id],
          deepLink: r.taskId ? `/app/tasks?taskId=${r.taskId}` : "/app/tasks",
        });
      }

      if (habits.length > 1) {
        finalTriggers.push({
          id: `grouped-habits-${Date.now()}`,
          title: "FocusForge Habits Alert",
          body: `You have ${habits.length} habits waiting. Keep your streak alive!`,
          priority: "Blue",
          constituentIds: habits.map(h => h.id),
          deepLink: "/app",
        });
      } else if (habits.length === 1) {
        const r = habits[0];
        const parsed = parseMessage(r.message);
        finalTriggers.push({
          id: r.id,
          title: parsed.title,
          body: parsed.body,
          priority: mapPriority(r.tier, r.subTier),
          constituentIds: [r.id],
          deepLink: "/app",
        });
      }

      if (focus.length > 1) {
        finalTriggers.push({
          id: `grouped-focus-${Date.now()}`,
          title: "Focus Sessions Update",
          body: `${focus.length} focus sessions are active. Ready to dive in?`,
          priority: "Green",
          constituentIds: focus.map(f => f.id),
          deepLink: "/app/training",
        });
      } else if (focus.length === 1) {
        const r = focus[0];
        const parsed = parseMessage(r.message);
        finalTriggers.push({
          id: r.id,
          title: parsed.title,
          body: parsed.body,
          priority: mapPriority(r.tier, r.subTier),
          constituentIds: [r.id],
          deepLink: "/app/training",
        });
      }

      rest.forEach(r => {
        const parsed = parseMessage(r.message);
        finalTriggers.push({
          id: r.id,
          title: parsed.title,
          body: parsed.body,
          priority: mapPriority(r.tier, r.subTier),
          constituentIds: [r.id],
          deepLink: "/app",
        });
      });
    } else {
      eligibleReminders.forEach(r => {
        const parsed = parseMessage(r.message);
        finalTriggers.push({
          id: r.id,
          title: parsed.title,
          body: parsed.body,
          taskId: r.taskId,
          priority: mapPriority(r.tier, r.subTier),
          constituentIds: [r.id],
          deepLink: r.taskId ? `/app/tasks?taskId=${r.taskId}` : "/app",
        });
      });
    }

    // Now send the native notifications
    finalTriggers.forEach((trig) => {
      // Mark constituent IDs as processed
      trig.constituentIds.forEach(id => sentNotificationsRef.current.add(id));

      setNotificationHistory((prevHistory) => {
        const newItem: NotificationHistoryItem = {
          id: trig.id,
          title: trig.title,
          body: trig.body,
          timestamp: Date.now(),
          priority: trig.priority,
          read: false,
          taskId: trig.taskId,
        };
        return [newItem, ...prevHistory];
      });

      // Trigger the local notification
      if (typeof window !== "undefined" && "Notification" in window && permissionState === "granted") {
        const isCritical = trig.priority === "Red";

        if ("vibrate" in navigator) {
          navigator.vibrate(isCritical ? [200, 100, 200] : [100]);
        }

        try {
          const notification = new Notification(trig.title, {
            body: trig.body,
            icon: "/icon.png",
            tag: trig.id,
            requireInteraction: isCritical,
          });

          // Track delivery
          trackNotificationEvent(trig.id, "Delivered");

          activeNotificationsMapRef.current[trig.id] = notification;

          notification.onclick = (e) => {
            e.preventDefault();
            window.focus();

            // Track opened
            trackNotificationEvent(trig.id, "Opened");

            // Dismiss all matching original reminders in application state
            trig.constituentIds.forEach(id => dismissReminder(id));

            // Mark as read in silent log
            setNotificationHistory(prev =>
              prev.map(item => item.id === trig.id ? { ...item, read: true } : item)
            );

            // Navigate & deep-link
            navigate(trig.deepLink);

            notification.close();
            delete activeNotificationsMapRef.current[trig.id];
          };

          notification.onclose = () => {
            delete activeNotificationsMapRef.current[trig.id];
          };
        } catch (err) {
          console.error("Error triggering native notification:", err);
        }
      }
    });
  }, [reminders, isMobileView, permissionState, navigate, dismissReminder]);

  // Clean up notifications that are no longer present in active reminders list
  useEffect(() => {
    if (!isMobileView) return;
    if (!reminders) return;

    const activeLocalIds = Object.keys(activeNotificationsMapRef.current);
    activeLocalIds.forEach(id => {
      if (id.startsWith("grouped-")) {
        const type = id.split("-")[1];
        let stillActive = false;
        if (type === "tasks") {
          stillActive = reminders.some(r => r.taskId || r.message.toLowerCase().includes("task") || r.message.toLowerCase().includes("deadline") || r.message.toLowerCase().includes("mission"));
        } else if (type === "habits") {
          stillActive = reminders.some(r => r.message.toLowerCase().includes("habit"));
        } else if (type === "focus") {
          stillActive = reminders.some(r => r.message.toLowerCase().includes("focus") || r.message.toLowerCase().includes("session"));
        }
        if (!stillActive) {
          activeNotificationsMapRef.current[id]?.close();
          delete activeNotificationsMapRef.current[id];
        }
      } else {
        const stillExists = reminders.some(r => r.id === id);
        if (!stillExists) {
          activeNotificationsMapRef.current[id]?.close();
          delete activeNotificationsMapRef.current[id];
        }
      }
    });
  }, [reminders, isMobileView]);

  // Check if current route is one of the 'Other' items
  const otherRoutes = [
    "/app/reality-sync",
    "/app/risk-center",
    "/app/recovery",
    "/app/analytics",
    "/app/calendar",
    "/app/workspaces",
    "/app/leaderboard",
  ];
  const isOtherActive = otherRoutes.some((r) => location.pathname === r);

  useEffect(() => {
    if (userState.level > prevLevelRef.current) {
      setShowLevelUp(true);
      const t = setTimeout(() => setShowLevelUp(false), 4000);
      return () => clearTimeout(t);
    }
    prevLevelRef.current = userState.level;
  }, [userState.level]);

  const handleSignOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-[var(--bg-secondary)] overflow-hidden relative">
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-[var(--bg-elevated)] border-2 border-[var(--streak-flame)] rounded-3xl p-10 text-center shadow-[0_0_80px_var(--streak-flame)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--streak-flame)]/20 to-transparent"></div>
              <div className="w-[300px] h-[300px] mx-auto mb-6 rounded-2xl overflow-hidden border border-[var(--streak-flame)] relative bg-black/40 flex flex-col items-center justify-center">
                {/* Glowing radial background aura */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--streak-flame)_0%,transparent_70%)] opacity-30 animate-pulse" />
                
                {/* Cybernetic rotating rings */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute w-56 h-56 border-2 border-dashed border-[var(--streak-flame)]/40 rounded-full flex items-center justify-center"
                />
                
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  className="absolute w-48 h-48 border border-double border-[var(--streak-flame)]/60 rounded-full flex items-center justify-center"
                />

                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute w-40 h-40 border border-dashed border-[var(--accent-primary)]/50 rounded-full"
                />

                {/* Shimmering float particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 200 - 100, 
                      y: 120, 
                      opacity: 0, 
                      scale: Math.random() * 0.5 + 0.5 
                    }}
                    animate={{ 
                      y: -120, 
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1, 0.8, 0.2]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: Math.random() * 3 + 2, 
                      delay: Math.random() * 2,
                      ease: "easeInOut" 
                    }}
                    className="absolute w-1.5 h-1.5 bg-[var(--streak-flame)] rounded-full shadow-[0_0_8px_var(--streak-flame)]"
                  />
                ))}

                {/* Core Hologram / Trophy Badge */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 4, 
                    ease: "easeInOut" 
                  }}
                  className="relative z-10 w-28 h-28 bg-gradient-to-br from-yellow-400/20 via-[var(--streak-flame)]/10 to-transparent border-2 border-[var(--streak-flame)] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.3)] backdrop-blur-sm"
                >
                  <Trophy size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
                  
                  {/* Absolute corners or decorative tech edges */}
                  <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-[var(--streak-flame)]" />
                  <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-[var(--streak-flame)]" />
                  <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-[var(--streak-flame)]" />
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-[var(--streak-flame)]" />
                </motion.div>

                {/* Floating sparkles around core */}
                <motion.div
                  animate={{ 
                    opacity: [0.4, 1, 0.4],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute top-16 left-16 z-20 text-yellow-400"
                >
                  <Sparkles size={16} />
                </motion.div>
                
                <motion.div
                  animate={{ 
                    opacity: [0.3, 0.9, 0.3],
                    scale: [1.2, 0.8, 1.2]
                  }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-16 right-16 z-20 text-[var(--accent-primary)]"
                >
                  <Sparkles size={20} />
                </motion.div>
              </div>
              <h2 className="text-4xl font-black text-[var(--text-primary)] font-display uppercase italic mb-2 relative z-10">
                LEVEL UP!
              </h2>
              <p className="text-xl font-bold text-[var(--text-secondary)] mb-2 relative z-10">
                You reached Level {userState.level}
              </p>
              <p className="text-sm text-[var(--accent-primary)] font-bold tracking-widest uppercase relative z-10">
                + Class Evolution Unlocked!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex-col items-center py-8 relative z-[60]">
        <Link 
          to="/"
          className="flex items-center gap-3 mb-12 px-6 w-full hover:opacity-[0.95] hover:scale-[1.02] transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg"
          aria-label="Go to Landing Page"
        >
          <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
            <span className="text-white font-bold font-display">F</span>
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight">
            FocusForge
          </h1>
        </Link>

        <nav className="flex-1 w-full px-4 space-y-2 overflow-y-auto">
          <NavItem
            to="/app"
            end
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem
            to="/app/tasks"
            icon={<CheckSquare size={20} />}
            label="Quests"
          />
          <NavItem
            to="/app/workspaces"
            icon={<Users size={20} />}
            label="Workspaces"
          />
          <NavItem
            to="/app/reality-sync"
            icon={<Activity size={20} />}
            label="Reality Sync"
          />
          <NavItem
            to="/app/risk-center"
            icon={<ShieldAlert size={20} />}
            label="Risk Center"
          />
          <NavItem
            to="/app/recovery"
            icon={<Crosshair size={20} />}
            label="Recovery Missions"
          />
          <NavItem
            to="/app/training"
            icon={<Swords size={20} />}
            label="Training"
          />
          <NavItem
            to="/app/calendar"
            icon={<Calendar size={20} />}
            label="Calendar"
          />
          <NavItem
            to="/app/analytics"
            icon={<BarChart2 size={20} />}
            label="Analytics"
          />
          <NavItem
            to="/app/character"
            icon={<UserCircle size={20} />}
            label="Character"
          />
          <NavLink 
            to="/app/leaderboard" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-2 rounded-xl transition-all font-semibold ${isActive ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <Trophy size={18} />
            Leaderboard
          </NavLink>
        </nav>

        <div className="w-full px-4 mt-auto mb-4 space-y-4">
          {/* Global controls */}
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-sm">
            <div className="flex items-center gap-2" title="Active Streak">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-bold font-mono text-[var(--streak-flame)]">
                {userState.streakCount}
              </span>
            </div>
            <div className="w-px h-4 bg-[var(--border-subtle)]"></div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-[2px] rounded-full"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Profile Section */}
          <div
            onClick={() => navigate("/app/profile")}
            className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)]/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] overflow-hidden">
                <img
                  src={avatarImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {userState.name}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Lvl {userState.level} • {userState.characterClass}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--risk-high)] hover:bg-[var(--risk-high)]/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-root-bg flex-1 flex flex-col h-full relative overflow-hidden p-4 pb-24 md:pb-6 md:p-6 lg:p-8">
        {/* Page Content */}
        <div className="z-10 flex-1 w-full max-w-[1400px] mx-auto flex flex-col relative bg-[var(--bg-primary)] rounded-[2.5rem] overflow-y-auto no-scrollbar shadow-2xl border border-[var(--border-subtle)]">
          <Outlet />
        </div>

        {/* Global Reminders */}
        {/* Collapsible Notification Center */}
        <div className="hidden md:flex fixed bottom-[96px] right-6 z-[70] flex-col items-end gap-3 pointer-events-none">
          <AnimatePresence>
            {showNotifications && reminders && reminders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 max-h-[50vh] md:max-h-[420px] overflow-y-auto no-scrollbar pointer-events-auto p-2"
              >
                <AnimatePresence>
                  {reminders.map((rem) => (
                    <motion.div
                      key={rem.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`p-3 lg:p-4 pl-[17px] rounded-xl shadow-xl w-72 lg:w-80 relative overflow-hidden backdrop-blur-md border transition-all shrink-0 ${
                        rem.subTier === "Critical" ? "border-red-500 bg-red-950/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-1 ring-red-500/50" 
                        : rem.tier === "Red" ? "border-red-500/50 bg-red-500/10" 
                        : rem.tier === "Green" ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-amber-500/50 bg-amber-500/10"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold leading-tight ${rem.subTier === "Critical" ? "text-red-400" : rem.tier === "Red" ? "text-red-500" : rem.tier === "Green" ? "text-emerald-500" : "text-amber-500"}`}
                      >
                        {rem.message}
                      </p>
                      {rem.tier === "Green" && (
                        <button
                          onClick={() => dismissReminder(rem.id)}
                          className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        onClick={() => {
                          dismissReminder(rem.id);
                          navigate("/app/training");
                        }}
                        className={`w-full mt-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-white ${rem.tier === "Red" ? "bg-red-500 hover:bg-red-600" : rem.tier === "Green" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}`}
                      >
                        Focus Now
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {reminders && reminders.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-2xl bg-[#e34646] border border-[var(--border-subtle)] text-[var(--text-primary)] pointer-events-auto transition-colors"
            >
              {showNotifications ? <X size={20} className="text-[#f7faff]" /> : <span className="text-[15px] font-bold border-[#caccda] text-[#f7faff]">{reminders.length}</span>}
            </motion.button>
          )}
        </div>

        {/* Mobile Notification History Drawer Removed */}

        <AICommandBubble />
      </main>

      {/* Mobile "Other" Sheet Overlay */}
      <AnimatePresence>
        {showOtherSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOtherSheet(false)}
            className="md:hidden fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex flex-col justify-end pb-[70px]"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-[var(--border-subtle)] rounded-full mx-auto my-3" />
              <div className="px-4 pb-6 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                <SheetItem
                  to="/app/reality-sync"
                  icon={<Activity size={20} />}
                  label="Reality Sync"
                  onClick={() => setShowOtherSheet(false)}
                />
                <SheetItem
                  to="/app/risk-center"
                  icon={<ShieldAlert size={20} />}
                  label="Risk Center"
                  onClick={() => setShowOtherSheet(false)}
                />
                <SheetItem
                  to="/app/recovery"
                  icon={<Crosshair size={20} />}
                  label="Recovery Missions"
                  onClick={() => setShowOtherSheet(false)}
                />
                <SheetItem
                  to="/app/analytics"
                  icon={<BarChart2 size={20} />}
                  label="AI Command Center"
                  onClick={() => setShowOtherSheet(false)}
                />
                <SheetItem
                  to="/app/calendar"
                  icon={<Calendar size={20} />}
                  label="Calendar"
                  onClick={() => setShowOtherSheet(false)}
                />
                <SheetItem
                  to="/app/workspaces"
                  icon={<Users size={20} />}
                  label="Workspaces"
                  onClick={() => setShowOtherSheet(false)}
                />
                <SheetItem
                  to="/app/leaderboard"
                  icon={<Trophy size={20} />}
                  label="Leaderboard"
                  onClick={() => setShowOtherSheet(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 px-4 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <MobileNavItem
          to="/app"
          end
          icon={<LayoutDashboard size={24} />}
          label="Dashboard"
        />
        <MobileNavItem
          to="/app/tasks"
          icon={<CheckSquare size={24} />}
          label="Quests"
        />
        <MobileNavItem
          to="/app/training"
          icon={<Swords size={24} />}
          label="Training"
        />

        <button
          onClick={() => setShowOtherSheet(!showOtherSheet)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 transition-colors",
            isOtherActive
              ? "text-[var(--accent-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          )}
        >
          <Grid size={24} />
          <span className="text-[10px] font-medium">Other</span>
        </button>

        <MobileNavItem
          to="/app/profile"
          icon={<UserCircle size={24} />}
          label="Profile"
        />
      </div>
    </div>
  );
}

function MobileNavItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 transition-colors",
          isActive
            ? "text-[var(--accent-primary)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

function SheetItem({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-semibold transition-all",
          isActive
            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
            : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
        )
      }
    >
      <div className={cn("p-2 rounded-lg", "bg-[var(--bg-primary)] shadow-sm")}>
        {icon}
      </div>
      {label}
    </NavLink>
  );
}

function NavItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
          isActive
            ? "bg-[var(--bg-elevated)] text-[var(--accent-primary)] border border-[var(--border-subtle)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
