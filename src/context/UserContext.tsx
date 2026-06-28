import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Task, UserState, Habit } from "../types";
import { calculateTaskMetrics } from "../lib/engine";
import { db } from "../lib/firebase";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export interface Reminder {
  id: string;
  taskId: string;
  message: string;
  tier: "Green" | "Yellow" | "Red";
  subTier?: "High" | "Critical";
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'create' | 'update' | 'complete' | 'delete' | 'schedule';
}

interface UserContextType {
  userState: UserState;
  tasks: Task[];
  habits: Habit[];
  reminders: Reminder[];
  dismissReminder: (id: string) => void;
  updateBusyBlocks: (blocks: { start: string; end: string }[]) => void;
  updateTaskPlannedBlocks: (
    taskId: string,
    blocks: { start: string; end: string }[],
  ) => void;
  addFocusSession: (
    taskId: string,
    durationMinutes: number,
    sessionDate?: string,
  ) => void;
  confirmTaskProgress: (taskId: string, confirmedPercent: number) => void;
  updateProfile: (name: string) => void;
  addTask: (task: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addHabit: (habit: Partial<Habit>) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  completeHabit: (habitId: string) => void;
  toggleHabitDate: (habitId: string, dateStr: string) => void;
  acceptRecoveryPlan: (taskId: string, plan: any) => void;
  confirmRetroactiveTask: (
    taskId: string,
    when: string,
    durationStr: string,
  ) => void;
  updateUserState: (updates: Partial<UserState>) => void;
  completeOnboarding: () => void;
  loadDemoData: () => void;
  activities: ActivityLog[];
  addActivity: (title: string, description: string, type: 'create' | 'update' | 'complete' | 'delete' | 'schedule', taskId?: string) => void;
}

const defaultUserState: UserState = {
  id: "u_" + Math.random().toString(36).substring(2, 10),
  name: "Alex Student",
  xp: 2850,
  level: 14,
  streakCount: 12,
  forgivenessWindowOpenUntil: new Date(
    new Date().setHours(10, 0, 0, 0) + 24 * 60 * 60 * 1000,
  ).toISOString(),
  historicalLagByCategory: { Academic: 95, Career: 20 },
  busyBlocks: [],
  characterClass: "Cyber Samurai",
  tasksCompletedToday: 0,
  focusMinutesToday: 0,
  hasSeenOnboarding: false,
};

const getInThreeDays = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString();
};

