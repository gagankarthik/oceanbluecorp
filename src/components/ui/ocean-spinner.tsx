"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface OceanSpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function OceanSpinner({ size = 88, label, className }: OceanSpinnerProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `og_${uid}`;
  const glowId = `gw_${uid}`;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <svg width={size} height={size} viewBox="0 0 100 100" role="status" aria-label={label ?? "Loading"}>
        <defs>
          <radialGradient id={gradId} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track rings */}
        <circle cx="50" cy="50" r="43" fill="none" stroke="#dbeafe" strokeWidth="5" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#e0f2fe" strokeWidth="4" />
        <circle cx="50" cy="50" r="17" fill="none" stroke="#ecfdf5" strokeWidth="3.5" />

        {/* Outer arc — blue, clockwise, slow */}
        <circle
          cx="50" cy="50" r="43"
          fill="none" stroke="#2563eb" strokeWidth="5"
          strokeDasharray="68 202" strokeLinecap="round"
          filter={`url(#${glowId})`}
        >
          <animateTransform
            attributeName="transform" type="rotate"
            from="0 50 50" to="360 50 50"
            dur="2.4s" repeatCount="indefinite"
          />
        </circle>

        {/* Middle arc — cyan, counter-clockwise, medium */}
        <circle
          cx="50" cy="50" r="30"
          fill="none" stroke="#0891b2" strokeWidth="4"
          strokeDasharray="47 141" strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform" type="rotate"
            from="360 50 50" to="0 50 50"
            dur="1.8s" repeatCount="indefinite"
          />
        </circle>

        {/* Inner arc — emerald, clockwise, fast */}
        <circle
          cx="50" cy="50" r="17"
          fill="none" stroke="#059669" strokeWidth="3.5"
          strokeDasharray="27 80" strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform" type="rotate"
            from="0 50 50" to="360 50 50"
            dur="1.1s" repeatCount="indefinite"
          />
        </circle>

        {/* Center gradient dot */}
        <circle cx="50" cy="50" r="9" fill={`url(#${gradId})`} />

        {/* Pulse ring around center */}
        <circle cx="50" cy="50" r="9" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0">
          <animate attributeName="r" values="9;16;9" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {label && (
        <p className="text-sm font-medium text-slate-500 tracking-wide animate-pulse">{label}</p>
      )}
    </div>
  );
}

/** Full-viewport-height centred spinner — drop-in for page-level loading guards */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <OceanSpinner size={88} label={label} />
    </div>
  );
}

/** Small inline spinner for use inside cards / tables */
export function InlineSpinner({ size = 36, className }: { size?: number; className?: string }) {
  return <OceanSpinner size={size} className={className} />;
}
