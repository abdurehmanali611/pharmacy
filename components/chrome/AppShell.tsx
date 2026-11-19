"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, ChevronDown, Clock3, LogOut, Store } from "lucide-react";

import { NotificationBell, RefreshButton, type AppNotification } from "@/components/chrome/HeaderActions";
import { BillingAlerts } from "@/components/billing/BillingAlerts";
import { TenantFeedbackCenter } from "@/components/feedback/TenantFeedbackCenter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PRODUCT } from "@/constants/branding";
import { cn } from "@/lib/utils";

const NAV_HUES = ["orange", "violet", "cyan", "emerald", "rose", "sky", "fuchsia", "lime"] as const;

export type HeaderStat = {
  label: string;
  value: string;
  icon: LucideIcon;
  tint: "violet" | "cyan" | "emerald" | "pink" | "amber" | "sky";
};

export type AppNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Optional submenu; the parent then only expands and the children navigate. */
  children?: { key: string; label: string }[];
};

type AppShellProps = {
  pharmacy: string;
  logo: string;
  roleLabel: string;
  navItems: AppNavItem[];
  selected: string;
  onSelect: (key: string) => void;
  onLogout: () => void;
  pageTitle: string;
  /** The signed-in person: shown as a profile chip in the header. */
  userName?: string;
  userSubtitle?: string;
  /** Show the signed-in person's card on the right of the header. */
  showProfile?: boolean;
  /** Alerts for the bell in the header. */
  notifications?: AppNotification[];
  /** Live numbers shown in the middle of the header, e.g. today's sales. */
  headerStats?: HeaderStat[];
  /** Reloads the page's data when the refresh button is pressed. */
  onRefresh?: () => Promise<unknown> | void;
  children: React.ReactNode;
};

