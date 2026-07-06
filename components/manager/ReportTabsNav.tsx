"use client";

import type { LucideIcon } from "lucide-react";
import { FileText, LayoutDashboard, Pill, Truck, Wallet } from "lucide-react";

import type { ReportSectionKey } from "@/components/manager/types";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ReportTab = {
  key: ReportSectionKey;
  label: string;
  icon: LucideIcon;
};

const REPORT_TABS: ReportTab[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "medicines", label: "Medicines", icon: Pill },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "cashouts", label: "Cashouts", icon: Wallet },
];

/** Kills the default shadcn tabs-trigger ::after underline that cuts through tab content */
const triggerBase = cn(
  "group/tab !h-auto !min-h-[3.25rem] !flex-none rounded-xl border border-transparent px-3 py-2.5 sm:px-4",
  "!flex-none whitespace-normal",
  "!justify-start !items-center text-left",
  "text-white/55 transition-all duration-200",
  "hover:border-white/10 hover:bg-white/6 hover:text-white/90",
  "after:!hidden after:!content-none data-[state=active]:after:!hidden",
  "data-active:!border-apex-orange/40 data-[state=active]:!border-apex-orange/40",
  "data-active:!bg-[linear-gradient(180deg,rgba(232,149,30,0.2),rgba(232,149,30,0.06))] data-[state=active]:!bg-[linear-gradient(180deg,rgba(232,149,30,0.2),rgba(232,149,30,0.06))]",
  "data-active:!text-white data-[state=active]:!text-white",
  "data-active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_-12px_rgba(232,149,30,0.35)]",
);

const tabsListClass = cn(
  "mx-auto mb-6 inline-flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/14 p-2",
  "bg-[#0a1628] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
  "!h-auto group-data-horizontal/tabs:!h-auto",
);

export function ReportTabsNav({ counts }: { counts?: Partial<Record<ReportSectionKey, number>> }) {
  return (
    <TabsList className={tabsListClass}>
      {REPORT_TABS.map((tab) => {
        const count = counts?.[tab.key];
        return (
          <TabsTrigger key={tab.key} value={tab.key} className={triggerBase}>
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#060e1a]",
                  "group-data-[state=active]/tab:border-apex-orange/35 group-data-[state=active]/tab:bg-apex-orange/15",
                )}
              >
                <tab.icon className="h-4 w-4 text-white/50 group-data-[state=active]/tab:text-apex-orange-light" />
              </span>
              <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                <span className="text-sm font-semibold leading-tight">{tab.label}</span>
                <span
                  className={cn(
                    "text-[0.6rem] font-bold uppercase tracking-[0.16em] leading-tight",
                    "text-white/35 group-data-[state=active]/tab:text-apex-orange-light/80",
                  )}
                >
                  {count !== undefined ? `${count} records` : "Intelligence"}
                </span>
              </span>
            </span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

export { REPORT_TABS };
