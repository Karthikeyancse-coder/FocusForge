import React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "safe" | "attention" | "high" | "outline"
  className?: string
  children?: React.ReactNode
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)]": variant === "default",
          "border-transparent bg-[var(--risk-safe)]/10 text-[var(--risk-safe)]": variant === "safe",
          "border-transparent bg-[var(--risk-attention)]/10 text-[var(--risk-attention)]": variant === "attention",
          "border-transparent bg-[var(--risk-high)]/10 text-[var(--risk-high)]": variant === "high",
          "text-[var(--text-primary)]": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
