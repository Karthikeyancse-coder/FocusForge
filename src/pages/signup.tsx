import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { PublicThemeToggle } from "../components/PublicThemeToggle";
import { ArrowLeft, Gamepad2, Sparkles, Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const rules = [
    { label: "8+ characters", test: (p: string) => p.length >= 8 },
    { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "Number", test: (p: string) => /[0-9]/.test(p) },
    { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const isValidPassword = rules.every((rule) => rule.test(password));
  const isPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;
  
  const isFormValid = fullName.trim().length > 0 && 
                      email.trim().length > 0 && 
                      isValidPassword && 
                      isPasswordsMatch;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    if (!isFormValid) return;
    
    setIsLoading(true);
    // Mock registration delay
    setTimeout(() => {
      navigate('/login');
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="h-screen bg-[var(--bg-primary)] flex flex-col md:flex-row overflow-hidden font-sans relative"
    >
      <div className="absolute top-8 right-8 sm:top-12 sm:right-12 z-50">
        <PublicThemeToggle />
      </div>
      
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 xl:p-24 relative z-10 overflow-y-auto no-scrollbar">
        <Link to="/" className="relative sm:absolute top-0 sm:top-12 left-0 sm:left-12 mb-6 sm:mb-0 flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors self-start">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="max-w-sm w-full mx-auto py-6 sm:py-12 md:py-0">
          <div className="mb-6 sm:mb-10 text-center sm:text-left mt-4 sm:mt-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_15px_var(--xp-glow)] mb-4 sm:mb-6 mx-auto sm:mx-0">
              <span className="text-white font-bold font-display text-lg sm:text-xl leading-none">F</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-1.5 sm:mb-2">Create Your Forge</h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-normal">Start your journey toward legendary productivity.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Chen"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-xs sm:placeholder:text-sm"
                required
              />
            </div>
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@academy.edu"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-xs sm:placeholder:text-sm"
                required
              />
            </div>
            
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 sm:py-3 pr-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-xs sm:placeholder:text-sm"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {hasSubmitted && !isValidPassword && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1">Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.</p>
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5 pt-1 sm:pt-2">
              <label className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full px-4 py-2.5 sm:py-3 pr-12 rounded-xl border bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 transition-all text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-xs sm:placeholder:text-sm ${
                    confirmPassword.length > 0 && !isPasswordsMatch && hasSubmitted
                      ? 'border-red-500/50 focus:ring-red-500/50' 
                      : 'border-[var(--border-subtle)] focus:ring-[var(--accent-primary)]/50'
                  }`}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword.length > 0 && !isPasswordsMatch && hasSubmitted && (
                <p className="text-red-500 text-[11px] sm:text-xs mt-1">Passwords do not match.</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 text-sm sm:text-base mt-4 sm:mt-6 relative overflow-hidden transition-all duration-300 shadow-[0_0_15px_var(--xp-glow)] opacity-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Sparkles size={20} />
                </motion.div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 sm:mt-8 flex items-center gap-4">
            <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
            <span className="text-[10px] sm:text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Or</span>
            <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
          </div>

          <div className="mt-4 sm:mt-8 space-y-3">
            <Button variant="outline" className="w-full h-11 sm:h-12 text-xs sm:text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
               <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
               Sign up with Google
            </Button>
          </div>

          <div className="mt-4 sm:mt-8 text-center text-xs sm:text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link to="/login" className="text-[var(--accent-primary)] font-medium hover:underline">
              Sign In
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
