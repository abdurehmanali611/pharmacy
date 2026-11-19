import { BarChart3, type LucideIcon } from "lucide-react";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared panel surface for authenticated manager/pharmacist workspaces */
export const workspacePanelClass =
  "workspace-panel-surface overflow-hidden rounded-[1.5rem] border border-apex-orange/16 bg-[linear-gradient(145deg,#16124a_0%,#100e34_58%,#0b0a28_100%)] shadow-[inset_0_1px_0_rgba(233,213,255,0.08),0_18px_46px_-32px_rgba(0,0,0,0.78)]";

export const workspaceInnerPanelClass =
  "workspace-inner-surface rounded-xl border border-apex-orange/12 bg-[linear-gradient(145deg,#1d1858_0%,#17134a_100%)] shadow-[inset_0_1px_0_rgba(233,213,255,0.07)]";

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

const STAT_HUES = ["orange", "violet", "cyan", "emerald", "rose", "sky", "fuchsia", "lime"] as const;

function hueForLabel(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return STAT_HUES[hash % STAT_HUES.length];
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
    <WorkspaceInnerPanel className={cn("p-4", `tint-${hueForLabel(label)}`)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tint-text text-[0.62rem] font-bold uppercase tracking-[0.14em]">{label}</p>
          <p className={cn("mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl", tone)}>{value}</p>
          {hint ? <p className="mt-1 text-xs text-white/60">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="tint-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="h-4 w-4" />
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
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-violet-400/20 bg-[linear-gradient(100deg,rgba(139,92,246,0.22),rgba(14,165,233,0.1)_50%,transparent)] px-6 py-5 sm:px-7">
      <div className="flex items-center gap-3.5">
        <span className="tint-icon tint-violet flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <p className="display-kicker gradient-text-spectrum">Manager workspace</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-white/65">{description}</p> : null}
        </div>
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
    <CardHeader className="border-b border-violet-400/20 bg-[linear-gradient(100deg,rgba(139,92,246,0.2),rgba(244,63,94,0.08)_45%,transparent)] px-6 pt-5 pb-5">
      <p className="display-kicker gradient-text-spectrum">{kicker}</p>
      <CardTitle className="mt-2 font-display text-xl font-bold text-white/95">{title}</CardTitle>
      <CardDescription className="mt-1.5 text-sm leading-6 text-white/65">{description}</CardDescription>
    </CardHeader>
  );
}
