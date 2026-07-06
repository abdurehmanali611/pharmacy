"use client";

import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

import { ApexMark, ApexMarkIcon } from "@/components/chrome/ApexMark";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
      <SidebarProvider defaultOpen>
        <Sidebar
          collapsible="icon"
          variant="floating"
          className="border-white/12 **:data-[sidebar=sidebar]:border-white/12 **:data-[sidebar=sidebar]:bg-[linear-gradient(180deg,rgba(11,25,46,0.98),rgba(6,14,26,0.99))] **:data-[sidebar=sidebar]:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
        >
          <SidebarHeader className="p-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/14 bg-white/6 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
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
                  className="mt-1.5 border-apex-orange/30 bg-apex-orange/10 px-2 py-0 text-[0.58rem] font-black uppercase tracking-[0.22em] text-apex-orange-light"
                >
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator className="bg-white/10" />

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[0.62rem] font-black uppercase tracking-[0.26em] text-white/35">
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
                          "h-10 rounded-xl border border-transparent transition-all duration-200",
                          selected === item.key
                            ? "border-apex-orange/25 bg-apex-orange/14 text-apex-orange-light shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                            : "text-white/60 hover:border-white/10 hover:bg-white/6 hover:text-white",
                        )}
                      >
                        <item.icon
                          className={cn(
                            selected === item.key ? "text-apex-orange-light" : "text-white/40",
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
            <div className="relative group-data-[collapsible=icon]:hidden">
              <div className="pointer-events-none absolute inset-x-3 -top-1 h-px bg-[linear-gradient(90deg,transparent,rgba(232,149,30,0.35),transparent)]" />
              <ApexMark variant="sidebar" />
            </div>

            <div className="hidden justify-center group-data-[collapsible=icon]:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ApexMarkIcon />
                </TooltipTrigger>
                <TooltipContent side="right" className="border-white/12 bg-[#0a1628] text-white">
                  Powered by Apex Solution
                </TooltipContent>
              </Tooltip>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl border-white/12 bg-white/5 text-white/70 hover:bg-white/8 hover:text-white group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
            </Button>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-svh bg-transparent">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-[linear-gradient(180deg,rgba(6,14,26,0.92),rgba(6,14,26,0.78))] backdrop-blur-xl">
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
            </div>
          </header>

          <div className="relative flex-1 p-4 lg:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,149,30,0.06),transparent)]" />
            <div className="relative">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
