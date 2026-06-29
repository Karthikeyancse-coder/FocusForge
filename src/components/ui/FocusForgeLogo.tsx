import React from "react";

interface FocusForgeLogoProps {
  size?: number;
  className?: string;
  variant?: "gradient" | "flat" | "mono";
}

export function FocusForgeLogo({ size = 32, className = "", variant = "gradient" }: FocusForgeLogoProps) {
  // We use a high-definition 512x512 coordinate space for pixel-perfect paths.
  
  // Color configuration depending on variant
  const getSymbolColors = () => {
    switch (variant) {
      case "flat":
        return {
          hexagonOuter: "text-emerald-500",
          hexagonInner: "text-emerald-400",
          starLeft: "text-emerald-500",
          starRight: "text-emerald-600",
          coreBg: "fill-[var(--bg-primary)]",
          coreNode: "text-emerald-400",
          sparks: "text-emerald-400"
        };
      case "mono":
        return {
          hexagonOuter: "currentColor",
          hexagonInner: "currentColor",
          starLeft: "currentColor",
          starRight: "currentColor",
          coreBg: "fill-[var(--bg-primary)]",
          coreNode: "currentColor",
          sparks: "currentColor"
        };
      case "gradient":
      default:
        return {
          hexagonOuter: "text-white/25",
          hexagonInner: "text-white/40",
          starLeft: "text-white",
          starRight: "text-white/80",
          coreBg: "fill-[url(#logo-emerald-grad)]", // references the background gradient
          coreNode: "text-white",
          sparks: "text-white/90"
        };
    }
  };

  const colors = getSymbolColors();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Background Gradient for App Icon */}
        <linearGradient id="logo-emerald-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1FA463" />
          <stop offset="100%" stopColor="#36D978" />
        </linearGradient>

        {/* Glow Filter for Premium Depth */}
        <filter id="logo-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Inner Bevel/Overlay for App Icon */}
        <linearGradient id="logo-bevel-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* 1. Gradient Background Container (App Icon Container) */}
      {variant === "gradient" && (
        <>
          {/* Outer Ambient Glow under the container */}
          <rect
            x="28"
            y="28"
            width="456"
            height="456"
            rx="114"
            fill="url(#logo-emerald-grad)"
            opacity="0.3"
            filter="url(#logo-glow)"
          />
          {/* Main Rounded Square Container */}
          <rect
            x="24"
            y="24"
            width="464"
            height="464"
            rx="116"
            fill="url(#logo-emerald-grad)"
          />
          {/* Subtle Bevel Highlight Layer */}
          <rect
            x="24"
            y="24"
            width="464"
            height="464"
            rx="116"
            fill="url(#logo-bevel-grad)"
          />
          {/* Sleek Inner Border */}
          <rect
            x="25"
            y="25"
            width="462"
            height="462"
            rx="115"
            stroke="white"
            strokeWidth="4"
            strokeOpacity="0.12"
            fill="none"
          />
        </>
      )}

      {/* 2. Outer Hexagonal Reticle (Focus / Boundaries) */}
      <polygon
        points="256,96 394,176 394,336 256,416 118,336 118,176"
        fill="none"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${colors.hexagonOuter} transition-all duration-300`}
      />

      {/* 3. Inner Segmented Hexagonal Ring (AI Overlay) */}
      <polygon
        points="256,128 366,192 366,320 256,384 146,320 146,192"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="40 20 80 20"
        className={`${colors.hexagonInner} transition-all duration-300`}
      />

      {/* 4. Sleek 4-Point Forged Spark / Star (Progression, Growth, Creation) */}
      {/* Left Shard */}
      <polygon
        points="256,136 156,256 256,376 256,256"
        fill="currentColor"
        className={`${colors.starLeft} transition-all duration-300`}
      />
      {/* Right Shard */}
      <polygon
        points="256,136 356,256 256,376 256,256"
        fill="currentColor"
        className={`${colors.starRight} opacity-85 transition-all duration-300`}
      />

      {/* 5. Central AI Core (Intelligence Singularity) */}
      {/* Negative Space Core Diamond Cutout */}
      <polygon
        points="256,224 288,256 256,288 224,256"
        className={colors.coreBg}
      />
      {/* Inner Glowing AI Node */}
      <circle
        cx="256"
        cy="256"
        r="10"
        fill="currentColor"
        className={`${colors.coreNode} transition-all duration-300`}
      />

      {/* 6. Orbital Tiny Sparks (Forging Detail) */}
      {/* Top Right Spark */}
      <polygon
        points="340,154 346,160 340,166 334,160"
        fill="currentColor"
        className={`${colors.sparks} transition-all duration-300`}
      />
      {/* Bottom Left Spark */}
      <polygon
        points="172,346 178,352 172,358 166,352"
        fill="currentColor"
        className={`${colors.sparks} transition-all duration-300`}
      />
    </svg>
  );
}
