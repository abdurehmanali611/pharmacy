import type { LucideIcon } from "lucide-react";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared panel surface for authenticated manager/pharmacist workspaces */
export const workspacePanelClass =
  "workspace-panel-surface overflow-hidden rounded-[1.5rem] border border-apex-orange/16 bg-[linear-gradient(145deg,#15263c_0%,#0f1c2e_58%,#0c1828_100%)] shadow-[inset_0_1px_0_rgba(255,214,160,0.08),0_18px_46px_-32px_rgba(0,0,0,0.78)]";

export const workspaceInnerPanelClass =
  "workspace-inner-surface rounded-xl border border-apex-orange/12 bg-[linear-gradient(145deg,#173049_0%,#12263f_100%)] shadow-[inset_0_1px_0_rgba(255,214,160,0.07)]";

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
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-apex-orange-light/80">{label}</p>
          <p className={cn("mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl", tone)}>{value}</p>
          {hint ? <p className="mt-1 text-xs text-white/60">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-apex-orange/35 bg-apex-orange/18">
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
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-apex-orange/12 bg-[linear-gradient(100deg,rgba(232,149,30,0.1),transparent)] px-6 py-5 sm:px-7">
      <div>
        <p className="display-kicker text-apex-orange-light">Manager workspace</p>
        <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/65">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function WorkspaceModuleHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b border-apex-orange/12 bg-[linear-gradient(100deg,rgba(232,149,30,0.08),transparent)] px-6 pt-5 pb-5">
      <p className="display-kicker text-apex-orange-light/85">{kicker}</p>
      <CardTitle className="mt-2 font-display text-xl font-bold text-white/95">{title}</CardTitle>
      <CardDescription className="mt-1.5 text-sm leading-6 text-white/65">{description}</CardDescription>
    </CardHeader>
  );
}
