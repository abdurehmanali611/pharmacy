"use client";

import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

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
import { cn } from "@/lib/utils";

export type AppNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  description?: string;
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
  pageDescription?: string;
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
  pageDescription,
  children,
}: AppShellProps) {
  const activeItem = navItems.find((item) => item.key === selected);

  return (
    <TooltipProvider delayDuration={0}>
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        variant="floating"
        className="border-white/10 bg-[#0c1019]/95 backdrop-blur-xl **:data-[sidebar=sidebar]:border-white/10 **:data-[sidebar=sidebar]:bg-[#0c1019]/95"
      >
        <SidebarHeader className="p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-amber-400/20">
              <AvatarImage src={logo || "/assets/pharmacy.jpg"} alt={pharmacy || "Pharmacy"} />
              <AvatarFallback className="bg-amber-500/10 text-amber-200">
                {pharmacy ? pharmacy[0]?.toUpperCase() : "M"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate font-display text-base tracking-tight text-white">
                {pharmacy || "Medicare"}
              </p>
              <Badge
                variant="outline"
                className="mt-1.5 border-amber-400/20 bg-amber-400/8 px-2 py-0 text-[0.62rem] font-black uppercase tracking-[0.22em] text-amber-200"
              >
                {roleLabel}
              </Badge>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator className="bg-white/10" />

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-white/40">
              Navigation
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
                        "h-10 rounded-xl transition-all duration-200",
                        selected === item.key
                          ? "bg-linear-to-r from-amber-500/20 to-amber-500/5 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          : "text-white/70 hover:bg-white/6 hover:text-white",
                      )}
                    >
                      <item.icon className={cn(selected === item.key ? "text-amber-300" : "text-white/50")} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 rounded-xl border-white/10 bg-white/4 text-white/80 hover:bg-white/8 hover:text-white group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
          </Button>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh bg-transparent">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-white/8 bg-[#090d15]/80 px-4 backdrop-blur-xl lg:px-6">
          <SidebarTrigger className="text-white/70 hover:bg-white/8 hover:text-white" />
          <div className="min-w-0 flex-1">
            <p className="display-kicker text-amber-200/80">{roleLabel}</p>
            <h1 className="truncate font-display text-xl tracking-tight text-white sm:text-2xl">
              {pageTitle}
            </h1>
          </div>
          {pageDescription || activeItem?.description ? (
            <p className="hidden max-w-md text-right text-sm leading-6 text-white/50 lg:block">
              {pageDescription ?? activeItem?.description}
            </p>
          ) : null}
        </header>

        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
}