export function AppShell({
  pharmacy,
  logo,
  roleLabel,
  navItems,
  selected,
  onSelect,
  onLogout,
  pageTitle,
  userName,
  showProfile = false,
  notifications = [],
  headerStats = [],
  onRefresh,
  children,
}: AppShellProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState<Date | null>(null);

  // The clock is client-only so the server and browser never disagree on the first render.
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const pageItem =
    navItems.find((item) => item.key === selected) ??
    navItems.find((item) => item.children?.some((child) => child.key === selected));
  const pageIndex = Math.max(0, navItems.findIndex((item) => item === pageItem));
  const PageIcon = pageItem?.icon;
  const pageTint = NAV_HUES[pageIndex % NAV_HUES.length];

  const displayName = (userName || "").trim();
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  const hour = now?.getHours() ?? 12;
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="app-shell">
        <Sidebar
          collapsible="icon"
          variant="floating"
          className="border-violet-400/25 **:data-[sidebar=sidebar]:border-violet-400/25 **:data-[sidebar=sidebar]:bg-[radial-gradient(ellipse_130%_36%_at_0%_0%,rgba(168,85,247,0.34),transparent_70%),radial-gradient(ellipse_130%_36%_at_100%_100%,rgba(34,211,238,0.2),transparent_70%),linear-gradient(175deg,#1a1252_0%,#0f0b3a_45%,#080620_100%)] **:data-[sidebar=sidebar]:shadow-[0_30px_70px_-34px_rgba(0,0,0,0.9),inset_-1px_0_0_rgba(168,85,247,0.25)]"
        >
          <SidebarHeader className="p-3">
            <div className="flex items-center gap-3 rounded-[1.1rem] border border-violet-300/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.28),rgba(244,114,182,0.14))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
              <Avatar className="h-11 w-11 shrink-0 ring-2 ring-fuchsia-300/60">
                <AvatarImage src={logo || "/assets/pharmacy.jpg"} alt={pharmacy || "Pharmacy"} />
                <AvatarFallback className="bg-violet-500/30 text-violet-100">
                  {pharmacy ? pharmacy[0]?.toUpperCase() : "M"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate font-display text-sm font-bold tracking-tight text-white">
                  {pharmacy || PRODUCT.name}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1.5 border-white/50 bg-white/25 px-2 py-0 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white"
                >
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator className="bg-violet-300/20" />

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-violet-200/80">
                Modules
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item, navIndex) => {
                    const childKeys = item.children?.map((child) => child.key) ?? [];
                    const groupActive = childKeys.includes(selected);
                    const groupOpen = openGroups[item.key] ?? groupActive;
                    const active = item.children ? groupActive : selected === item.key;
                    return (
                      <SidebarMenuItem key={item.key} className={`tint-${NAV_HUES[navIndex % NAV_HUES.length]}`}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.label}
                          onClick={() => {
                            if (item.children) {
                              setOpenGroups((prev) => ({ ...prev, [item.key]: !groupOpen }));
                              if (!groupActive && !groupOpen) onSelect(item.children[0].key);
                            } else {
                              onSelect(item.key);
                            }
                          }}
                          className={cn(
                            "h-11 rounded-[0.9rem]! border border-transparent transition-all duration-200",
                            active && !item.children
                              ? "border-fuchsia-300/60 !bg-[linear-gradient(120deg,#7c3aed,#c026d3_60%,#ec4899)] !text-white shadow-[0_14px_30px_-12px_rgba(192,38,211,0.85)] hover:brightness-110"
                              : active
                                ? "border-violet-300/45 !bg-violet-500/22 !text-white"
                                : "text-violet-50/90 hover:border-violet-300/30 hover:bg-violet-500/18 hover:text-white",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "size-4",
                              active && !item.children ? "text-white" : "text-[rgb(var(--tint))]",
                            )}
                          />
                          <span className="text-sm font-semibold">{item.label}</span>
                          {item.children ? (
                            <ChevronDown
                              className={cn("ml-auto size-4 transition-transform", groupOpen && "rotate-180")}
                            />
                          ) : null}
                        </SidebarMenuButton>
                        {item.children && groupOpen ? (
                          <SidebarMenuSub className="mt-1.5 gap-1.5 border-violet-300/30 pr-0">
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.key}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={selected === child.key}
                                  className={cn(
                                    "h-10 w-full cursor-pointer justify-start rounded-xl border border-violet-300/15 !bg-violet-500/10 px-3 text-violet-50/90 transition-colors hover:!border-violet-300/40 hover:!bg-violet-500/22 hover:!text-white",
                                    selected === child.key &&
                                      "!border-fuchsia-300/60 !bg-[linear-gradient(120deg,#7c3aed,#c026d3_60%,#ec4899)] font-bold !text-white shadow-[0_10px_22px_-12px_rgba(192,38,211,0.85)] hover:!brightness-110 hover:!text-white",
                                  )}
                                >
                                  <button type="button" className="w-full text-left" onClick={() => onSelect(child.key)}>
                                    <span className="text-sm">{child.label}</span>
                                  </button>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        ) : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="space-y-2.5 p-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-violet-300/30 bg-violet-500/10 font-semibold text-violet-50 hover:border-red-200/70 hover:bg-red-500/70 hover:text-white active:bg-red-600/80 transition-colors group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
            </Button>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-svh min-w-0 bg-transparent">
          <header className="app-chrome-header sticky top-0 z-10">
            <div className="flex h-[4.75rem] items-center gap-3 px-4 lg:gap-4 lg:px-6">
              <SidebarTrigger className="size-10 shrink-0 rounded-xl border border-white/15 bg-white/8 text-white/80 hover:bg-white/18 hover:text-white" />

              <div className="flex min-w-0 items-center gap-3.5">
                {PageIcon ? (
                  <span className={cn("tint-icon hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex", `tint-${pageTint}`)}>
                    <PageIcon className="size-[1.1rem]" />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="display-kicker gradient-text-spectrum !text-[0.56rem]">{roleLabel}</p>
                    <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/45 bg-emerald-400/12 px-2 py-0.5 sm:inline-flex">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                      <span className="text-[0.5rem] font-bold uppercase tracking-wider text-emerald-200">Live</span>
                    </span>
                    {pharmacy ? (
                      <span className="hidden max-w-44 items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[0.55rem] font-semibold text-white/80 xl:inline-flex">
                        <Store className="size-3 shrink-0 text-fuchsia-200" />
                        <span className="truncate">{pharmacy}</span>
                      </span>
                    ) : null}
                  </div>
                  <h1 className="truncate font-display text-base font-bold tracking-tight text-white sm:text-lg">{pageTitle}</h1>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
                {showProfile && displayName ? (
                  <div className="flex items-center gap-2.5 rounded-full border border-cyan-300/30 bg-[linear-gradient(100deg,rgba(34,211,238,0.18),rgba(168,85,247,0.24),rgba(244,114,182,0.16))] py-1 pl-1 pr-3.5 shadow-[0_8px_22px_-14px_rgba(34,211,238,0.9)]">
                    <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22d3ee,#a855f7_60%,#f472b6)] font-display text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                      {initials}
                      <span className="absolute -bottom-px -right-px size-2.5 rounded-full border-2 border-[#1a1252] bg-emerald-400" />
                    </span>
                    <div className="hidden min-w-0 items-baseline gap-2 sm:flex">
                      <span className="hidden text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-cyan-100/70 lg:inline">{greeting}</span>
                      <span className="whitespace-nowrap font-display text-[0.8rem] font-bold text-white">{displayName}</span>
                    </div>
                  </div>
                ) : null}
                {headerStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "hidden items-center gap-2.5 rounded-2xl border border-[rgb(var(--tint)/0.4)] bg-[linear-gradient(135deg,rgb(var(--tint)/0.2),rgb(var(--tint)/0.05))] py-1.5 pl-1.5 pr-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] 2xl:flex",
                      `tint-${stat.tint}`,
                    )}
                  >
                    <span className="tint-icon flex size-8 shrink-0 items-center justify-center rounded-xl">
                      <stat.icon className="size-4" />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/60">{stat.label}</p>
                      <p className="font-display text-sm font-bold tabular-nums text-white">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {now ? (
                <div className="hidden items-center gap-3 rounded-2xl border border-white/12 bg-white/6 px-3.5 py-1.5 xl:flex">
                  <div className="text-right leading-tight">
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/55">
                      {now.toLocaleDateString(undefined, { weekday: "long" })}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-white/85">
                      <CalendarDays className="size-3 text-cyan-300" />
                      {now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className="h-8 w-px bg-white/20" />
                  <div className="flex items-center gap-1.5 font-display text-lg font-bold tabular-nums text-white">
                    <Clock3 className="size-4 text-amber-300" />
                    {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <RefreshButton onRefresh={onRefresh} />
                <NotificationBell notifications={notifications} onOpenTarget={onSelect} />
                <BillingAlerts />
                <TenantFeedbackCenter />
              </div>
            </div>
          </header>

          <div className="workspace-stage relative flex-1 p-4 lg:p-6">
            <div className="relative">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
