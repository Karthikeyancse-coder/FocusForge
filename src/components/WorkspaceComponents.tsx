import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Workspace, Task } from "../types";
import { 
  MoreVertical, Edit2, Users, UserPlus, BarChart2, Calendar, 
  Settings, Pin, Archive, Trash2, X, Link as LinkIcon, Check, Copy
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";

export function WorkspaceCardMenu({ 
  workspace, 
  onOpenDetails, 
  onOpenMembers, 
  onOpenInvite,
  onOpenAnalytics,
  onOpenCalendar,
  onOpenSettings,
}: { 
  workspace: Workspace,
  onOpenDetails: () => void,
  onOpenMembers: () => void,
  onOpenInvite: () => void,
  onOpenAnalytics: () => void,
  onOpenCalendar: () => void,
  onOpenSettings: () => void,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  
  const { deleteWorkspace, updateWorkspace, userId } = useWorkspace();
  const isOwner = workspace.ownerId === userId;
  const isPinned = userId && workspace.pinnedBy?.includes(userId);
  const isArchived = workspace.isArchived;

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let top = rect.bottom + 8;
      
      if (window.innerWidth < 768) {
        const estimatedHeight = 420;
        const spaceBelow = window.innerHeight - rect.bottom;
        
        if (spaceBelow < estimatedHeight + 24) {
          top = Math.max(16, rect.top - estimatedHeight - 8);
        }
      }

      setMenuStyle({
        position: 'fixed',
        top,
        left: rect.right - 224, // 224 is w-56
      });

      if (window.innerWidth < 768) {
        // Precise adjustment after render
        setTimeout(() => {
          if (menuRef.current && buttonRef.current) {
            const mRect = menuRef.current.getBoundingClientRect();
            const bRect = buttonRef.current.getBoundingClientRect();
            const actualSpaceBelow = window.innerHeight - bRect.bottom;
            
            if (actualSpaceBelow < mRect.height + 24) {
              let newTop = bRect.top - mRect.height - 8;
              if (newTop < 16) newTop = 16;
              setMenuStyle(prev => ({ ...prev, top: newTop }));
            }
          }
        }, 0);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowDeleteConfirm(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button 
        ref={buttonRef}
        onClick={() => { setIsOpen(!isOpen); setShowDeleteConfirm(false); }}
        className="p-1 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-primary)] transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={menuStyle}
            className="w-56 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden backdrop-blur-xl py-1 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {!showDeleteConfirm ? (
              <>
                <div className="px-3 py-2 border-b border-[var(--border-subtle)]/50 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Workspace Actions</span>
                </div>
                
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onOpenDetails(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors">
                  <Edit2 size={14} /> Edit Workspace
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onOpenMembers(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors">
                  <Users size={14} /> Manage Members
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onOpenInvite(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors">
                  <UserPlus size={14} /> Invite Members
                </button>
                
                <div className="my-1 border-t border-[var(--border-subtle)]/50"></div>
                
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onOpenAnalytics(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors">
                  <BarChart2 size={14} /> Workspace Analytics
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onOpenCalendar(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors">
                  <Calendar size={14} /> Workspace Calendar
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); onOpenSettings(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors">
                  <Settings size={14} /> Workspace Settings
                </button>

                <div className="my-1 border-t border-[var(--border-subtle)]/50"></div>

                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setIsOpen(false); 
                    if (userId) {
                      const newPinnedBy = isPinned 
                        ? (workspace.pinnedBy || []).filter(id => id !== userId)
                        : [...(workspace.pinnedBy || []), userId];
                      updateWorkspace(workspace.id, { pinnedBy: newPinnedBy });
                    }
                  }} 
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors"
                >
                  <Pin size={14} className={isPinned ? "fill-current" : ""} /> {isPinned ? "Unpin Workspace" : "Pin Workspace"}
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setIsOpen(false); 
                    updateWorkspace(workspace.id, { isArchived: !isArchived });
                  }} 
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                >
                  <Archive size={14} className={isArchived ? "fill-current" : ""} /> {isArchived ? "Unarchive Workspace" : "Archive Workspace"}
                </button>
                
                <div className="my-1 border-t border-[var(--border-subtle)]/50"></div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }} 
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} /> Delete Workspace
                </button>
              </>
            ) : (
              <div className="p-3">
                <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Delete Workspace?</p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">This cannot be undone. All tasks and data will be lost.</p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                    className="flex-1 px-3 py-1.5 text-xs font-bold bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--text-muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation();
                      setIsOpen(false);
                      setShowDeleteConfirm(false);
                      deleteWorkspace(workspace.id);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// Add WorkspaceDetailsDrawer component
export function InviteMembersModal({
  workspace,
  isOpen,
  onClose,
}: {
  workspace: Workspace | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { updateWorkspace, userId } = useWorkspace();
  
  if (!isOpen || !workspace) return null;

  const isOwner = workspace.ownerId === userId;
  const inviteLink = `${window.location.origin}?invite=${workspace.inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewCode = async () => {
    if (window.confirm("Generate a new invite code? The old code will stop working.")) {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await updateWorkspace(workspace.id, { inviteCode: newCode });
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 relative w-full max-w-md shadow-2xl flex flex-col z-[10001]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                <UserPlus size={20} className="text-[var(--accent-primary)]" />
                Invite Members
              </h3>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-white p-2 bg-[var(--bg-primary)] rounded-full border border-[var(--border-subtle)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Invite Code</span>
                <span className="text-4xl font-black font-mono tracking-widest text-[var(--text-primary)]">{workspace.inviteCode}</span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-2">Invite Link</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={inviteLink}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none"
                  />
                  <button 
                    onClick={handleCopy}
                    className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {isOwner && (
                <div className="pt-4 border-t border-[var(--border-subtle)]">
                  <button 
                    onClick={generateNewCode}
                    className="w-full py-2 text-sm text-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Generate New Invite Code
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function ManageMembersModal({
  workspace,
  isOpen,
  onClose,
}: {
  workspace: Workspace | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { updateMemberRole, removeMember, userId } = useWorkspace();

  if (!isOpen || !workspace) return null;

  const isOwner = workspace.ownerId === userId;
  const currentUserRole = workspace.members.find(m => m.userId === userId)?.role || 'Member';
  const canManage = isOwner || currentUserRole === 'Admin';

  const groupedMembers = {
    Owner: workspace.members.filter(m => m.role === 'Owner' || workspace.ownerId === m.userId),
    Admins: workspace.members.filter(m => m.role === 'Admin' && workspace.ownerId !== m.userId),
    Members: workspace.members.filter(m => m.role !== 'Owner' && m.role !== 'Admin' && workspace.ownerId !== m.userId)
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 relative w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] z-[10001]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                <Users size={20} className="text-[var(--accent-primary)]" />
                Manage Members
              </h3>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-white p-2 bg-[var(--bg-primary)] rounded-full border border-[var(--border-subtle)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar">
              {Object.entries(groupedMembers).map(([group, members]) => {
                if (members.length === 0) return null;
                return (
                  <div key={group}>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-3">
                      {group}
                    </h4>
                    <div className="space-y-2">
                      {members.map(member => (
                        <div key={member.userId} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)]">
                              {member.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">{member.displayName} {member.userId === userId && "(You)"}</p>
                              <p className="text-xs text-[var(--text-secondary)]">{member.role || 'Member'}</p>
                            </div>
                          </div>
                          
                          {canManage && member.userId !== workspace.ownerId && (
                            <div className="flex items-center gap-2">
                              {isOwner && member.role !== 'Admin' && (
                                <button 
                                  onClick={() => updateMemberRole(workspace.id, member.userId, 'Admin')}
                                  className="text-xs px-2 py-1 border border-[var(--border-subtle)] rounded text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
                                >
                                  Promote
                                </button>
                              )}
                              {isOwner && member.role === 'Admin' && (
                                <button 
                                  onClick={() => updateMemberRole(workspace.id, member.userId, 'Member')}
                                  className="text-xs px-2 py-1 border border-[var(--border-subtle)] rounded text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500"
                                >
                                  Demote
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  if(window.confirm(`Remove ${member.displayName} from the workspace?`)) {
                                    removeMember(workspace.id, member.userId);
                                  }
                                }}
                                className="text-xs px-2 py-1 border border-[var(--border-subtle)] rounded text-red-500 hover:bg-red-500/10"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
} 
export function WorkspaceDetailsDrawer({ 
  workspace, 
  tasks,
  isOpen, 
  onClose,
  onEnter
}: { 
  workspace: Workspace | null, 
  tasks: Task[],
  isOpen: boolean, 
  onClose: () => void,
  onEnter: () => void
}) {
  if (!isOpen || !workspace) return null;
  const completedTasks = tasks.filter(t => t.realityState.effectivePercent >= 100).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={onClose}
          ></motion.div>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md h-full bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] relative z-[9999] flex flex-col shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] truncate max-w-[250px]">
                {workspace.name}
              </h2>
              <button
                onClick={onClose}
                className="p-2 border border-[var(--border-subtle)] rounded-full text-[var(--text-muted)] hover:text-white bg-[var(--bg-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-3">
                  Description
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {workspace.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col justify-center">
                  <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Users size={14}/> Members</span>
                  <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{workspace.members.length}</span>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col justify-center">
                  <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Check size={14}/> Tasks Done</span>
                  <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{completedTasks} / {totalTasks}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-3">
                  Completion Rate
                </h3>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1 h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div 
                      className="h-full bg-[var(--accent-primary)] shadow-[0_0_10px_rgba(0,255,157,0.5)]" 
                      style={{ width: `${completionRate}%` }} 
                    />
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--text-primary)]">{completionRate.toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-3">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {/* Mock Activity Data as per prompt */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-[var(--text-primary)] font-medium">Alex</span> completed: <span className="text-[var(--text-secondary)] italic">Landing Page</span>
                    </div>
                    <span className="text-[var(--text-muted)] text-xs">2h ago</span>
                  </div>
                  <div className="border-t border-[var(--border-subtle)]/50 border-dashed"></div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-[var(--text-primary)] font-medium">John</span> joined workspace
                    </div>
                    <span className="text-[var(--text-muted)] text-xs">Yesterday</span>
                  </div>
                  <div className="border-t border-[var(--border-subtle)]/50 border-dashed"></div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      Risk score improved
                    </div>
                    <span className="text-[var(--text-muted)] text-xs">Today</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)]">
               <button onClick={() => { onEnter(); onClose(); }} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-black rounded-xl font-bold hover:brightness-110 shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all">
                 Enter Workspace
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function EditWorkspaceModal({
  workspace,
  isOpen,
  onClose,
}: {
  workspace: Workspace | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { updateWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  useEffect(() => {
    if (workspace && isOpen) {
      setName(workspace.name || "");
      setDescription(workspace.description || "");
    }
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateWorkspace(workspace.id, {
      name: name.trim(),
      description: description.trim(),
    });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 relative w-full max-w-md shadow-2xl flex flex-col z-[10001]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                <Edit2 size={20} className="text-[var(--accent-primary)]" />
                Edit Workspace
              </h3>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-white p-2 bg-[var(--bg-primary)] rounded-full border border-[var(--border-subtle)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-2">Workspace Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-2">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] h-24 resize-none focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
                <button 
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent-primary)] text-black border border-[var(--accent-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function WorkspaceAnalyticsDrawer({
  workspace,
  tasks,
  isOpen,
  onClose,
}: {
  workspace: Workspace | null;
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !workspace) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.realityState.effectivePercent >= 100).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const avgRisk = tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.riskEngine.riskScore, 0) / tasks.length : 0;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={onClose}
          ></motion.div>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md h-full bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] relative z-[9999] flex flex-col shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] flex items-center gap-2">
                <BarChart2 size={20} className="text-[var(--accent-primary)]" />
                Workspace Analytics
              </h2>
              <button
                onClick={onClose}
                className="p-2 border border-[var(--border-subtle)] rounded-full text-[var(--text-muted)] hover:text-white bg-[var(--bg-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest block mb-2">Total Tasks</span>
                  <span className="text-3xl font-black font-mono text-[var(--text-primary)]">{totalTasks}</span>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest block mb-2">Completed</span>
                  <span className="text-3xl font-black font-mono text-[var(--text-primary)]">{completedTasks}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-3">
                  Completion Rate
                </h3>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1 h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div 
                      className="h-full bg-[var(--accent-primary)] shadow-[0_0_10px_rgba(0,255,157,0.5)]" 
                      style={{ width: `${completionRate}%` }} 
                    />
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--text-primary)]">{completionRate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest block mb-2">Avg Risk</span>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black font-mono text-[var(--text-primary)]">{avgRisk.toFixed(0)}</span>
                    <span className="text-xs text-[var(--text-secondary)] mb-1">/ 100</span>
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest block mb-2">Team Productivity</span>
                  <span className="text-2xl font-black font-mono text-[var(--accent-primary)]">High</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function WorkspaceCalendarDrawer({
  workspace,
  tasks,
  isOpen,
  onClose,
}: {
  workspace: Workspace | null;
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !workspace) return null;

  // Group tasks by deadline (YYYY-MM-DD)
  const groupedTasks = tasks.reduce((acc, t) => {
    let d = "Unknown Date";
    try {
      if (t.deadline) {
        d = new Date(t.deadline).toISOString().split('T')[0];
      }
    } catch(e) {}
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {} as Record<string, Task[]>);

  const dates = Object.keys(groupedTasks).sort();

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={onClose}
          ></motion.div>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-md h-full bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] relative z-[9999] flex flex-col shadow-2xl"
          >
            <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] flex items-center gap-2">
                <Calendar size={20} className="text-[var(--accent-primary)]" />
                Calendar
              </h2>
              <button
                onClick={onClose}
                className="p-2 border border-[var(--border-subtle)] rounded-full text-[var(--text-muted)] hover:text-white bg-[var(--bg-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {dates.length === 0 ? (
                <div className="text-center text-[var(--text-secondary)] mt-10">
                  No tasks with deadlines found.
                </div>
              ) : (
                dates.map(d => (
                  <div key={d} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] border-b border-[var(--border-subtle)] pb-2">
                      {d === "Unknown Date" ? d : new Date(d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </h3>
                    <div className="space-y-2">
                      {groupedTasks[d].map(t => (
                        <div key={t.id} className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
                          <span className={`text-sm ${t.realityState.effectivePercent >= 100 ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)] font-medium'}`}>
                            {t.title}
                          </span>
                          {t.realityState.effectivePercent >= 100 && (
                            <Check size={14} className="text-[var(--accent-primary)]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function WorkspaceSettingsModal({
  workspace,
  isOpen,
  onClose,
}: {
  workspace: Workspace | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { updateWorkspace, userId } = useWorkspace();
  const [permissions, setPermissions] = useState(workspace?.settings?.permissions || {
    createTasks: 'All',
    editTasks: 'All',
    deleteTasks: 'AdminOnly',
    inviteMembers: 'AdminOnly'
  });
  
  useEffect(() => {
    if (workspace && isOpen) {
      setPermissions(workspace.settings?.permissions || {
        createTasks: 'All',
        editTasks: 'All',
        deleteTasks: 'AdminOnly',
        inviteMembers: 'AdminOnly'
      });
    }
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const isOwner = workspace.ownerId === userId;

  const handleSave = async () => {
    await updateWorkspace(workspace.id, {
      settings: {
        ...workspace.settings,
        permissions: permissions as any
      }
    });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          ></motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 relative w-full max-w-md shadow-2xl flex flex-col z-[10001]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                <Settings size={20} className="text-[var(--accent-primary)]" />
                Workspace Settings
              </h3>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-white p-2 bg-[var(--bg-primary)] rounded-full border border-[var(--border-subtle)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-4">
                  Permissions
                </h4>
                
                <div className="space-y-4">
                  {(['createTasks', 'editTasks', 'deleteTasks', 'inviteMembers'] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm text-[var(--text-primary)] font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <select 
                        disabled={!isOwner}
                        value={permissions[key]}
                        onChange={(e) => setPermissions({ ...permissions, [key]: e.target.value })}
                        className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      >
                        <option value="All">All Members</option>
                        <option value="AdminOnly">Admins Only</option>
                        <option value="OwnerOnly">Owner Only</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {isOwner && (
                <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
                  <button 
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent-primary)] text-black border border-[var(--accent-primary)] hover:brightness-110 shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all"
                  >
                    Save Settings
                  </button>
                </div>
              )}
              {!isOwner && (
                <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                  Only the workspace owner can modify settings.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
