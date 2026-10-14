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
            radial-gradient(ellipse 76% 58% at 0% 0%, rgba(232, 149, 30, ${variant === "cinematic" ? "0.22" : "0.16"}), transparent 58%),
            radial-gradient(ellipse 78% 64% at 100% 8%, rgba(30, 64, 175, 0.24), transparent 58%),
            linear-gradient(145deg, #060e1a 0%, #0b192e 50%, #102844 100%)
          `,
        }}
      />

      {/* Scan line — cinematic only */}
      {variant === "cinematic" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-[linear-gradient(180deg,rgba(242,165,47,0.045),transparent)]" />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-apex-orange/45 to-transparent" />

      {children}
    </div>
  );
}
