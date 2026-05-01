"use client";

import { cn } from "@/lib/utils";

export function ProjectBackdrop({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,98,0,0.18),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(18,208,192,0.15),transparent_24%),radial-gradient(circle_at_50%_80%,rgba(255,214,10,0.1),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),transparent_25%,transparent_72%,rgba(255,255,255,0.05)),linear-gradient(180deg,rgba(11,14,22,0.15),rgba(11,14,22,0.72))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:90px_90px]" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,160,67,0.55),rgba(255,160,67,0)_68%)] blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute right-[-3rem] top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(57,255,218,0.28),rgba(57,255,218,0)_65%)] blur-3xl animate-float-medium" />
      <div className="pointer-events-none absolute bottom-[-4rem] left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,66,138,0.2),rgba(255,66,138,0)_70%)] blur-3xl animate-float-slow" />
      {children}
    </div>
  );
}

