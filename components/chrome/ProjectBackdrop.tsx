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
      {/* Clean navy canvas with restrained brand lighting. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 54% at 0% 0%, rgba(245, 158, 11, ${variant === "cinematic" ? "0.34" : "0.26"}), transparent 58%),
            radial-gradient(ellipse 70% 56% at 100% 6%, rgba(139, 92, 246, 0.36), transparent 58%),
            radial-gradient(ellipse 60% 50% at 90% 100%, rgba(6, 182, 212, 0.26), transparent 60%),
            radial-gradient(ellipse 56% 46% at 0% 100%, rgba(244, 63, 94, 0.24), transparent 60%),
            linear-gradient(145deg, #06051a 0%, #0b1530 50%, #101a3c 100%)
          `,
        }}
      />

      {/* Scan line — cinematic only */}
      {variant === "cinematic" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-[linear-gradient(180deg,rgba(168,85,247,0.045),transparent)]" />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px spectrum-bar" />

      {children}
    </div>
  );
}
