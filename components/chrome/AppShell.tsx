"use client";

import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

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
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PRODUCT } from "@/constants/branding";
import { cn } from "@/lib/utils";

export type AppNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
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
  children,
}: AppShellProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="app-shell">
        <Sidebar
          collapsible="icon"
          variant="floating"
          className="border-apex-orange/15 **:data-[sidebar=sidebar]:border-apex-orange/12 **:data-[sidebar=sidebar]:bg-[linear-gradient(180deg,#0b192e_0%,#0a1628_52%,#060e1a_100%)] **:data-[sidebar=sidebar]:shadow-[0_22px_52px_-30px_rgba(0,0,0,0.78)]"
        >
          <SidebarHeader className="p-3">
            <div className="flex items-center gap-3 rounded-[1.1rem] border border-apex-orange/20 bg-[linear-gradient(135deg,#173049_0%,#12263f_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,214,160,0.1)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
              <Avatar className="h-11 w-11 shrink-0 ring-2 ring-apex-orange/30">
                <AvatarImage src={logo || "/assets/pharmacy.jpg"} alt={pharmacy || "Pharmacy"} />
                <AvatarFallback className="bg-apex-orange/12 text-apex-orange-light">
                  {pharmacy ? pharmacy[0]?.toUpperCase() : "M"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate font-display text-sm font-semibold tracking-tight text-white">
                  {pharmacy || PRODUCT.name}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1.5 border-apex-orange/30 bg-apex-orange/10 px-2 py-0 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-apex-orange-light"
                >
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator className="bg-white/10" />

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400/75">
                Modules
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={selected === item.key}
                        tooltip={item.label}
                        onClick={() => onSelect(item.key)}
                        className={cn(
                          "h-10 rounded-[0.7rem]! border border-transparent transition-all duration-200",
                          selected === item.key
                            ? "border-apex-orange/35 bg-apex-orange/16 text-[#ffd89a] shadow-[inset_2px_0_0_rgba(232,149,30,0.95),inset_0_1px_0_rgba(255,255,255,0.08)]"
                            : "text-slate-200/75 hover:border-apex-orange/15 hover:bg-apex-orange/[0.07] hover:text-white",
                        )}
                      >
                        <item.icon
                          className={cn(
                            selected === item.key ? "text-apex-orange-light" : "text-slate-300/50",
                          )}
                        />
                        <span className="text-sm">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="space-y-2.5 p-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-red-400/25 bg-red-500/10 text-white/85 hover:border-red-400/40 hover:bg-red-500/20 hover:text-white transition-colors group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
            </Button>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-svh bg-transparent">
          <header className="app-chrome-header sticky top-0 z-10">
            <div className="flex h-17 items-center gap-4 px-4 lg:px-6">
              <SidebarTrigger className="text-white/60 hover:bg-white/8 hover:text-white" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="display-kicker text-apex-orange/85">{roleLabel}</p>
                  <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[0.58rem] font-bold uppercase tracking-wider text-emerald-300">Live</span>
                  </span>
                </div>
                <h1 className="truncate font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                  {pageTitle}
                </h1>
              </div>
              <div className="flex items-center gap-2">
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
