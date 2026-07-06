import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared panel surface for authenticated manager/pharmacist workspaces */
export const workspacePanelClass =
  "overflow-hidden rounded-[1.75rem] border border-white/14 bg-[linear-gradient(160deg,rgba(255,255,255,0.07)_0%,rgba(11,25,46,0.92)_42%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_28px_70px_-35px_rgba(0,0,0,0.88)]";

export const workspaceInnerPanelClass =
  "rounded-xl border border-white/12 bg-[#0a1628]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

export function WorkspacePanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(workspacePanelClass, className)}>{children}</div>;
}

export function WorkspaceInnerPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(workspaceInnerPanelClass, className)}>{children}</div>;
}

export function WorkspaceStat({
  label,
  value,
  tone = "text-white",
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: string;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <WorkspaceInnerPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/45">{label}</p>
          <p className={cn("mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl", tone)}>{value}</p>
          {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-apex-orange/25 bg-apex-orange/12">
            <Icon className="h-4 w-4 text-apex-orange-light" />
          </div>
        ) : null}
      </div>
    </WorkspaceInnerPanel>
  );
}

export function WorkspaceSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-7">
      <div>
        <p className="display-kicker text-apex-orange/90">Manager workspace</p>
        <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/55">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
