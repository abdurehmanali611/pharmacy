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
  "group/tab !h-auto !min-h-[3.25rem] !w-full !min-w-0 !flex-none rounded-xl border border-transparent px-3 py-2.5 sm:px-4",
  "!flex-none whitespace-normal",
  "!justify-start !items-center text-left",
  "text-slate-200/80 transition-all duration-200",
  "hover:border-apex-orange/15 hover:bg-apex-orange/[0.07] hover:text-white",
  "after:!hidden after:!content-none data-[state=active]:after:!hidden",
  "data-active:!border-apex-orange/35 data-[state=active]:!border-apex-orange/35",
  "data-active:!bg-apex-orange/[0.14] data-[state=active]:!bg-apex-orange/[0.14]",
  "data-active:!text-[#ffd89a] data-[state=active]:!text-[#ffd89a]",
  "data-active:shadow-sm",
);

const tabsListClass = cn(
  "mb-6 grid w-full max-w-full grid-cols-2 items-stretch gap-2 rounded-2xl border border-apex-orange/12 bg-[#081422] p-2 shadow-[inset_0_1px_0_rgba(255,214,160,0.06),0_14px_32px_-26px_rgba(0,0,0,0.9)] sm:grid-cols-3 lg:grid-cols-5",
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
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-apex-orange/12 bg-[#12263f]",
                  "group-data-[state=active]/tab:border-apex-orange/30 group-data-[state=active]/tab:bg-apex-orange/15",
                )}
              >
                <tab.icon className="h-4 w-4 text-apex-orange-light/70 group-data-[state=active]/tab:text-apex-orange-light" />
              </span>
              <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                <span className="text-sm font-semibold leading-tight">{tab.label}</span>
                <span
                  className={cn(
                    "text-[0.6rem] font-semibold uppercase tracking-[0.12em] leading-tight",
                    "text-slate-400 group-data-[state=active]/tab:text-apex-orange-light",
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
