import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

interface PublicThemeToggleProps {
  className?: string;
}

export function PublicThemeToggle({ className = "" }: PublicThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`p-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-300 shadow-sm ${className}`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