const defaultTasks: Task[] = [
  {
    id: "t1",
    title: "Final Year Project",
    description:
      "Develop the core backend architecture and present the findings to the thesis committee. Critical graduation requirement.",
    category: "Academic",
    deadline: getInThreeDays(),
    estimatedEffortHours: 48,
    importance: {
      aiSuggested: "Critical",
      userOverride: null,
      final: "Critical",
    },
    plannedState: {
      expectedProgressCurve: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          expectedPercent: 0,
        },
        { date: getInThreeDays(), expectedPercent: 100 },
      ],
      plannedWorkBlocks: [
        {
          start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
          end: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
        },
      ],
    },
    realityState: {
      confirmedPercent: 0,
      inferredPercent: 15,
      effectivePercent: 15,
      lastConfirmedAt: null,
      focusSessions: [],
      completedAt: null,
      completedRetroactively: false,
    },
    riskEngine: {
      riskScore: 0,
      riskTier: "Green",
      breakdown: {
        progressGap: 0,
        urgency: 0,
        historicalLagBias: 0,
        workloadDensity: 0,
      },
      completionProbability: 1,
      uncertaintyFlag: true,
    },
    priorityScore: 0,
    recoveryPlan: {
      status: "none",
      proposedSchedule: null,
      extensionDraft: null,
    },
  },
  {
    id: "t2",
    title: "Operating Systems Assignment",
    description:
      "Write the memory management module in C and submit the test suite outputs to the autograder.",
    category: "Academic",
    deadline: new Date(
      new Date().getTime() + 10 * 60 * 60 * 1000,
    ).toISOString(),
    estimatedEffortHours: 12,
    importance: { aiSuggested: "High", userOverride: null, final: "High" },
    plannedState: {
      expectedProgressCurve: [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expectedPercent: 0,
        },
        {
          date: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
          expectedPercent: 100,
        },
      ],
      plannedWorkBlocks: [],
    },
    realityState: {
      confirmedPercent: 0,
      inferredPercent: 10,
      effectivePercent: 10,
      lastConfirmedAt: null,
      focusSessions: [],
      completedAt: null,
      completedRetroactively: false,
    },
    riskEngine: {
      riskScore: 0,
      riskTier: "Green",
      breakdown: {
        progressGap: 0,
        urgency: 0,
        historicalLagBias: 0,
        workloadDensity: 0,
      },
      completionProbability: 1,
      uncertaintyFlag: true,
    },
    priorityScore: 0,
    recoveryPlan: {
      status: "none",
      proposedSchedule: null,
      extensionDraft: null,
    },
  },
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userState, setUserState] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem("focusforge-user-v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultUserState;
  });

  const [rawTasks, setRawTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem("focusforge-tasks-v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultTasks;
  });

  const [rawHabits, setRawHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem("focusforge-habits-v3");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem("focusforge-activities-v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("focusforge-activities-v2", JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem("focusforge-habits-v3", JSON.stringify(rawHabits));
  }, [rawHabits]);

  useEffect(() => {
    localStorage.setItem("focusforge-tasks-v2", JSON.stringify(rawTasks));
  }, [rawTasks]);

  const addActivity = (title: string, description: string, type: 'create' | 'update' | 'complete' | 'delete' | 'schedule', taskId?: string) => {
    const newLog: ActivityLog = {
      id: "act_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      taskId,
      title,
      description,
      timestamp: new Date().toISOString(),
      type
    };
    setActivities(prev => [newLog, ...prev].slice(0, 50));
  };

  // Always run tasks through the Risk/Priority engines on render
  const tasks = useMemo(() => {
    return rawTasks
      .map((t) => calculateTaskMetrics(t, userState, rawTasks))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [rawTasks, userState]);

  const habits = rawHabits;

  useEffect(() => {
    localStorage.setItem("focusforge-user-v2", JSON.stringify(userState));
  }, [userState]);

  useEffect(() => {
    const now = new Date();
    if (
      userState.forgivenessWindowOpenUntil &&
      new Date(userState.forgivenessWindowOpenUntil) < now
    ) {
      setUserState((prev) => ({
        ...prev,
        streakCount: 0,
        tasksCompletedToday: 0,
        focusMinutesToday: 0,
        forgivenessWindowOpenUntil: new Date(
          new Date().setHours(10, 0, 0, 0) + 24 * 60 * 60 * 1000,
        ).toISOString(),
      }));
    } else if (
      userState.forgivenessWindowOpenUntil &&
      new Date(userState.forgivenessWindowOpenUntil).getDate() ===
        now.getDate() &&
      new Date(userState.forgivenessWindowOpenUntil).getMonth() ===
        now.getMonth() &&
      new Date(userState.forgivenessWindowOpenUntil).getFullYear() ===
        now.getFullYear()
    ) {
      setUserState((prev) => ({
        ...prev,
        tasksCompletedToday: 0,
        focusMinutesToday: 0,
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("focusforge-tasks-v2", JSON.stringify(rawTasks));
  }, [rawTasks]);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const dismissReminder = (id: string) =>
    setReminders((p) => p.filter((r) => r.id !== id));

  const tasksRef = React.useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    const lastReminderProgress = new Map<string, number>();

    // Run check every 15 seconds to be easily testable live
    const interval = setInterval(() => {
      setReminders((prev) => {
        const newReminders = [...prev];
        tasksRef.current.forEach((task) => {
          if (task.workspaceId) return; // Ignore workspace tasks completely in reminder engine
          if (task.realityState.effectivePercent >= 100) return;
          if (!task.deadline) return; // Just in case, skip if no deadline

          const lastPerc = lastReminderProgress.get(task.id) || 0;
          const currentPerc = task.realityState.inferredPercent;

          // Skip if meaningful progress logged (e.g. > 2%)
          if (currentPerc > lastPerc + 2) {
            lastReminderProgress.set(task.id, currentPerc);
            return;
          }

          const nowMs = new Date().getTime();
          const dMs = task.deadline.includes("T")
            ? new Date(task.deadline).getTime()
            : new Date(`${task.deadline}T23:59:59`).getTime();
          const daysUntilDeadline = (dMs - nowMs) / (1000 * 60 * 60 * 24);

          if (daysUntilDeadline > 7) {
            return;
          }

          if (
            task.riskEngine.riskTier === "Red" ||
            task.riskEngine.riskTier === "Yellow" ||
            task.riskEngine.riskTier === "Green"
          ) {
            lastReminderProgress.set(task.id, currentPerc);
            let targetSubTier: "High" | "Critical" | undefined = undefined;
            if (task.riskEngine.riskTier === "Red") {
              targetSubTier =
                task.riskEngine.riskScore >= 85 ? "Critical" : "High";
            }

            const existingIdx = newReminders.findIndex(
              (r) => r.taskId === task.id,
            );
            if (
              existingIdx >= 0 &&
              newReminders[existingIdx].tier === task.riskEngine.riskTier &&
              newReminders[existingIdx].subTier === targetSubTier
            ) {
              return;
            }
            if (existingIdx >= 0) {
              newReminders.splice(existingIdx, 1);
            }

            const trimmedTitle = task.title.trim();

            if (task.riskEngine.riskTier === "Red") {
              if (targetSubTier === "Critical") {
                const hoursLeft = Math.max(0, (dMs - nowMs) / (1000 * 60 * 60));

                const effortLogged =
                  task.realityState.focusSessions.reduce(
                    (acc, s) => acc + s.durationMinutes,
                    0,
                  ) / 60;
                const effortNeeded = Math.max(
                  0,
                  task.estimatedEffortHours - effortLogged,
                );

                newReminders.push({
                  id: "rem_" + Date.now() + Math.random(),
                  taskId: task.id,
                  message: `This needs to start now — you have ${hoursLeft.toFixed(1)} hours and need ${effortNeeded.toFixed(1)} hours of work.`,
                  tier: "Red",
                  subTier: "Critical",
                });
              } else {
                newReminders.push({
                  id: "rem_" + Date.now() + Math.random(),
                  taskId: task.id,
                  message: `You're behind schedule — start today.`,
                  tier: "Red",
                  subTier: "High",
                });
              }
            } else if (task.riskEngine.riskTier === "Yellow") {
              newReminders.push({
                id: "rem_" + Date.now() + Math.random(),
                taskId: task.id,
                message: `Nudge: "${trimmedTitle}" is falling behind. Consider starting a focus session soon.`,
                tier: "Yellow",
              });
            } else if (task.riskEngine.riskTier === "Green") {
              newReminders.push({
                id: "rem_" + Date.now() + Math.random(),
                taskId: task.id,
                message: `Nudge: "${trimmedTitle}" could use some attention.`,
                tier: "Green",
              });
            }
          }
        });
        return newReminders;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateBusyBlocks = (blocks: { start: string; end: string }[]) => {
    setUserState((prev) => ({ ...prev, busyBlocks: blocks }));
  };

  const updateTaskPlannedBlocks = (
    taskId: string,
    blocks: { start: string; end: string }[],
  ) => {
    let taskToUpdate: Task | undefined;
    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          taskToUpdate = t;
          const updated = {
            ...t,
            plannedState: {
              ...t.plannedState,
              plannedWorkBlocks: blocks,
            },
          };
          return updated;
        }
        return t;
      }),
    );
    if (taskToUpdate) {
      addActivity(
        "Task Scheduled",
        `Rearranged scheduled work blocks for "${taskToUpdate.title}"`,
        "schedule",
        taskId
      );
    }
  };

  const addFocusSession = (
    taskId: string,
    durationMinutes: number,
    sessionDate?: string,
  ) => {
    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        const newSessions = [
          ...t.realityState.focusSessions,
          { date: sessionDate || new Date().toISOString(), durationMinutes },
        ];

        // Calculate new inferred: progress_increment = session_duration / estimated_total_effort
        let totalFocusMs = newSessions.reduce(
          (acc, s) => acc + s.durationMinutes,
          0,
        );
        let inferredPercent =
          t.realityState.inferredPercent +
          (durationMinutes / (t.estimatedEffortHours * 60)) * 100;
        if (inferredPercent > 100) inferredPercent = 100;

        return {
          ...t,
          realityState: {
            ...t.realityState,
            focusSessions: newSessions,
            inferredPercent,
          },
        };
      }),
    );

    setUserState((prev) => {
      let newXp = prev.xp + 10;
      let newLevel = prev.level;
      while (newXp >= newLevel * 200 + 200) {
        newLevel += 1;
      }
      return {
        ...prev,
        focusMinutesToday: (prev.focusMinutesToday || 0) + durationMinutes,
        xp: newXp,
        level: newLevel,
      };
    });
  };

  const confirmTaskProgress = (taskId: string, confirmedPercent: number) => {
    const taskToComplete = rawTasks.find((t) => t.id === taskId);
    let completedNow = false;
    let newCompletedAt = taskToComplete?.realityState.completedAt || null;

    if (confirmedPercent >= 100 && !newCompletedAt) {
      newCompletedAt = new Date().toISOString();
      completedNow = true;
    }

    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          realityState: {
            ...t.realityState,
            confirmedPercent,
            lastConfirmedAt: new Date().toISOString(),
            completedAt: newCompletedAt,
          },
        };
      }),
    );

    if (confirmedPercent >= 100) {
      // Clear reminders and add success banner
      setReminders((prev) => [
        ...prev.filter((r) => r.taskId !== taskId),
        {
          id: "success_" + Date.now(),
          taskId,
          message: `🎉 Mission Accomplished: "${taskToComplete?.title || "Task"}" completed! Gained 600 XP and increased streak!`,
          tier: "Green",
        },
      ]);

      addActivity(
        "Task Completed",
        `Successfully completed task "${taskToComplete?.title}"!`,
        "complete",
        taskId
      );

      setUserState((prev) => {
        let newXp = prev.xp + 600;
        let newLevel = prev.level;
        while (newXp >= newLevel * 200 + 200) {
          newLevel += 1;
        }
        const nextTarget = new Date(
          new Date().setHours(10, 0, 0, 0) + 24 * 60 * 60 * 1000,
        ).toISOString();

        let newLagByCategory = { ...prev.historicalLagByCategory };
        if (completedNow && taskToComplete) {
          const category = (taskToComplete as Task).category;
          const currentLag = newLagByCategory[category] || 0;
          const est = (taskToComplete as Task).estimatedEffortHours || 0;
          const actualHours =
            (taskToComplete as Task).realityState.focusSessions.reduce(
              (acc: number, s: any) => acc + s.durationMinutes,
              0,
            ) / 60;

          const nowTime = new Date().getTime();
          const deadlineTime = new Date(
            (taskToComplete as Task).deadline,
          ).getTime();

          // Calculate lag only if finished late or took longer than estimated
          if (nowTime > deadlineTime || actualHours > est) {
            let thisTaskLag = 0;
            if (est > 0 && actualHours > est) {
              thisTaskLag = ((actualHours - est) / est) * 100;
            } else if (nowTime > deadlineTime && est > 0) {
              thisTaskLag = 15; // default penalty if no hours logged but late
            }
            newLagByCategory[category] = Math.round(
              currentLag * 0.7 + thisTaskLag * 0.3,
            );
          } else {
            // Good behavior drops lag
            newLagByCategory[category] = Math.max(
              0,
              Math.round(currentLag * 0.8),
            );
          }
        }

        return {
          ...prev,
          xp: newXp,
          level: newLevel,
          tasksCompletedToday: (prev.tasksCompletedToday || 0) + 1,
          forgivenessWindowOpenUntil: nextTarget,
          historicalLagByCategory: newLagByCategory,
          streakCount:
            prev.tasksCompletedToday === 0
              ? prev.streakCount + 1
              : prev.streakCount,
        };
      });
    } else {
      addActivity(
        "Task Progress Updated",
        `Updated progress for "${taskToComplete?.title}" to ${confirmedPercent}%`,
        "update",
        taskId
      );

      setUserState((prev) => {
        let newXp = prev.xp + 20;
        let newLevel = prev.level;
        while (newXp >= newLevel * 200 + 200) {
          newLevel += 1;
        }
        return { ...prev, xp: newXp, level: newLevel };
      });
    }
  };

  const acceptRecoveryPlan = (taskId: string, plan: any) => {
    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            plannedState: {
              ...t.plannedState,
              plannedWorkBlocks: plan.schedule,
            },
            recoveryPlan: {
              ...t.recoveryPlan,
              status: "accepted",
              proposedSchedule: plan.schedule,
            },
          };
        }
        return t;
      }),
    );
  };

  const confirmRetroactiveTask = (
    taskId: string,
    when: string,
    durationStr: string,
  ) => {
    const taskToComplete = rawTasks.find((t) => t.id === taskId);
    let completedNow = false;
    let newCompletedAt = taskToComplete?.realityState.completedAt || null;

    if (!newCompletedAt) {
      completedNow = true;
      newCompletedAt = when;
    }

    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        return {
          ...t,
          realityState: {
            ...t.realityState,
            confirmedPercent: 100,
            inferredPercent: 100,
            lastConfirmedAt: when,
            completedAt: newCompletedAt,
            completedRetroactively: true,
            focusSessions: [
              ...t.realityState.focusSessions,
              { date: when, durationMinutes: parseInt(durationStr) || 60 },
            ],
          },
        };
      }),
    );

    // Award full XP without breaking streak for retroactive completion
    setUserState((prev) => {
      let newXp = prev.xp + 600;
      let newLevel = prev.level;
      while (newXp >= newLevel * 200 + 200) {
        newLevel += 1;
      }
      const nextTarget = new Date(
        new Date().setHours(10, 0, 0, 0) + 24 * 60 * 60 * 1000,
      ).toISOString();

      let newLagByCategory = { ...prev.historicalLagByCategory };
      if (completedNow && taskToComplete) {
        const category = (taskToComplete as Task).category;
        const currentLag = newLagByCategory[category] || 0;
        const est = (taskToComplete as Task).estimatedEffortHours || 0;

        const addedDuration = parseInt(durationStr) || 60;
        const actualHours =
          ((taskToComplete as Task).realityState.focusSessions.reduce(
            (acc: number, s: any) => acc + s.durationMinutes,
            0,
          ) +
            addedDuration) /
          60;

        const nowTime = new Date(when).getTime();
        const deadlineTime = new Date(
          (taskToComplete as Task).deadline,
        ).getTime();

        if (nowTime > deadlineTime || actualHours > est) {
          let thisTaskLag = 0;
          if (est > 0 && actualHours > est) {
            thisTaskLag = ((actualHours - est) / est) * 100;
          } else if (nowTime > deadlineTime && est > 0) {
            thisTaskLag = 15;
          }
          newLagByCategory[category] = Math.round(
            currentLag * 0.7 + thisTaskLag * 0.3,
          );
        } else {
          newLagByCategory[category] = Math.max(
            0,
            Math.round(currentLag * 0.8),
          );
        }
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        tasksCompletedToday: (prev.tasksCompletedToday || 0) + 1,
        forgivenessWindowOpenUntil: nextTarget,
        historicalLagByCategory: newLagByCategory,
        streakCount:
          prev.tasksCompletedToday === 0
            ? prev.streakCount + 1
            : prev.streakCount,
      };
    });
  };

  const generateCalendarBlocks = (
    taskProps: Partial<Task>,
    busyBlocks: { start: string; end: string }[],
  ) => {
    const blocks: { start: string; end: string }[] = [];
    const startHour = 9;
    let currentDay = new Date();
    currentDay.setHours(0, 0, 0, 0);
    const deadline = taskProps.deadline
      ? new Date(taskProps.deadline)
      : new Date();
    deadline.setHours(23, 59, 59, 999);

    const isSlotBusy = (time: Date) => {
      const d = time.getTime();
      return busyBlocks.some((b) => {
        const bs = new Date(b.start).getTime();
        const be = new Date(b.end).getTime();
        return d >= bs && d < be;
      });
    };

    const taskType = taskProps.taskType || "One-Time Task";
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (taskType === "One-Time Task" || taskType === "One-Time") {
      const effortHours = taskProps.estimatedEffortHours || 2;
      const totalDays = Math.ceil(
        (deadline.getTime() - currentDay.getTime()) / (1000 * 3600 * 24),
      );
      const daysToSchedule = Math.max(1, totalDays);
      let hoursRemaining = effortHours;
      let dayOffset = 0;

      while (hoursRemaining > 0 && dayOffset <= daysToSchedule + 30) {
        let itDay = new Date(currentDay);
        itDay.setDate(itDay.getDate() + dayOffset);
        let hoursForDay = Math.min(2, hoursRemaining);

        let scheduled = false;
        for (let h = startHour; h <= 20 - Math.ceil(hoursForDay); h++) {
          itDay.setHours(h, 0, 0, 0);
          let endSlot = new Date(itDay);
          endSlot.setMinutes(Math.ceil(hoursForDay * 60));

          let slotBusy = false;
          for (let ih = 0; ih < Math.ceil(hoursForDay); ih++) {
            let checkH = new Date(itDay);
            checkH.setHours(h + ih, 0, 0, 0);
            if (isSlotBusy(checkH)) slotBusy = true;
          }

          if (!slotBusy) {
            blocks.push({
              start: itDay.toISOString(),
              end: endSlot.toISOString(),
            });
            hoursRemaining -= hoursForDay;
            scheduled = true;
            break;
          }
        }

        // If no free slot found today and we MUST schedule, force it
        if (!scheduled && dayOffset >= daysToSchedule) {
          itDay.setHours(21, 0, 0, 0); // 9 PM squeeze
          let endSlot = new Date(itDay);
          endSlot.setMinutes(Math.ceil(hoursForDay * 60));
          blocks.push({
            start: itDay.toISOString(),
            end: endSlot.toISOString(),
          });
          hoursRemaining -= hoursForDay;
        }

        dayOffset++;
      }
    } else if (taskType === "Daily Habit") {
      const durationMins = taskProps.dailyGoalDurationMinutes || 30;
      const totalDays = 60;
      for (let i = 0; i < totalDays; i++) {
        let itDay = new Date(currentDay);
        itDay.setDate(itDay.getDate() + i);
        itDay.setHours(startHour, 0, 0, 0);
        let endSlot = new Date(itDay);
        endSlot.setMinutes(durationMins);
        blocks.push({ start: itDay.toISOString(), end: endSlot.toISOString() });
      }
    } else if (taskType === "Weekly Task" || taskType === "Custom Schedule") {
      const targetDays = taskProps.weeklyDays || taskProps.customDays || [];
      const totalDays = 60;
      for (let i = 0; i < totalDays; i++) {
        let itDay = new Date(currentDay);
        itDay.setDate(itDay.getDate() + i);
        const dayStr = DAYS[itDay.getDay()];
        if (targetDays.includes(dayStr)) {
          itDay.setHours(startHour, 0, 0, 0);
          let endSlot = new Date(itDay);
          endSlot.setHours(startHour + 1, 0, 0, 0);
          blocks.push({
            start: itDay.toISOString(),
            end: endSlot.toISOString(),
          });
        }
      }
    }

    return blocks;
  };

  const addTask = (taskProps: Partial<Task>) => {
    const taskId = taskProps.id || "t" + Date.now();
    const newTask: Task = {
      id: taskId,
      workspaceId: taskProps.workspaceId || null,
      createdFrom: taskProps.createdFrom || "Quest",
      title: taskProps.title || "Untitled",
      description:
        taskProps.description ||
        "Target objectives set. Complete standard requirements and submit to the forge for evaluation.",
      category: taskProps.category || "Academic",
      createdAt: new Date().toISOString(),
      deadline: taskProps.deadline || new Date().toISOString(),
      estimatedEffortHours: taskProps.estimatedEffortHours || 5,
      focusType: taskProps.focusType,
      failureImpact: taskProps.failureImpact,
      subtasks: taskProps.subtasks,
      isPinned: taskProps.isPinned,
      taskType: taskProps.taskType,
      difficulty: taskProps.difficulty,
      expectedOutcome: taskProps.expectedOutcome,
      dailyGoalDurationMinutes: taskProps.dailyGoalDurationMinutes,
      habitStreak: taskProps.habitStreak,
      weeklyDays: taskProps.weeklyDays,
      weeklyGoal: taskProps.weeklyGoal,
      customDays: taskProps.customDays,
      repeatRules: taskProps.repeatRules,
      importance: {
        aiSuggested: "Medium",
        userOverride: null,
        final: "Medium",
        ...taskProps.importance,
      },
      plannedState: {
        expectedProgressCurve: [
          { date: new Date().toISOString(), expectedPercent: 0 },
          {
            date: taskProps.deadline || new Date().toISOString(),
            expectedPercent: 100,
          },
        ],
        plannedWorkBlocks: taskProps.plannedState?.plannedWorkBlocks && taskProps.plannedState.plannedWorkBlocks.length > 0
          ? taskProps.plannedState.plannedWorkBlocks
          : generateCalendarBlocks(taskProps, userState.busyBlocks),
      },
      realityState: taskProps.realityState || {
        confirmedPercent: 0,
        inferredPercent: 0,
        effectivePercent: 0,
        lastConfirmedAt: null,
        focusSessions: [],
        completedAt: null,
        completedRetroactively: false,
      },
      riskEngine: {
        riskScore: 0,
        riskTier: "Green",
        breakdown: {
          progressGap: 0,
          urgency: 0,
          historicalLagBias: 0,
          workloadDensity: 0,
        },
        completionProbability: 1,
        uncertaintyFlag: true,
      },
      priorityScore: 0,
      recoveryPlan: {
        status: "none",
        proposedSchedule: null,
        extensionDraft: null,
      },
    };

    setRawTasks((prev) => [...prev, newTask]);

    addActivity(
      "Task Created",
      `Created task "${newTask.title}" via ${newTask.createdFrom}`,
      "create",
      newTask.id
    );
  };

  const deleteTask = (taskId: string) => {
    const deletedTask = rawTasks.find((t) => t.id === taskId);
    setRawTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (deletedTask) {
      addActivity(
        "Task Deleted",
        `Deleted task "${deletedTask.title}"`,
        "delete",
        taskId
      );
    }
  };

  const duplicateTask = (taskId: string) => {
    setRawTasks((prev) => {
      const taskToCopy = prev.find((t) => t.id === taskId);
      if (!taskToCopy) return prev;
      const newTask = {
        ...taskToCopy,
        id: "t" + Date.now(),
        title: `${taskToCopy.title} (Copy)`,
      };
      return [...prev, newTask];
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    let taskToUpdate: Task | undefined;
    setRawTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          taskToUpdate = t;
          let updatedTask = { ...t, ...updates };
          // If modifying scheduling-related fields, regenerate blocks
          if (
            (updates.deadline ||
            updates.estimatedEffortHours ||
            updates.taskType ||
            updates.dailyGoalDurationMinutes ||
            updates.weeklyDays ||
            updates.customDays) &&
            !updates.plannedState?.plannedWorkBlocks
          ) {
            updatedTask.plannedState = {
              ...updatedTask.plannedState,
              plannedWorkBlocks: generateCalendarBlocks(
                updatedTask,
                userState.busyBlocks,
              ),
            };
          }

          if (updatedTask.workspaceId) {
            // Firestore updates removed
          }

          return updatedTask;
        }
        return t;
      }),
    );

    if (taskToUpdate) {
      const isSchedule = !!updates.plannedState?.plannedWorkBlocks || !!updates.deadline;
      addActivity(
        isSchedule ? "Task Scheduled" : "Task Updated",
        isSchedule ? `Rescheduled or updated calendar blocks for "${taskToUpdate.title}"` : `Updated details for "${taskToUpdate.title}"`,
        isSchedule ? "schedule" : "update",
        taskId
      );
    }
  };

  const calculateStreakStats = (completedDates: string[], repeatPattern: string, startDateStr: string) => {
    if (completedDates.length === 0) {
      return { streak: 0, longestStreak: 0 };
    }

    const dates = Array.from(new Set(completedDates))
      .map(d => new Date(d + 'T00:00:00'))
      .sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentStreak = 0;
    let longestStreak = 0;

    if (repeatPattern === "Daily") {
      const latest = dates[0];
      const latestTime = latest.getTime();
      if (latestTime === today.getTime() || latestTime === yesterday.getTime()) {
        currentStreak = 1;
        let prevTime = latestTime;
        for (let i = 1; i < dates.length; i++) {
          const nextTime = dates[i].getTime();
          const diffDays = (prevTime - nextTime) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            currentStreak++;
            prevTime = nextTime;
          } else if (diffDays > 1) {
            break;
          }
        }
      } else {
        currentStreak = 0;
      }

      let tempStreak = 0;
      let prevTime = null;
      for (let i = dates.length - 1; i >= 0; i--) {
        const curTime = dates[i].getTime();
        if (prevTime === null) {
          tempStreak = 1;
        } else {
          const diffDays = (curTime - prevTime) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
          }
        }
        prevTime = curTime;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;

    } else if (repeatPattern === "Weekly") {
      const latest = dates[0];
      const daysSinceLatest = (today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLatest <= 8) {
        currentStreak = 1;
        let prevTime = latest.getTime();
        for (let i = 1; i < dates.length; i++) {
          const nextTime = dates[i].getTime();
          const diffDays = (prevTime - nextTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= 8) {
            currentStreak++;
            prevTime = nextTime;
          } else {
            break;
          }
        }
      } else {
        currentStreak = 0;
      }

      let tempStreak = 0;
      let prevTime = null;
      for (let i = dates.length - 1; i >= 0; i--) {
        const curTime = dates[i].getTime();
        if (prevTime === null) {
          tempStreak = 1;
        } else {
          const diffDays = (curTime - prevTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= 8) {
            tempStreak++;
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
          }
        }
        prevTime = curTime;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;

    } else {
      const windowDays = repeatPattern === "Monthly" ? 35 : repeatPattern === "Yearly" ? 370 : 8;
      const latest = dates[0];
      const daysSinceLatest = (today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLatest <= windowDays) {
        currentStreak = 1;
        let prevTime = latest.getTime();
        for (let i = 1; i < dates.length; i++) {
          const nextTime = dates[i].getTime();
          const diffDays = (prevTime - nextTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= windowDays) {
            currentStreak++;
            prevTime = nextTime;
          } else {
            break;
          }
        }
      } else {
        currentStreak = 0;
      }

      let tempStreak = 0;
      let prevTime = null;
      for (let i = dates.length - 1; i >= 0; i--) {
        const curTime = dates[i].getTime();
        if (prevTime === null) {
          tempStreak = 1;
        } else {
          const diffDays = (curTime - prevTime) / (1000 * 60 * 60 * 24);
          if (diffDays <= windowDays) {
            tempStreak++;
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
          }
        }
        prevTime = curTime;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    return { streak: currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
  };

  const addHabit = (habitProps: Partial<Habit>) => {
    const habitId = habitProps.id || "h" + Date.now();
    const newHabit: Habit = {
      id: habitId,
      name: habitProps.name || "Untitled Habit",
      category: habitProps.category || "Academic",
      duration: habitProps.duration || 30,
      repeatPattern: (habitProps.repeatPattern as any) || "Daily",
      startDate: habitProps.startDate || new Date().toISOString().split('T')[0],
      startTime: habitProps.startTime || "09:00",
      endTime: habitProps.endTime || "09:30",
      color: habitProps.color || "#A855F7",
      completedDates: habitProps.completedDates || [],
      streak: habitProps.streak || 0,
      longestStreak: habitProps.longestStreak || 0,
      xpPerCompletion: habitProps.xpPerCompletion || 40,
      workspaceId: habitProps.workspaceId || null,
      ownerId: userState.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRawHabits((prev) => [...prev, newHabit]);

    addActivity(
      "Habit Created",
      `Created habit "${newHabit.name}"`,
      "create",
      newHabit.id
    );
  };

  const deleteHabit = (habitId: string) => {
    const deletedHabit = rawHabits.find((h) => h.id === habitId);
    setRawHabits((prev) => prev.filter((h) => h.id !== habitId));

    if (deletedHabit) {
      addActivity(
        "Habit Deleted",
        `Deleted habit "${deletedHabit.name}"`,
        "delete",
        habitId
      );
    }
  };

  const updateHabit = (habitId: string, updates: Partial<Habit>) => {
    setRawHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const updatedHabit = {
            ...h,
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          if (updatedHabit.workspaceId) {
            // Firestore updates removed
          }
          return updatedHabit;
        }
        return h;
      })
    );

    addActivity(
      "Habit Updated",
      `Updated habit details`,
      "update",
      habitId
    );
  };

  const completeHabit = (habitId: string) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    setRawHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          if (h.completedDates.includes(todayStr)) {
            return h;
          }
          const completedDates = [...h.completedDates, todayStr];
          const { streak, longestStreak } = calculateStreakStats(completedDates, h.repeatPattern, h.startDate);

          const updatedHabit = {
            ...h,
            completedDates,
            streak,
            longestStreak,
            updatedAt: new Date().toISOString(),
          };

          if (updatedHabit.workspaceId) {
            // Firestore updates removed
          }

          setUserState((prev) => {
            let newXp = prev.xp + (h.xpPerCompletion || 40);
            let newLevel = prev.level;
            while (newXp >= newLevel * 200 + 200) {
              newLevel += 1;
            }
            return {
              ...prev,
              xp: newXp,
              level: newLevel,
              tasksCompletedToday: (prev.tasksCompletedToday || 0) + 1,
            };
          });

          setReminders((prevRem) => [
            ...prevRem,
            {
              id: "habit_success_" + Date.now(),
              taskId: habitId,
              message: `🔥 Streak! Completed "${h.name}"! Streak: ${streak} days, Gained ${h.xpPerCompletion || 40} XP!`,
              tier: "Green",
            },
          ]);

          addActivity(
            "Habit Completed",
            `Successfully completed habit "${h.name}"! Current streak: ${streak} days.`,
            "complete",
            habitId
          );

          return updatedHabit;
        }
        return h;
      })
    );
  };

  const toggleHabitDate = (habitId: string, dateStr: string) => {
    setRawHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const isCompleted = h.completedDates.includes(dateStr);
          let completedDates: string[];
          let xpEarned = 0;

          if (isCompleted) {
            completedDates = h.completedDates.filter((d) => d !== dateStr);
            xpEarned = -(h.xpPerCompletion || 40);
          } else {
            completedDates = [...h.completedDates, dateStr];
            xpEarned = h.xpPerCompletion || 40;
          }

          const { streak, longestStreak } = calculateStreakStats(completedDates, h.repeatPattern, h.startDate);

          const updatedHabit = {
            ...h,
            completedDates,
            streak,
            longestStreak,
            updatedAt: new Date().toISOString(),
          };

          if (updatedHabit.workspaceId) {
            // Firestore updates removed
          }

          setUserState((prev) => {
            let newXp = prev.xp + xpEarned;
            let newLevel = prev.level;
            
            if (newXp < 0) {
              newXp = 0;
            }
            
            while (newXp >= newLevel * 200 + 200) {
              newLevel += 1;
            }
            while (newLevel > 1 && newXp < (newLevel - 1) * 200 + 200) {
              newLevel -= 1;
            }

            return {
              ...prev,
              xp: newXp,
              level: newLevel,
            };
          });

          if (!isCompleted) {
            setReminders((prevRem) => [
              ...prevRem,
              {
                id: "habit_success_" + Date.now(),
                taskId: habitId,
                message: `🎯 Historical log updated: Completed "${h.name}" on ${dateStr}! Streak: ${streak} days.`,
                tier: "Green",
              },
            ]);
          }

          addActivity(
            "Habit Logged",
            `Toggled completion of habit "${h.name}" on ${dateStr} to ${!isCompleted ? "Completed" : "Incomplete"}`,
            isCompleted ? "delete" : "complete",
            habitId
          );

          return updatedHabit;
        }
        return h;
      })
    );
  };

  const updateProfile = (name: string) => {
    setUserState((prev) => ({ ...prev, name }));
  };

  const updateUserState = (updates: Partial<UserState>) => {
    setUserState((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = () => {
    setUserState((prev) => ({ ...prev, hasSeenOnboarding: true }));
  };

  const loadDemoData = () => {
    const now = new Date();

    const demoTasks: Task[] = [
      {
        id: "demo_green_" + Date.now(),
        title: "Project Alpha (On Track)",
        description: "A comfortable project with plenty of time and progress.",
        category: "Work",
        deadline: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(), // 3 days
        estimatedEffortHours: 5,
        importance: {
          aiSuggested: "Medium",
          userOverride: null,
          final: "Medium",
        },
        plannedState: {
          expectedProgressCurve: [],
          plannedWorkBlocks: [],
        },
        realityState: {
          confirmedPercent: 20,
          inferredPercent: 20,
          effectivePercent: 20,
          lastConfirmedAt: now.toISOString(),
          focusSessions: [
            {
              date: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
              durationMinutes: 60,
            },
          ],
          completedAt: null,
          completedRetroactively: false,
        },
        riskEngine: {
          riskScore: 0,
          riskTier: "Green",
          breakdown: {
            progressGap: 0,
            urgency: 0,
            historicalLagBias: 0,
            workloadDensity: 0,
          },
          completionProbability: 1,
          uncertaintyFlag: false,
        },
        priorityScore: 0,
        recoveryPlan: {
          status: "none",
          proposedSchedule: null,
          extensionDraft: null,
        },
      },
      {
        id: "demo_yellow_" + Date.now(),
        title: "Report Draft (Slightly Behind)",
        description: "Starting to slip behind schedule, but manageable.",
        category: "Work",
        deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day
        estimatedEffortHours: 10,
        importance: { aiSuggested: "High", userOverride: null, final: "High" },
        plannedState: {
          expectedProgressCurve: [
            {
              date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
              expectedPercent: 0,
            },
            { date: now.toISOString(), expectedPercent: 100 },
          ],
          plannedWorkBlocks: [],
        },
        realityState: {
          confirmedPercent: 0,
          inferredPercent: 0,
          effectivePercent: 0,
          lastConfirmedAt: now.toISOString(),
          focusSessions: [],
          completedAt: null,
          completedRetroactively: false,
        },
        riskEngine: {
          riskScore: 0,
          riskTier: "Yellow",
          breakdown: {
            progressGap: 0,
            urgency: 0,
            historicalLagBias: 0,
            workloadDensity: 0,
          },
          completionProbability: 1,
          uncertaintyFlag: false,
        },
        priorityScore: 0,
        recoveryPlan: {
          status: "none",
          proposedSchedule: null,
          extensionDraft: null,
        },
      },
      {
        id: "demo_high_" + Date.now(),
        title: "Client Presentation (High Risk)",
        description: "Significantly behind, tight deadline.",
        category: "Urgent",
        deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        estimatedEffortHours: 10,
        importance: { aiSuggested: "High", userOverride: null, final: "High" },
        plannedState: {
          expectedProgressCurve: [
            {
              date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
              expectedPercent: 0,
            },
            { date: now.toISOString(), expectedPercent: 100 },
          ],
          plannedWorkBlocks: [],
        },
        realityState: {
          confirmedPercent: 5,
          inferredPercent: 5,
          effectivePercent: 5,
          lastConfirmedAt: now.toISOString(),
          focusSessions: [],
          completedAt: null,
          completedRetroactively: false,
        },
        riskEngine: {
          riskScore: 0,
          riskTier: "Red",
          breakdown: {
            progressGap: 0,
            urgency: 0,
            historicalLagBias: 0,
            workloadDensity: 0,
          },
          completionProbability: 1,
          uncertaintyFlag: false,
        },
        priorityScore: 0,
        recoveryPlan: {
          status: "none",
          proposedSchedule: null,
          extensionDraft: null,
        },
      },
      {
        id: "demo_critical_" + Date.now(),
        title: "Tax Filing (Critical Risk)",
        description: "Almost out of time, massive effort remaining.",
        category: "Critical",
        deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        estimatedEffortHours: 12,
        importance: {
          aiSuggested: "Critical",
          userOverride: null,
          final: "Critical",
        },
        plannedState: {
          expectedProgressCurve: [
            {
              date: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
              expectedPercent: 0,
            },
            { date: now.toISOString(), expectedPercent: 100 },
          ],
          plannedWorkBlocks: [],
        },
        realityState: {
          confirmedPercent: 0,
          inferredPercent: 0,
          effectivePercent: 0,
          lastConfirmedAt: now.toISOString(),
          focusSessions: [],
          completedAt: null,
          completedRetroactively: false,
        },
        riskEngine: {
          riskScore: 0,
          riskTier: "Red",
          breakdown: {
            progressGap: 0,
            urgency: 0,
            historicalLagBias: 0,
            workloadDensity: 0,
          },
          completionProbability: 1,
          uncertaintyFlag: false,
        },
        priorityScore: 0,
        recoveryPlan: {
          status: "none",
          proposedSchedule: null,
          extensionDraft: null,
        },
      },
      {
        id: "demo_overdue_" + Date.now(),
        title: "Renew Registration (Overdue)",
        description: "Missed deadline.",
        category: "Admin",
        deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // -1 day
        estimatedEffortHours: 2,
        importance: { aiSuggested: "High", userOverride: null, final: "High" },
        plannedState: {
          expectedProgressCurve: [
            {
              date: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
              expectedPercent: 0,
            },
            {
              date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
              expectedPercent: 100,
            },
          ],
          plannedWorkBlocks: [],
        },
        realityState: {
          confirmedPercent: 0,
          inferredPercent: 0,
          effectivePercent: 0,
          lastConfirmedAt: now.toISOString(),
          focusSessions: [],
          completedAt: null,
          completedRetroactively: false,
        },
        riskEngine: {
          riskScore: 0,
          riskTier: "Red",
          breakdown: {
            progressGap: 0,
            urgency: 0,
            historicalLagBias: 0,
            workloadDensity: 0,
          },
          completionProbability: 1,
          uncertaintyFlag: false,
        },
        priorityScore: 0,
        recoveryPlan: {
          status: "none",
          proposedSchedule: null,
          extensionDraft: null,
        },
      },
      {
        id: "demo_distant_" + Date.now(),
        title: "Long Term Goal (Distant)",
        description: "Very far out, should not trigger nudges even if behind.",
        category: "Work",
        deadline: new Date(
          now.getTime() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 14 days
        estimatedEffortHours: 50,
        importance: { aiSuggested: "High", userOverride: null, final: "High" },
        plannedState: {
          expectedProgressCurve: [
            {
              date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
              expectedPercent: 0,
            },
            {
              date: new Date(
                now.getTime() + 14 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              expectedPercent: 100,
            },
          ],
          plannedWorkBlocks: [],
        },
        realityState: {
          confirmedPercent: 0,
          inferredPercent: 0,
          effectivePercent: 0,
          lastConfirmedAt: now.toISOString(),
          focusSessions: [],
          completedAt: null,
          completedRetroactively: false,
        },
        riskEngine: {
          riskScore: 90,
          riskTier: "Red",
          breakdown: {
            progressGap: 0,
            urgency: 0,
            historicalLagBias: 0,
            workloadDensity: 0,
          },
          completionProbability: 1,
          uncertaintyFlag: false,
        },
        priorityScore: 0,
        recoveryPlan: {
          status: "none",
          proposedSchedule: null,
          extensionDraft: null,
        },
      },
    ];

    setRawTasks(demoTasks);
    setUserState((prev) => ({
      ...prev,
      historicalLagByCategory: {
        ...prev.historicalLagByCategory,
        Critical: 100, // Forces high historical lag bias for critical tasks
        Urgent: 80,
      },
    }));
  };

  return (
    <UserContext.Provider
      value={{
        userState,
        tasks,
        habits,
        addFocusSession,
        confirmTaskProgress,
        updateProfile,
        addTask,
        deleteTask,
        duplicateTask,
        updateTask,
        addHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
        toggleHabitDate,
        acceptRecoveryPlan,
        confirmRetroactiveTask,
        reminders,
        dismissReminder,
        updateBusyBlocks,
        updateTaskPlannedBlocks,
        updateUserState,
        completeOnboarding,
        loadDemoData,
        activities,
        addActivity,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
