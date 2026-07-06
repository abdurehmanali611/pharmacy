"use client";

import { cn } from "@/lib/utils";

export function ProjectBackdrop({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "cinematic";
}) {
  return (
    <div className={cn("relative isolate min-h-svh overflow-hidden bg-apex-navy-deep text-white", className)}>
      {/* Aurora base */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 0% 0%, rgba(232, 149, 30, ${variant === "cinematic" ? "0.26" : "0.18"}), transparent 52%),
            radial-gradient(ellipse 70% 55% at 100% 5%, rgba(35, 70, 120, 0.45), transparent 50%),
            radial-gradient(ellipse 80% 60% at 50% 100%, rgba(232, 149, 30, 0.08), transparent 55%),
            linear-gradient(168deg, #040a12 0%, #0b192e 42%, #0e2240 100%)
          `,
        }}
      />

      {/* Noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 animate-pulse-grid [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:56px_56px]",
          variant === "cinematic" ? "opacity-35" : "opacity-25",
        )}
      />

      {/* Scan line — cinematic only */}
      {variant === "cinematic" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%] animate-scan-line bg-[linear-gradient(180deg,rgba(232,149,30,0.06),transparent)]" />
      ) : null}

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(4,10,18,0.55)_100%)]" />

      {/* Orbs */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(232,149,30,0.35),rgba(232,149,30,0)_68%)] blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(40,80,140,0.32),rgba(40,80,140,0)_65%)] blur-3xl animate-float-medium" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(232,149,30,0.12),rgba(232,149,30,0)_70%)] blur-3xl animate-float-slow" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      {children}
    </div>
  );
}
