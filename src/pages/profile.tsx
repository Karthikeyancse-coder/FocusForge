import React, { useState, useEffect } from "react";
import profileAvatarImage from "../assets/images/regenerated_image_1782639024347.jpg";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Save, LogOut, User, Bell, Shield, Github, Linkedin, Mail, Upload, Key, Smartphone, Globe, Briefcase, Moon, Sun } from "lucide-react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../components/theme-provider";

export default function Profile() {
  const navigate = useNavigate();
  const { userState, updateProfile } = useUser();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  
  // Preferences State
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(() => {
    return localStorage.getItem("quiet_hours_enabled") !== "false";
  });
  const [quietHoursStart, setQuietHoursStart] = useState(() => {
    return localStorage.getItem("quiet_hours_start") || "22:00";
  });
  const [quietHoursEnd, setQuietHoursEnd] = useState(() => {
    return localStorage.getItem("quiet_hours_end") || "07:00";
  });
  const [snoozeDuration, setSnoozeDuration] = useState(() => {
    return localStorage.getItem("snooze_duration") || "10";
  });
  const [notificationGrouping, setNotificationGrouping] = useState(() => {
    return localStorage.getItem("notification_grouping") !== "false";
  });

  const savePreferences = () => {
    localStorage.setItem("quiet_hours_enabled", String(quietHoursEnabled));
    localStorage.setItem("quiet_hours_start", quietHoursStart);
    localStorage.setItem("quiet_hours_end", quietHoursEnd);
    localStorage.setItem("snooze_duration", snoozeDuration);
    localStorage.setItem("notification_grouping", String(notificationGrouping));
  };

  useEffect(() => {
    savePreferences();
  }, [quietHoursEnabled, quietHoursStart, quietHoursEnd, snoozeDuration, notificationGrouping]);

  // Form State
  const [name, setName] = useState(userState.name);
  const [email, setEmail] = useState(userState.email || "");
  const [bio, setBio] = useState("Passionate learner and developer striving for continuous improvement.");
  const [role, setRole] = useState("Software Engineer");
  const [location, setLocation] = useState("San Francisco, CA");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(userState.name);
    setEmail(userState.email || "");
  }, [userState.name, userState.email]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Mock save delay
    setTimeout(() => {
      updateProfile(name);
      setIsSaving(false);
    }, 800);
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="max-w-4xl mx-auto pt-16 md:pt-20 px-4 pb-24">
      <div className="mb-8">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold font-display tracking-tight">Account Settings</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your identity, preferences, and security in the Forge.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="col-span-1 space-y-2">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'profile' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'}`}
           >
             <User size={18} /> Public Profile
           </button>
           <button 
             onClick={() => setActiveTab('preferences')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'preferences' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'}`}
           >
             <Bell size={18} /> Preferences
           </button>
           <button 
             onClick={() => setActiveTab('security')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'security' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'}`}
           >
             <Shield size={18} /> Security
           </button>

           <div className="pt-6 mt-6 border-t border-[var(--border-subtle)] space-y-2">
             <button 
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
               className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
             >
               <div className="flex items-center gap-3">
                 {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} 
                 {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
               </div>
             </button>
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-[var(--risk-high)] hover:bg-[var(--risk-high)]/10">
               <LogOut size={18} /> Sign Out
             </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="col-span-1 md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <Card className="border-[var(--border-subtle)] shadow-sm overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-[var(--accent-primary)] to-emerald-400"></div>
                  <CardContent className="px-8 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 mb-8">
                       <div className="relative group">
                          <div className="w-32 h-32 rounded-full bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] overflow-hidden shadow-xl">
                             <img src={profileAvatarImage} alt={name} className="w-full h-full object-cover" />
                          </div>
                          <button className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full transition-all">
                             <Upload size={24} />
                          </button>
                       </div>
                       <div className="flex-1 pb-2">
                          <h2 className="text-2xl font-bold font-display">{name}</h2>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1.5"><Briefcase size={14} /> {role}</span>
                            <span className="flex items-center gap-1.5"><Globe size={14} /> {location}</span>
                          </div>
                       </div>
                       <div className="pb-2">
                         <Badge variant="outline" className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 px-3 py-1">
                            {userState.characterClass} Level {userState.level}
                         </Badge>
                       </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6 pt-4 border-t border-[var(--border-subtle)]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Full Name</label>
                          <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Role / Title</label>
                          <input 
                            type="text" 
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                            required
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Bio</label>
                          <textarea 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)] resize-none"
                          />
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSaving} className="shadow-[0_0_15px_var(--xp-glow)]">
                          {isSaving ? "Saving changes..." : <><Save size={16} className="mr-2" /> Save Profile</>}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-[var(--border-subtle)] shadow-sm">
                   <CardHeader className="border-b border-[var(--border-subtle)]">
                     <CardTitle className="text-lg">Connected Accounts</CardTitle>
                     <p className="text-sm text-[var(--text-muted)] mt-1">Link your accounts to sync progress.</p>
                   </CardHeader>
                   <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                              <Github size={20} />
                           </div>
                           <div>
                             <p className="font-semibold text-sm text-[var(--text-primary)]">GitHub</p>
                             <p className="text-xs text-[var(--text-muted)]">Not connected</p>
                           </div>
                         </div>
                         <Button variant="outline" size="sm">Connect</Button>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Linkedin size={20} />
                           </div>
                           <div>
                             <p className="font-semibold text-sm text-[var(--text-primary)]">LinkedIn</p>
                             <p className="text-xs text-[var(--text-muted)]">Connected as Alex Chen</p>
                           </div>
                         </div>
                         <Button variant="outline" size="sm" className="text-[var(--text-muted)]">Disconnect</Button>
                      </div>
                   </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                 <Card className="border-[var(--border-subtle)] shadow-sm">
                    <CardHeader className="border-b border-[var(--border-subtle)]">
                      <CardTitle className="text-lg">Appearance</CardTitle>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Customize the interface theme.</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent-primary)]">
                                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                             </div>
                             <div>
                                <p className="font-medium text-[var(--text-primary)]">Dark Mode</p>
                                <p className="text-sm text-[var(--text-muted)] mt-1">Toggle between light and dark themes.</p>
                             </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={theme === 'dark'}
                              onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                          </label>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="border-[var(--border-subtle)] shadow-sm">
                   <CardHeader className="border-b border-[var(--border-subtle)]">
                     <CardTitle className="text-lg">Notifications</CardTitle>
                     <p className="text-sm text-[var(--text-muted)] mt-1">Choose what updates you want to receive.</p>
                   </CardHeader>
                   <CardContent className="pt-6 space-y-6">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="font-medium text-[var(--text-primary)]">Daily Reminders</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Get reminded to keep your streak alive.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" defaultChecked />
                           <div className="w-11 h-6 bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                         </label>
                      </div>
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="font-medium text-[var(--text-primary)]">Level Up Alerts</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Receive notifications when your character levels up.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" defaultChecked />
                           <div className="w-11 h-6 bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                         </label>
                      </div>
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="font-medium text-[var(--text-primary)]">Weekly Digest</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Receive a weekly summary of your focus hours and tasks.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" />
                           <div className="w-11 h-6 bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                         </label>
                      </div>

                      <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between">
                         <div>
                            <p className="font-medium text-[var(--text-primary)]">Intelligent Grouping</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Combine similar alerts into single, informative digests instead of separate notifications.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                             type="checkbox" 
                             checked={notificationGrouping}
                             onChange={(e) => setNotificationGrouping(e.target.checked)}
                             className="sr-only peer" 
                           />
                           <div className="w-11 h-6 bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                         </label>
                      </div>
                   </CardContent>
                 </Card>

                 <Card className="border-[var(--border-subtle)] shadow-sm">
                    <CardHeader className="border-b border-[var(--border-subtle)]">
                      <CardTitle className="text-lg">Quiet Hours (Do Not Disturb)</CardTitle>
                      <p className="text-sm text-[var(--text-muted)] mt-1">During quiet hours, only critical tier alerts will trigger notification sounds or popups.</p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                       <div className="flex items-center justify-between">
                          <div>
                             <p className="font-medium text-[var(--text-primary)]">Enable Quiet Hours</p>
                             <p className="text-sm text-[var(--text-muted)] mt-1">Silence reminders during specified interval.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={quietHoursEnabled}
                              onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                          </label>
                       </div>

                       {quietHoursEnabled && (
                          <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Start Time</label>
                                <input 
                                   type="time" 
                                   value={quietHoursStart}
                                   onChange={(e) => setQuietHoursStart(e.target.value)}
                                   className="w-full px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-sm text-[var(--text-primary)]"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">End Time</label>
                                <input 
                                   type="time" 
                                   value={quietHoursEnd}
                                   onChange={(e) => setQuietHoursEnd(e.target.value)}
                                   className="w-full px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-sm text-[var(--text-primary)]"
                                />
                             </div>
                          </div>
                       )}
                    </CardContent>
                 </Card>

                 <Card className="border-[var(--border-subtle)] shadow-sm">
                    <CardHeader className="border-b border-[var(--border-subtle)]">
                      <CardTitle className="text-lg">Snooze Settings</CardTitle>
                      <p className="text-sm text-[var(--text-muted)] mt-1">Configure default snooze time for mobile notification action options.</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                       <div className="space-y-2 max-w-sm">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Default Snooze Interval</label>
                          <select 
                             value={snoozeDuration}
                             onChange={(e) => setSnoozeDuration(e.target.value)}
                             className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                          >
                             <option value="10">10 Minutes</option>
                             <option value="30">30 Minutes</option>
                             <option value="60">1 Hour</option>
                             <option value="1440">Tomorrow</option>
                          </select>
                       </div>
                    </CardContent>
                 </Card>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                 <Card className="border-[var(--border-subtle)] shadow-sm">
                   <CardHeader className="border-b border-[var(--border-subtle)]">
                     <CardTitle className="text-lg">Security Settings</CardTitle>
                     <p className="text-sm text-[var(--text-muted)] mt-1">Manage your password and authentication.</p>
                   </CardHeader>
                   <CardContent className="pt-6 space-y-6">
                      <div className="space-y-4 max-w-sm">
                         <div className="space-y-2">
                           <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2"><Key size={14} /> Current Password</label>
                           <input 
                             type="password" 
                             className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                             placeholder="••••••••"
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium text-[var(--text-secondary)]">New Password</label>
                           <input 
                             type="password" 
                             className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                           />
                         </div>
                         <Button className="w-full">Update Password</Button>
                      </div>

                      <div className="pt-6 border-t border-[var(--border-subtle)]">
                         <h3 className="font-medium text-[var(--text-primary)] mb-4">Two-Factor Authentication</h3>
                         <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent-primary)]">
                                <Smartphone size={20} />
                             </div>
                             <div>
                               <p className="font-medium text-[var(--text-primary)] text-sm">Authenticator App</p>
                               <p className="text-xs text-[var(--text-muted)] mt-0.5">Use an app like Google Authenticator</p>
                             </div>
                           </div>
                           <Button variant="outline" size="sm">Enable 2FA</Button>
                         </div>
                      </div>
                   </CardContent>
                 </Card>

                 {/* Danger Zone */}
                 <div className="p-6 rounded-2xl border border-[var(--risk-high)]/20 bg-[var(--risk-high)]/5">
                    <h3 className="text-lg font-bold text-[var(--risk-high)] mb-2">Danger Zone</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-4">Deleting your account will permanently remove all your characters, XP, streaks, and focus history. This action cannot be reversed.</p>
                    <Button variant="outline" className="border-[var(--risk-high)] text-[var(--risk-high)] hover:bg-[var(--risk-high)] hover:text-white">
                      Delete Account
                    </Button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
