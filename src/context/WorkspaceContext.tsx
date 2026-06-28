import React, { createContext, useContext, useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { Workspace, Task, Habit, ActivityLog } from "../types";
import { useUser } from "./UserContext";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  workspaceTasks: Task[];
  workspaceHabits: Habit[];
  workspaceActivities: ActivityLog[];
  addWorkspaceActivity: (title: string, description: string, type: 'create' | 'update' | 'complete' | 'delete' | 'schedule', taskId?: string) => void;
  createWorkspace: (name: string) => Promise<void>;
  joinWorkspace: (inviteCode: string) => Promise<void>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, memberId: string, role: 'Owner' | 'Admin' | 'Member' | 'Viewer') => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
  addWorkspaceTask: (task: Partial<Task>) => Promise<void>;
  updateWorkspaceTask: (
    taskId: string,
    updates: Partial<Task>,
  ) => Promise<void>;
  deleteWorkspaceTask: (taskId: string) => Promise<void>;
  confirmWorkspaceTaskProgress: (taskId: string, confirmedPercent: number) => Promise<void>;
  addWorkspaceHabit: (habit: Partial<Habit>) => Promise<void>;
  updateWorkspaceHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteWorkspaceHabit: (habitId: string) => Promise<void>;
  userId: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null,
  );
  const [workspaceTasks, setWorkspaceTasks] = useState<Task[]>([]);
  const [workspaceHabits, setWorkspaceHabits] = useState<Habit[]>([]);
  const [workspaceActivities, setWorkspaceActivities] = useState<ActivityLog[]>([]);
  const { userState } = useUser();
  const userId = userState.id;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("focusforge_workspace_activities");
      if (saved) {
         setWorkspaceActivities(JSON.parse(saved));
      }
    } catch(e) {}
  }, [currentWorkspaceId]);

  const addWorkspaceActivity = (title: string, description: string, type: 'create' | 'update' | 'complete' | 'delete' | 'schedule', taskId?: string) => {
    const newLog: ActivityLog = {
      id: "wsact_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      taskId,
      title,
      description,
      timestamp: new Date().toISOString(),
      type
    };
    setWorkspaceActivities(prev => {
       const newActivities = [newLog, ...prev].slice(0, 50);
       localStorage.setItem("focusforge_workspace_activities", JSON.stringify(newActivities));
       return newActivities;
    });
  };

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "workspaces"),
      where("memberIds", "array-contains", userId),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ws: Workspace[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ws.push({
            id: doc.id,
            name: data.name,
            inviteCode: data.inviteCode,
            members: data.members || [],
          });
        });
        setWorkspaces(ws);
      },
      (error) => {
        console.error("Error fetching workspaces:", error);
      },
    );
    return () => unsubscribe();
  }, [userId]);

  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) || null;

  useEffect(() => {
    if (!currentWorkspaceId) {
      setWorkspaceTasks([]);
      return;
    }
    // Load from local storage initially and when workspace changes
    try {
      const saved = localStorage.getItem("focusforge_workspace_tasks");
      if (saved) {
        const parsed = JSON.parse(saved).map((t: any) => {
          delete t.dueDate;
          delete t.deadline;
          delete t.notificationDate;
          delete t.reminderDate;
          delete t.overdue;
          delete t.estimatedRemaining;
          delete t.urgencyScore;
          return t;
        });
        setWorkspaceTasks(parsed.filter((t: Task) => t.workspaceId === currentWorkspaceId));
        // Save cleaned tasks back immediately to persist cleanup
        localStorage.setItem("focusforge_workspace_tasks", JSON.stringify(parsed));
      }
    } catch (e) {}
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!currentWorkspaceId) {
      setWorkspaceHabits([]);
      return;
    }
    try {
      const saved = localStorage.getItem("focusforge_workspace_habits");
      if (saved) {
        const parsed = JSON.parse(saved);
        setWorkspaceHabits(parsed.filter((h: Habit) => h.workspaceId === currentWorkspaceId));
      }
    } catch (e) {}
  }, [currentWorkspaceId]);

  // Sync listener for cross-context updates
  useEffect(() => {
    const handleSync = () => {
      if (!currentWorkspaceId) return;
      try {
        const savedT = localStorage.getItem("focusforge_workspace_tasks");
        if (savedT) {
           const parsed = JSON.parse(savedT).map((t: any) => {
             delete t.dueDate;
             delete t.deadline;
             delete t.notificationDate;
             delete t.reminderDate;
             delete t.overdue;
             delete t.estimatedRemaining;
             delete t.urgencyScore;
             return t;
           });
           const filtered = parsed.filter((t: Task) => t.workspaceId === currentWorkspaceId);
           setWorkspaceTasks(prev => JSON.stringify(prev) === JSON.stringify(filtered) ? prev : filtered);
        }
        
        const savedH = localStorage.getItem("focusforge_workspace_habits");
        if (savedH) {
           const filteredH = JSON.parse(savedH).filter((h: Habit) => h.workspaceId === currentWorkspaceId);
           setWorkspaceHabits(prev => JSON.stringify(prev) === JSON.stringify(filteredH) ? prev : filteredH);
        }
      } catch(e) {}
    };
    window.addEventListener("focusforge_workspace_sync", handleSync);
    return () => window.removeEventListener("focusforge_workspace_sync", handleSync);
  }, [currentWorkspaceId]);

  const saveWorkspaceTasksToStorage = (newTasks: Task[]) => {
    try {
      let allTasks: Task[] = [];
      const saved = localStorage.getItem("focusforge_workspace_tasks");
      if (saved) allTasks = JSON.parse(saved);
      
      const otherWorkspaceTasks = allTasks.filter(t => t.workspaceId !== currentWorkspaceId);
      const toSave = [...otherWorkspaceTasks, ...newTasks];
      localStorage.setItem("focusforge_workspace_tasks", JSON.stringify(toSave));
    } catch(e) {}
  };

  const saveWorkspaceHabitsToStorage = (newHabits: Habit[]) => {
    try {
      let allHabits: Habit[] = [];
      const saved = localStorage.getItem("focusforge_workspace_habits");
      if (saved) allHabits = JSON.parse(saved);
      
      const otherWorkspaceHabits = allHabits.filter(h => h.workspaceId !== currentWorkspaceId);
      const toSave = [...otherWorkspaceHabits, ...newHabits];
      localStorage.setItem("focusforge_workspace_habits", JSON.stringify(toSave));
    } catch(e) {}
  };

  const createWorkspace = async (name: string) => {
    if (!userId) return;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const workspaceRef = doc(collection(db, "workspaces"));
    await setDoc(workspaceRef, {
      name,
      inviteCode,
      ownerId: userId,
      members: [{ userId, displayName: userState.name, role: 'Owner', joinedAt: new Date().toISOString() }],
      memberIds: [userId],
    });
    setCurrentWorkspaceId(workspaceRef.id);
  };

  const joinWorkspace = async (inviteCode: string) => {
    if (!userId) return;
    const q = query(
      collection(db, "workspaces"),
      where("inviteCode", "==", inviteCode),
    );
    const snapshot = await new Promise<any>((resolve) => {
      const unsub = onSnapshot(q, (snap) => {
        unsub();
        resolve(snap);
      });
    });
    if (snapshot.empty) throw new Error("Invalid invite code");
    const wsDoc = snapshot.docs[0];
    await updateDoc(wsDoc.ref, {
      members: arrayUnion({ userId, displayName: userState.name, role: 'Member', joinedAt: new Date().toISOString() }),
      memberIds: arrayUnion(userId),
    });
    setCurrentWorkspaceId(wsDoc.id);
  };

  const addWorkspaceTask = async (task: Partial<Task>) => {
    if (!currentWorkspaceId || !userId) return;
    const newTask: any = {
      title: task.title || "Untitled",
      description: task.description || "",
      category: task.category || "Workspace",
      createdAt: new Date().toISOString(),
      estimatedEffortHours: task.estimatedEffortHours || 5,
      plannedState: {
        expectedProgressCurve: [],
        plannedWorkBlocks: [],
      },
      realityState: {
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
      importance: {
        aiSuggested: "Medium",
        userOverride: null,
        final: "Medium",
      },
      ...task,
      id: "wt_" + Date.now() + Math.random().toString(36).substring(2, 6),
      workspaceId: currentWorkspaceId,
      ownerId: userId, // Track who owns it
    };
    
    // Cleanup any lingering deadline/notification fields
    delete newTask.dueDate;
    delete newTask.deadline;
    delete newTask.notificationDate;
    delete newTask.reminderDate;
    delete newTask.overdue;
    delete newTask.estimatedRemaining;
    delete newTask.urgencyScore;

    const newTasks = [...workspaceTasks, newTask as unknown as Task];
    setWorkspaceTasks(newTasks);
    saveWorkspaceTasksToStorage(newTasks);
    addWorkspaceActivity("Workspace Task Created", `Added task "${newTask.title}"`, "create", newTask.id);
  };

  const updateWorkspaceTask = async (
    taskId: string,
    updates: Partial<Task>,
  ) => {
    // Scrub deadline fields from updates to enforce workspace task rules
    const scrubbedUpdates = { ...updates } as any;
    delete scrubbedUpdates.dueDate;
    delete scrubbedUpdates.deadline;
    delete scrubbedUpdates.notificationDate;
    delete scrubbedUpdates.reminderDate;
    delete scrubbedUpdates.overdue;
    delete scrubbedUpdates.estimatedRemaining;
    delete scrubbedUpdates.urgencyScore;

    const newTasks = workspaceTasks.map((t) => (t.id === taskId ? { ...t, ...scrubbedUpdates } : t));
    setWorkspaceTasks(newTasks);
    saveWorkspaceTasksToStorage(newTasks);
    
    const task = workspaceTasks.find(t => t.id === taskId);
    if (task) {
      addWorkspaceActivity("Workspace Task Updated", `Updated task "${task.title}"`, "update", taskId);
    }
  };

  const deleteWorkspaceTask = async (taskId: string) => {
    const taskToDelete = workspaceTasks.find(t => t.id === taskId);
    const newTasks = workspaceTasks.filter((t) => t.id !== taskId);
    setWorkspaceTasks(newTasks);
    saveWorkspaceTasksToStorage(newTasks);
    if (taskToDelete) {
       addWorkspaceActivity("Workspace Task Deleted", `Deleted task "${taskToDelete.title}"`, "delete", taskId);
    }
  };

  const addWorkspaceHabit = async (habit: Partial<Habit>) => {
    const newHabit: Habit = {
      id: "wh_" + Date.now() + Math.random().toString(36).substring(2, 6),
      name: habit.name || "Untitled Habit",
      category: habit.category || "Academic",
      duration: habit.duration || 30,
      repeatPattern: (habit.repeatPattern as any) || "Daily",
      startDate: habit.startDate || new Date().toISOString().split('T')[0],
      startTime: habit.startTime || "09:00",
      endTime: habit.endTime || "09:30",
      color: habit.color || "#A855F7",
      completedDates: habit.completedDates || [],
      streak: habit.streak || 0,
      longestStreak: habit.longestStreak || 0,
      xpPerCompletion: habit.xpPerCompletion || 40,
      workspaceId: currentWorkspaceId,
      ownerId: userId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newHabits = [...workspaceHabits, newHabit];
    setWorkspaceHabits(newHabits);
    saveWorkspaceHabitsToStorage(newHabits);
  };

  const updateWorkspaceHabit = async (habitId: string, updates: Partial<Habit>) => {
    const newHabits = workspaceHabits.map((h) =>
      h.id === habitId ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
    );
    setWorkspaceHabits(newHabits);
    saveWorkspaceHabitsToStorage(newHabits);
  };

  const deleteWorkspaceHabit = async (habitId: string) => {
    const newHabits = workspaceHabits.filter((h) => h.id !== habitId);
    setWorkspaceHabits(newHabits);
    saveWorkspaceHabitsToStorage(newHabits);
  };

  const confirmWorkspaceTaskProgress = async (taskId: string, confirmedPercent: number) => {
    const newTasks = workspaceTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          realityState: {
            ...t.realityState,
            confirmedPercent,
            lastConfirmedAt: new Date().toISOString(),
            ...(confirmedPercent >= 100 ? { completedAt: new Date().toISOString() } : {}),
          },
        };
      }
      return t;
    });
    setWorkspaceTasks(newTasks);
    saveWorkspaceTasksToStorage(newTasks);
    
    if (confirmedPercent >= 100) {
      const task = workspaceTasks.find(t => t.id === taskId);
      if (task && task.realityState.confirmedPercent < 100) {
         addWorkspaceActivity("Workspace Task Completed", `Completed task "${task.title}"`, "complete", taskId);
      }
    }
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>) => {
    const wsRef = doc(db, "workspaces", workspaceId);
    await updateDoc(wsRef, updates);
  };

  const deleteWorkspace = async (workspaceId: string) => {
    const wsRef = doc(db, "workspaces", workspaceId);
    await deleteDoc(wsRef);
    if (currentWorkspaceId === workspaceId) {
      setCurrentWorkspaceId(null);
    }
  };

  const updateMemberRole = async (workspaceId: string, memberId: string, role: 'Owner' | 'Admin' | 'Member' | 'Viewer') => {
    const wsRef = doc(db, "workspaces", workspaceId);
    const ws = workspaces.find(w => w.id === workspaceId);
    if (!ws) return;
    const newMembers = ws.members.map(m => m.userId === memberId ? { ...m, role } : m);
    await updateDoc(wsRef, { members: newMembers });
  };

  const removeMember = async (workspaceId: string, memberId: string) => {
    const wsRef = doc(db, "workspaces", workspaceId);
    const ws = workspaces.find(w => w.id === workspaceId);
    if (!ws) return;
    const newMembers = ws.members.filter(m => m.userId !== memberId);
    const newMemberIds = newMembers.map(m => m.userId);
    await updateDoc(wsRef, { members: newMembers, memberIds: newMemberIds });
    if (memberId === userId && currentWorkspaceId === workspaceId) {
      setCurrentWorkspaceId(null);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspaceId,
        workspaceTasks,
        workspaceHabits,
        workspaceActivities,
        addWorkspaceActivity,
        createWorkspace,
        joinWorkspace,
        updateWorkspace,
        deleteWorkspace,
        updateMemberRole,
        removeMember,
        addWorkspaceTask,
        updateWorkspaceTask,
        deleteWorkspaceTask,
        confirmWorkspaceTaskProgress,
        addWorkspaceHabit,
        updateWorkspaceHabit,
        deleteWorkspaceHabit,
        userId,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context)
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return context;
}
