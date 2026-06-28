import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { PublicThemeToggle } from "../components/PublicThemeToggle";
import { ArrowLeft, Gamepad2, Sparkles } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock authentication delay
    setTimeout(() => {
      navigate('/app');
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="h-screen bg-[var(--bg-primary)] flex flex-col md:flex-row overflow-hidden font-sans relative"
    >
      <div className="absolute top-8 right-8 sm:top-12 sm:right-12 z-50">
        <PublicThemeToggle />
      </div>
      
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-24 relative z-10 overflow-y-auto no-scrollbar">
        <Link to="/" className="absolute top-8 left-8 sm:top-12 sm:left-12 flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="max-w-sm w-full mx-auto">
          <div className="mb-10 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_15px_var(--xp-glow)] mb-6 mx-auto sm:mx-0">
              <span className="text-white font-bold font-display text-xl leading-none">F</span>
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Enter the Forge</h1>
            <p className="text-[var(--text-muted)]">Your journey to legendary productivity starts here.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
              <input 
                type="email" 
                defaultValue="hero@academy.edu"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                <a href="#" className="text-xs text-[var(--accent-primary)] hover:underline">Forgot?</a>
              </div>
              <input 
                type="password" 
                defaultValue="password123"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-[var(--text-primary)]"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base mt-4 shadow-[0_0_15px_var(--xp-glow)] relative overflow-hidden" 
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Sparkles size={20} />
                </motion.div>
              ) : (
                "Start Session"
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Or</span>
            <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
          </div>

          <div className="mt-8 space-y-3">
            <Button variant="outline" className="w-full h-12 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
               <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
               Continue with Google
            </Button>
          </div>

          <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[var(--accent-primary)] font-medium hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Right Visual Section */}
      <div className="hidden md:flex flex-1 relative bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] overflow-hidden items-center justify-center p-12">
         {/* Background elements */}
         <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-primary)]/5 rounded-full blur-[120px]"></div>
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="relative z-10 w-full max-w-lg"
         >
           <div className="glass p-8 rounded-3xl border border-[var(--border-subtle)] text-center relative overflow-hidden backdrop-blur-2xl">
             <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[var(--border-subtle)]">
               <Gamepad2 className="text-[var(--accent-primary)]" size={32} />
             </div>
             <blockquote className="text-xl font-display font-medium text-[var(--text-primary)] mb-6 leading-relaxed">
               "FocusForge has completely reframed how I study. Instead of dreading my deadlines, I'm genuinely excited to level up my Monk."
             </blockquote>
             <div className="flex items-center justify-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-[var(--accent-primary)] p-[2px]">
                 <div className="w-full h-full rounded-full bg-[var(--bg-primary)] border-2 border-transparent overflow-hidden">
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Alex" className="w-full h-full object-cover" />
                 </div>
               </div>
               <div className="text-left">
                  <div className="font-semibold text-sm">Alex Chen</div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">Level 50 • Ascended</div>
               </div>
             </div>
           </div>
         </motion.div>
      </div>
    </motion.div>
  );
}
