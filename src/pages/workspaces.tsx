import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../context/UserContext";
import { calculateTaskMetrics } from "../lib/engine";
import { Task } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  Users,
  Plus,
  Link as LinkIcon,
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckSquare,
  ChevronLeft,
  MoreVertical,
  CheckCircle2,
  Clock,
  TrendingUp,
  HeartPulse,
  BrainCircuit,
  Terminal,
  Play,
  CircleDashed,
  UserCircle2,
  Trash2,
  Edit2,
  UserPlus,
  ListTodo,
  Pin
} from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import TaskContextMenu from "../components/TaskContextMenu";
import { TaskDetailsPanel } from "../components/TaskDetailsPanel";

import { 
  WorkspaceDetailsDrawer, 
  ManageMembersModal, 
  InviteMembersModal, 
  WorkspaceCardMenu,
  EditWorkspaceModal,
  WorkspaceAnalyticsDrawer,
  WorkspaceCalendarDrawer,
  WorkspaceSettingsModal 
} from "../components/WorkspaceComponents";

export default function Workspaces() {
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    createWorkspace,
    joinWorkspace,
    workspaceTasks,
    addWorkspaceTask,
    updateWorkspaceTask,
    deleteWorkspaceTask,
    confirmWorkspaceTaskProgress,
    workspaceActivities,
    userId,
  } = useWorkspace();
  const { userState } = useUser();
  const navigate = useNavigate();

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // New Workspace Management states
  const [detailsWorkspaceId, setDetailsWorkspaceId] = useState<string | null>(null);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string | null>(null);
  const [membersWorkspaceId, setMembersWorkspaceId] = useState<string | null>(null);
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null);
  const [analyticsWorkspaceId, setAnalyticsWorkspaceId] = useState<string | null>(null);
  const [calendarWorkspaceId, setCalendarWorkspaceId] = useState<string | null>(null);
  const [settingsWorkspaceId, setSettingsWorkspaceId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    try {
      await createWorkspace(createName);
      setCreateName("");
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinWorkspace(joinCode);
      setJoinCode("");
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addWorkspaceTask({
      title: newTaskTitle,
      category: "Workspace",
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
      estimatedEffortHours: 5,
    });
    setNewTaskTitle("");
  };

  if (!currentWorkspace) {
    return (
      <div className="px-4 py-8 md:p-8 max-w-4xl mx-auto w-full pb-[calc(120px+env(safe-area-inset-bottom))] md:pb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 gap-5 md:gap-0">
          <h1 className="text-[36px] md:text-3xl font-display font-bold text-[var(--text-primary)] leading-tight">
            Workspaces
          </h1>
          <select
            value="personal"
            onChange={(e) =>
              setCurrentWorkspaceId(
                e.target.value === "personal" ? null : e.target.value,
              )
            }
            className="w-full md:w-auto h-12 md:h-auto bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-[16px] md:text-sm"
          >
            <option value="personal">Personal</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] rounded-[20px] md:rounded-xl">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-[22px] md:text-2xl">
                <Plus size={18} /> Create Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-6">
              <div className="flex flex-col md:flex-row gap-3 md:gap-2">
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Workspace Name"
                  className="w-full md:flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[16px] md:text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  onClick={handleCreate}
                  className="w-full md:w-auto h-[46px] md:h-auto px-4 py-2 bg-[#1bae4f] text-black rounded-[14px] md:rounded-lg font-bold text-[15px] md:text-sm hover:brightness-110"
                >
                  Create
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] rounded-[20px] md:rounded-xl">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-[22px] md:text-2xl">
                <LinkIcon size={18} /> Join Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-6">
              <div className="flex flex-col md:flex-row gap-3 md:gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Invite Code"
                  className="w-full md:flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[16px] md:text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  onClick={handleJoin}
                  className="w-full md:w-auto h-[46px] md:h-auto px-4 py-2 bg-[#1bae4f] text-black rounded-[14px] md:rounded-lg font-bold text-[15px] md:text-sm hover:brightness-110"
                >
                  Join
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </CardContent>
          </Card>
        </div>

        {workspaces.length > 0 ? (
          <div className="mt-6 md:mt-12">
            <h2 className="text-[24px] md:text-xl font-bold font-display flex items-center gap-2 mb-4 border-b border-[var(--border-subtle)] pb-2">
              <Users size={20} /> Your Workspaces
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...workspaces].sort((a, b) => {
                const aPinned = userId && a.pinnedBy?.includes(userId) ? 1 : 0;
                const bPinned = userId && b.pinnedBy?.includes(userId) ? 1 : 0;
                const aArchived = a.isArchived ? 1 : 0;
                const bArchived = b.isArchived ? 1 : 0;
                if (aArchived !== bArchived) return aArchived - bArchived; // Unarchived first
                if (aPinned !== bPinned) return bPinned - aPinned; // Pinned first
                return a.name.localeCompare(b.name);
              }).map((w) => (
                <div
                  key={w.id}
                  onClick={() => setDetailsWorkspaceId(w.id)}
                  className={`p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[18px] md:rounded-xl cursor-pointer hover:border-[var(--accent-primary)] hover:shadow-lg transition-all group relative flex flex-col justify-between ${w.isArchived ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-[18px] md:text-base text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate pr-8 flex items-center gap-2">
                      {w.name}
                      {userId && w.pinnedBy?.includes(userId) && <Pin size={12} className="text-[var(--accent-primary)] fill-current" />}
                      {w.isArchived && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Archived</span>}
                    </h3>
                    <div className="absolute top-2 right-2">
                      <WorkspaceCardMenu 
                        workspace={w}
                        onOpenDetails={() => setEditWorkspaceId(w.id)}
                        onOpenMembers={() => setMembersWorkspaceId(w.id)}
                        onOpenInvite={() => setInviteWorkspaceId(w.id)}
                        onOpenAnalytics={() => setAnalyticsWorkspaceId(w.id)}
                        onOpenCalendar={() => setCalendarWorkspaceId(w.id)}
                        onOpenSettings={() => setSettingsWorkspaceId(w.id)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-2 mt-auto">
                    <p className="text-[14px] md:text-xs text-[var(--text-secondary)] font-mono">
                      {w.members.length} member{w.members.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[14px] md:text-[10px] text-[var(--text-secondary)] bg-[#6cef9a] px-2 py-1 rounded border border-[var(--border-subtle)] font-bold">
                      Code: {w.inviteCode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 text-center text-[var(--text-secondary)]">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>
              Select a workspace from the dropdown above, or create/join one to
              see team metrics.
            </p>
          </div>
        )}
        
        <WorkspaceDetailsDrawer 
          workspace={workspaces.find(w => w.id === detailsWorkspaceId) || null}
          tasks={workspaceTasks} // Ideally all tasks for that workspace, but for now we only have workspaceTasks if currentWorkspaceId matches. Wait.
          isOpen={!!detailsWorkspaceId}
          onClose={() => setDetailsWorkspaceId(null)}
          onEnter={() => {
             setCurrentWorkspaceId(detailsWorkspaceId);
             setDetailsWorkspaceId(null);
          }}
        />
        
        <ManageMembersModal 
          workspace={workspaces.find(w => w.id === membersWorkspaceId) || null}
          isOpen={!!membersWorkspaceId}
          onClose={() => setMembersWorkspaceId(null)}
        />
        
        <InviteMembersModal
          workspace={workspaces.find(w => w.id === inviteWorkspaceId) || null}
          isOpen={!!inviteWorkspaceId}
          onClose={() => setInviteWorkspaceId(null)}
        />
        
        <EditWorkspaceModal
          workspace={workspaces.find(w => w.id === editWorkspaceId) || null}
          isOpen={!!editWorkspaceId}
          onClose={() => setEditWorkspaceId(null)}
        />

        <WorkspaceAnalyticsDrawer
          workspace={workspaces.find(w => w.id === analyticsWorkspaceId) || null}
          tasks={workspaceTasks}
          isOpen={!!analyticsWorkspaceId}
          onClose={() => setAnalyticsWorkspaceId(null)}
        />

        <WorkspaceCalendarDrawer
          workspace={workspaces.find(w => w.id === calendarWorkspaceId) || null}
          tasks={workspaceTasks}
          isOpen={!!calendarWorkspaceId}
          onClose={() => setCalendarWorkspaceId(null)}
        />

        <WorkspaceSettingsModal
          workspace={workspaces.find(w => w.id === settingsWorkspaceId) || null}
          isOpen={!!settingsWorkspaceId}
          onClose={() => setSettingsWorkspaceId(null)}
        />
        
      </div>
    );
  }

  // Calculate metrics for current workspace
  const evaluatedTasks = workspaceTasks.map((t) =>
    calculateTaskMetrics(t, userState, workspaceTasks),
  );

  const completedTasks = evaluatedTasks.filter(
    (t) => t.realityState.effectivePercent >= 100,
  );
  const completionRate =
    evaluatedTasks.length > 0
      ? completedTasks.length / evaluatedTasks.length
      : 0;

  const avgRiskScore = evaluatedTasks.length
    ? evaluatedTasks.reduce((acc, t) => acc + t.riskEngine.riskScore, 0) /
      evaluatedTasks.length
    : 0;
  const teamRiskTier =
    avgRiskScore > 75 ? "Red" : avgRiskScore > 40 ? "Yellow" : "Green";

  const avgExpected = evaluatedTasks.length
    ? evaluatedTasks.reduce(
        (acc, t) =>
          acc +
          (t.plannedState?.expectedProgressCurve?.[0]?.expectedPercent || 0),
        0,
      ) / evaluatedTasks.length
    : 0;
  const avgEffective = evaluatedTasks.length
    ? evaluatedTasks.reduce(
        (acc, t) => acc + (t.realityState?.effectivePercent || 0),
        0,
      ) / evaluatedTasks.length
    : 0;
  const teamRealityGap = avgExpected - avgEffective;

  // Member Workload & Blocker Detection
  const workloadByMember: Record<
    string,
    {
      effort: number;
      completedEffort: number;
      worstRisk: string;
      lastFocus: string | null;
      assigned: number;
      completed: number;
    }
  > = {};
  currentWorkspace.members.forEach((m) => {
    workloadByMember[m.userId] = {
      effort: 0,
      completedEffort: 0,
      worstRisk: "Green",
      lastFocus: null,
      assigned: 0,
      completed: 0,
    };
  });

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const blockedTasks: any[] = [];

  evaluatedTasks.forEach((t) => {
    const ownerId = (t as any).ownerId;
    const isCompleted = t.realityState.effectivePercent >= 100;

    if (ownerId && workloadByMember[ownerId]) {
      workloadByMember[ownerId].assigned += 1;
      workloadByMember[ownerId].effort += t.estimatedEffortHours;

      if (isCompleted) {
        workloadByMember[ownerId].completed += 1;
        workloadByMember[ownerId].completedEffort += t.estimatedEffortHours;
      }

      if (t.riskEngine.riskTier === "Red")
        workloadByMember[ownerId].worstRisk = "Red";
      else if (
        t.riskEngine.riskTier === "Yellow" &&
        workloadByMember[ownerId].worstRisk !== "Red"
      )
        workloadByMember[ownerId].worstRisk = "Yellow";

      const lastSession =
        t.realityState.focusSessions?.[t.realityState.focusSessions.length - 1];
      if (lastSession && lastSession.date) {
        try {
          if (
            !workloadByMember[ownerId].lastFocus ||
            new Date(lastSession.date) >
              new Date(workloadByMember[ownerId].lastFocus!)
          ) {
            workloadByMember[ownerId].lastFocus = lastSession.date;
          }
        } catch(e) {}
      }
    }

    if (!isCompleted && t.riskEngine.riskTier === "Red") {
      let reason = "High risk of missing deadline";
      if (!ownerId) reason = "Missing owner";
      else if (t.realityState.focusSessions.length === 0)
        reason = "Not progressing";
      else if (new Date(t.deadline) < new Date()) reason = "Overdue";

      blockedTasks.push({ ...t, blockedReason: reason });
    }
  });

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        avgRiskScore * 0.4 -
        Math.abs(teamRealityGap) * 0.3 +
        completionRate * 20 -
        blockedTasks.length * 5,
    ),
  );
  const healthTier =
    healthScore >= 80 ? "Healthy" : healthScore >= 50 ? "At Risk" : "Critical";
  const healthColor =
    healthScore >= 80
      ? "text-emerald-500"
      : healthScore >= 50
        ? "text-amber-500"
        : "text-red-500";

  const markComplete = async (task: any) => {
    if (!task) return;
    const isCompleted = task.realityState?.effectivePercent >= 100;

    // Toggle completion status
    const newPercent = isCompleted ? 0 : 100;

    await updateWorkspaceTask(task.id, {
      realityState: {
        ...task.realityState,
        effectivePercent: newPercent,
        confirmedPercent: newPercent,
        inferredPercent: newPercent,
      },
    });
  };

  return (
    <div className="px-4 py-5 md:p-8 pt-5 md:pt-20 pb-[calc(120px+env(safe-area-inset-bottom))] md:pb-8 max-w-7xl mx-auto w-full flex flex-col gap-5 md:gap-8 h-full overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => setCurrentWorkspaceId(null)}
            className="flex items-center gap-2 p-2 -ml-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <ChevronLeft size={24} />
            <span className="md:hidden font-bold">Back</span>
          </button>
          <div className="flex flex-col gap-4 md:gap-1 w-full md:w-auto">
            <h1 className="text-[34px] md:text-3xl font-display font-bold text-[var(--text-primary)] leading-tight">
              {currentWorkspace.name}
            </h1>
            <p className="text-[13px] md:text-sm text-[var(--text-secondary)] font-mono">
              Invite Code:{" "}
              <span className="text-[var(--accent-primary)] font-bold">
                {currentWorkspace.inviteCode}
              </span>
            </p>
            <span className="text-xs font-mono px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded w-fit mt-1 md:mt-0 md:ml-3 inline-block">
              AI COMMAND CENTER
            </span>
          </div>
        </div>
        <select
          value={currentWorkspace.id}
          onChange={(e) =>
            setCurrentWorkspaceId(
              e.target.value === "personal" ? null : e.target.value,
            )
          }
          className="w-full md:w-auto bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-[15px] md:text-sm font-bold shadow-sm cursor-pointer hover:border-[var(--accent-primary)]/50 transition-colors mt-2 md:mt-0"
        >
          <option value="personal">Personal</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] relative overflow-hidden group rounded-[18px] md:rounded-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckSquare size={48} />
          </div>
          <CardHeader className="pb-2 p-[18px] md:p-6 md:pb-2">
            <CardTitle className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Workspace Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[18px] pt-0 md:p-6 md:pt-0">
            <div className="text-3xl font-black font-mono text-[var(--text-primary)]">
              {completedTasks.length} / {evaluatedTasks.length}{" "}
              <span className="text-lg text-[var(--text-secondary)]">
                Tasks
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] mb-1">
              <span>Progress</span>
              <span>{(completionRate * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000"
                style={{ width: `${completionRate * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "border-l-4 rounded-[18px] md:rounded-xl",
            teamRiskTier === "Red"
              ? "border-l-red-500 bg-red-500/5"
              : teamRiskTier === "Yellow"
                ? "border-l-amber-500 bg-amber-500/5"
                : "border-l-emerald-500 bg-emerald-500/5",
          )}
        >
          <CardHeader className="pb-2 p-[18px] md:p-6 md:pb-2">
            <CardTitle className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} /> Team Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[18px] pt-0 md:p-6 md:pt-0">
            <div
              className={cn(
                "text-3xl font-black font-mono",
                teamRiskTier === "Red"
                  ? "text-red-500"
                  : teamRiskTier === "Yellow"
                    ? "text-amber-500"
                    : "text-emerald-500",
              )}
            >
              {avgRiskScore.toFixed(0)}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              Lower is better
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-blue-500/5 rounded-[18px] md:rounded-xl">
          <CardHeader className="pb-2 p-[18px] md:p-6 md:pb-2">
            <CardTitle className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} /> Team Reality Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[18px] pt-0 md:p-6 md:pt-0">
            <div className="text-3xl font-black font-mono text-blue-500">
              {teamRealityGap > 0 ? "+" : ""}
              {teamRealityGap.toFixed(1)}%
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              Aggregate Reality Gap
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border-[var(--border-subtle)] rounded-[18px] md:rounded-xl">
          <CardHeader className="pb-2 p-[18px] md:p-6 md:pb-2">
            <CardTitle className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <HeartPulse size={14} /> Team Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-[18px] pt-0 md:p-6 md:pt-0">
            <div className={cn("text-3xl font-black font-mono", healthColor)}>
              {healthScore.toFixed(0)}%
            </div>
            <p className={cn("text-xs mt-1 font-bold", healthColor)}>
              {healthTier} Team
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">
        <div className="lg:col-span-2 space-y-5 md:space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-[22px] md:text-xl font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
                <CheckSquare
                  size={20}
                  className="text-[var(--accent-primary)]"
                />{" "}
                Shared Tasks
              </h2>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-3 md:gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full md:flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[15px] md:text-sm focus:border-[var(--accent-primary)] outline-none transition-colors"
              />
              <button
                type="submit"
                className="w-full md:w-auto h-12 md:h-auto md:px-6 bg-[#1bae4f] text-black rounded-xl font-bold tracking-wide text-[15px] md:text-sm hover:brightness-110 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add
              </button>
            </form>

            <div className="space-y-4 mt-6">
              <AnimatePresence>
                {evaluatedTasks.map((task) => {
                  const owner = currentWorkspace.members.find(
                    (m) => m.userId === (task as any).ownerId,
                  );
                  const isMine = (task as any).ownerId === userId;
                  const isCompleted = task.realityState.effectivePercent >= 100;
                  const isInProgress =
                    task.realityState.effectivePercent > 0 && !isCompleted;

                  let statusLabel = "Pending";
                  let statusColor =
                    "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]";
                  if (isCompleted) {
                    statusLabel = "Completed";
                    statusColor =
                      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                  } else if (task.riskEngine.riskTier === "Red") {
                    statusLabel = "Blocked";
                    statusColor =
                      "bg-red-500/10 text-red-500 border-red-500/20";
                  } else if (isInProgress) {
                    statusLabel = "In Progress";
                    statusColor =
                      "bg-blue-500/10 text-blue-500 border-blue-500/20";
                  }

                  const loggedHours =
                    (task.realityState.focusSessions?.reduce(
                      (acc, s) => acc + s.durationMinutes,
                      0,
                    ) || 0) / 60;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={task.id}
                      className={cn(
                        "p-4 md:p-5 bg-[var(--bg-secondary)]/95 border rounded-[18px] md:rounded-2xl flex flex-col gap-4 transition-all group relative z-10 has-[[data-state=open]]:z-50 w-full",
                        isCompleted
                          ? "border-emerald-500/30 opacity-70"
                          : "border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-3 md:gap-4 min-w-0">
                          <button
                            onClick={() => markComplete(task)}
                            className={cn(
                              "mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-md border transition-all duration-300",
                              isCompleted
                                ? "bg-emerald-500 border-emerald-500 text-black"
                                : "bg-[var(--bg-primary)] border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] text-transparent hover:bg-[var(--accent-primary)]/20",
                            )}
                          >
                            <CheckSquare
                              size={14}
                              className={
                                isCompleted
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              }
                            />
                          </button>
                          <div className="min-w-0">
                            <h3
                              className={cn(
                                "font-bold text-[18px] md:text-lg text-[var(--text-primary)] transition-all flex items-center gap-2 flex-wrap break-words",
                                isCompleted
                                  ? "line-through text-[var(--text-secondary)]"
                                  : "",
                              )}
                            >
                              {task.title}
                              {task.flaggedForHelp && !isCompleted && (
                                 <span className="bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border border-red-500/50 flex items-center gap-1">
                                    <AlertTriangle size={10} /> Needs Help
                                 </span>
                              )}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                              <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-2 py-1 rounded-md border border-[var(--border-subtle)] text-[12px] md:text-xs text-[var(--text-secondary)]">
                                <UserCircle2 size={12} />
                                <span>
                                  {isMine
                                    ? "You"
                                    : owner?.displayName || "Unassigned"}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "md:hidden px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                  statusColor,
                                )}
                              >
                                {statusLabel}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                          <div
                            className={cn(
                              "hidden md:block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              statusColor,
                            )}
                          >
                            {statusLabel}
                          </div>
                          <TaskContextMenu
                            task={task}
                            onViewDetails={() => {
                              setSelectedTaskId(task.id);
                              setIsDetailsOpen(true);
                            }}
                          />
                        </div>
                      </div>

                      {isCompleted && (
                        <div className="pt-2 text-[12px] md:text-xs font-medium text-emerald-500 flex items-center gap-2">
                          <CheckCircle2 size={14} /> Completed by{" "}
                          {owner?.displayName || "Unknown"} on{" "}
                          {!isNaN(new Date(task.realityState.completedAt || task.realityState.focusSessions?.[task.realityState.focusSessions.length - 1]?.date || Date.now()).getTime())
                            ? new Date(
                                task.realityState.completedAt ||
                                task.realityState.focusSessions?.[
                                  task.realityState.focusSessions.length - 1
                                ]?.date || Date.now()
                              ).toLocaleDateString()
                            : 'Unknown'}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {evaluatedTasks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-16 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-[18px] md:rounded-2xl bg-[var(--bg-secondary)]/50 flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-[18px] md:rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                    <ListTodo
                      size={32}
                      className="text-[var(--accent-primary)]"
                    />
                  </div>
                  <h3 className="text-[20px] md:text-xl font-bold font-display text-[var(--text-primary)] mb-2">
                    Create your first shared task
                  </h3>
                  <p className="text-[15px] md:text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
                    Invite teammates and start collaborating. Tasks added here
                    will be visible to everyone in the workspace.
                  </p>
                  <button
                    onClick={() => document.querySelector("input")?.focus()}
                    className="px-6 py-3 bg-[var(--accent-primary)] text-black rounded-xl font-bold hover:brightness-110 transition-all shadow-[0_0_20px_var(--accent-primary)] shadow-opacity-20 flex items-center gap-2"
                  >
                    <Plus size={18} /> New Workspace Task
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Blocked Tasks Section */}
          {blockedTasks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[22px] md:text-lg font-bold font-display flex items-center gap-2 text-red-500 border-b border-red-500/20 pb-2">
                <ShieldAlert size={18} /> Blocked Tasks
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {blockedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-red-500/5 border border-red-500/20 rounded-[18px] md:rounded-xl flex flex-col gap-3 w-full"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-[var(--text-primary)] text-[16px] md:text-sm min-w-0 break-words">
                        {task.title}
                      </h4>
                      <span className="shrink-0 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/20">
                        Blocked
                      </span>
                    </div>
                    <div className="text-[13px] md:text-xs text-[var(--text-secondary)] flex flex-col gap-1.5">
                      <p>
                        <strong className="text-[var(--text-primary)]">
                          Reason:
                        </strong>{" "}
                        {task.blockedReason}
                      </p>
                      <p className="flex items-center gap-1.5 text-[var(--accent-primary)]">
                        <BrainCircuit size={12} />{" "}
                        <strong className="font-bold">AI Suggestion:</strong>{" "}
                        {task.blockedReason === "Missing owner"
                          ? "Assign an owner immediately."
                          : "Consider reassigning to a member with lower workload."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5 md:space-y-8">
          {/* AI Team Insights */}
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-subtle)] border-t-2 border-t-[var(--accent-primary)] shadow-xl relative overflow-hidden rounded-[18px] md:rounded-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <BrainCircuit size={120} />
            </div>
            <CardHeader className="pb-2 p-[18px] md:p-6 md:pb-2">
              <CardTitle className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider flex items-center gap-2">
                <BrainCircuit size={14} /> AI Team Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-[18px] pt-0 md:p-6 md:pt-0">
              <ul className="space-y-4">
                {completionRate > 0.7 && (
                  <li className="flex items-start gap-3 text-[15px] md:text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span className="text-[var(--text-primary)]">
                      The team is performing exceptionally well, with a{" "}
                      <strong>{(completionRate * 100).toFixed(0)}%</strong>{" "}
                      completion rate.
                    </span>
                  </li>
                )}
                {blockedTasks.length > 0 && (
                  <li className="flex items-start gap-3 text-[15px] md:text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span className="text-[var(--text-primary)]">
                      <strong>{blockedTasks.length} tasks</strong> are currently
                      blocked. Resolving them will improve health by{" "}
                      {(blockedTasks.length * 5).toFixed(0)}%.
                    </span>
                  </li>
                )}
                {currentWorkspace.members.length > 0 && (
                  <li className="flex items-start gap-3 text-[15px] md:text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                    <span className="text-[var(--text-primary)]">
                      Current completion probability for the cycle is{" "}
                      <strong>{healthScore.toFixed(0)}%</strong>.
                    </span>
                  </li>
                )}
                {evaluatedTasks.length === 0 && (
                  <li className="flex items-start gap-3 text-[15px] md:text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] mt-1.5 shrink-0" />
                    <span className="text-[var(--text-secondary)]">
                      Not enough data to generate insights. Add tasks to begin
                      analysis.
                    </span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Member Workload Analysis */}
          <div className="space-y-4">
            <h2 className="text-[22px] md:text-lg font-bold font-display flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
              <Users size={18} className="text-[var(--text-secondary)]" /> Team
              Workload
            </h2>

            <div className="space-y-4">
              {currentWorkspace.members.map((member) => {
                const data = workloadByMember[member.userId];
                const hasFocusIn24h =
                  data.lastFocus &&
                  new Date(data.lastFocus) > twentyFourHoursAgo;
                const isBlocked = data.worstRisk === "Red" && !hasFocusIn24h;

                return (
                  <div
                    key={member.userId}
                    className="p-[18px] md:p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[18px] md:rounded-xl relative overflow-hidden"
                  >
                    {isBlocked && (
                      <div className="absolute inset-0 bg-red-500/5 border border-red-500/50 flex items-center justify-end px-4 z-10 pointer-events-none">
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider bg-[var(--bg-primary)] px-2 py-1 rounded shadow-sm">
                          <AlertTriangle size={14} /> At Risk
                        </div>
                      </div>
                    )}
                    <div className="relative z-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-xs">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                          <h4 className="font-bold text-[var(--text-primary)] text-[15px] md:text-sm flex items-center gap-2">
                            {member.displayName}
                            {member.userId === userId && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-[#a2b7f0] text-black">
                                You
                              </span>
                            )}
                          </h4>
                        </div>
                        <div
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded",
                            data.worstRisk === "Red"
                              ? "text-red-500 bg-red-500/10"
                              : data.worstRisk === "Yellow"
                                ? "text-amber-500 bg-amber-500/10"
                                : "text-emerald-500 bg-emerald-500/10",
                          )}
                        >
                          {data.worstRisk} Risk
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-subtle)] text-center">
                          <p className="text-[11px] md:text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                            Tasks
                          </p>
                          <p className="text-[15px] md:text-sm font-bold font-mono text-[var(--text-primary)]">
                            {data.completed} / {data.assigned}
                          </p>
                        </div>
                        <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-subtle)] text-center">
                          <p className="text-[11px] md:text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                            Hours
                          </p>
                          <p className="text-[15px] md:text-sm font-bold font-mono text-[var(--text-primary)]">
                            {data.completedEffort} / {data.effort}h
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              data.worstRisk === "Red"
                                ? "bg-red-500"
                                : data.worstRisk === "Yellow"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500",
                            )}
                            style={{
                              width: `${Math.min(100, data.effort > 0 ? (data.completedEffort / data.effort) * 100 : 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workspace Activity Timeline */}
          <div className="space-y-4">
            <h2 className="text-[22px] md:text-lg font-bold font-display flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)]">
              <Activity size={18} className="text-[var(--text-secondary)]" />{" "}
              Recent Activity
            </h2>
            <div className="relative border-l border-[var(--border-subtle)] ml-3 pl-5 space-y-6 mt-4">
              {workspaceActivities && workspaceActivities.length > 0 ? (
                workspaceActivities.slice(0, 10).map((act, i) => {
                  let badgeColor = "border-[var(--accent-primary)] text-[var(--accent-primary)]";
                  if (act.type === 'create') badgeColor = "border-blue-500 text-blue-500";
                  else if (act.type === 'complete') badgeColor = "border-emerald-500 text-emerald-500";
                  else if (act.type === 'delete') badgeColor = "border-red-500 text-red-500";
                  else if (act.type === 'schedule') badgeColor = "border-amber-500 text-amber-500";
                  
                  return (
                    <div key={act.id || i} className="relative">
                      <div className={`absolute -left-[27px] p-1 bg-[var(--bg-primary)] rounded-full border ${badgeColor}`}>
                        <Activity size={10} />
                      </div>
                      <p className="text-[15px] md:text-sm text-[var(--text-primary)]">
                        <strong>{act.title}</strong>: {act.description}
                      </p>
                      <p className="text-[11px] md:text-[10px] text-[var(--text-muted)] mt-0.5">
                        {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-[15px] md:text-sm text-[var(--text-secondary)] italic">
                  No recent activity. Create or complete some tasks to generate logs!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskDetailsPanel
        task={evaluatedTasks?.find(t => t.id === selectedTaskId) || null}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTaskId(null);
        }}
        onPin={() => {
          const t = evaluatedTasks?.find(t => t.id === selectedTaskId);
          if (t) updateWorkspaceTask(t.id, { isPinned: !t.isPinned });
        }}
        onEdit={(updates) => {
          const t = evaluatedTasks?.find(t => t.id === selectedTaskId);
          if (t) {
             updateWorkspaceTask(t.id, updates);
          }
        }}
        onComplete={() => {
          const t = evaluatedTasks?.find(t => t.id === selectedTaskId);
          if (t) confirmWorkspaceTaskProgress(t.id, 100);
        }}
        onDelete={() => {
          const t = evaluatedTasks?.find(t => t.id === selectedTaskId);
          if (t && window.confirm("Are you sure you want to delete this task?")) {
            deleteWorkspaceTask(t.id);
            setIsDetailsOpen(false);
            setSelectedTaskId(null);
          }
        }}
      />
    </div>
  );
}
