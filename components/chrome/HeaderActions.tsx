"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, Check, CheckCheck, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  tone: "rose" | "amber" | "cyan" | "emerald" | "violet";
  icon: LucideIcon;
  /** Section key to open when the notification is clicked. */
  target?: string;
};

const TONES: Record<AppNotification["tone"], string> = {
  rose: "border-rose-300/35 bg-rose-400/12 text-rose-200",
  amber: "border-amber-300/35 bg-amber-400/12 text-amber-200",
  cyan: "border-cyan-300/35 bg-cyan-400/12 text-cyan-200",
  emerald: "border-emerald-300/35 bg-emerald-400/12 text-emerald-200",
  violet: "border-violet-300/35 bg-violet-400/12 text-violet-200",
};

const READ_KEY = "pharmacy:read-notifications";

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function storeRead(ids: Set<string>) {
  try {
    // keep the list from growing forever
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-300)));
  } catch {
    /* storage unavailable: read state just lasts for this visit */
  }
}

const iconButton =
  "relative flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/8 text-white/80 transition hover:border-fuchsia-300/60 hover:bg-white/16 hover:text-white";

export function NotificationBell({
  notifications,
  onOpenTarget,
}: {
  notifications: AppNotification[];
  onOpenTarget?: (target: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());

  // Read state is remembered on this device, so handled notifications stay gone next time.
  useEffect(() => {
    setRead(loadRead());
  }, []);

  const markRead = (ids: string[]) =>
    setRead((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      storeRead(next);
      return next;
    });

  const unread = notifications.filter((n) => !read.has(n.id));
  const markAllRead = () => markRead(unread.map((n) => n.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={iconButton} aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`} title="Notifications">
          <Bell className={cn("size-[1.15rem]", unread.length && "animate-[wiggle_1.6s_ease-in-out_infinite]")} />
          {unread.length ? (
            <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-[#0d0b2b] bg-[linear-gradient(135deg,#fb7185,#f43f5e)] px-1 text-[10px] font-bold leading-4 text-white shadow-[0_4px_10px_-2px_rgba(244,63,94,0.8)]">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-2rem))] p-0 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="font-display text-base font-bold">Notifications</p>
            <p className="text-xs text-white/55">
              {unread.length ? `${unread.length} unread` : "Nothing needs attention"}
            </p>
          </div>
          {unread.length ? (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/8 px-2.5 py-1.5 text-xs font-bold text-white/85 transition hover:bg-white/16"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto p-3">
          {unread.length ? (
            unread.map((n) => (
              <div key={n.id} className={cn("flex items-start gap-2 rounded-2xl border p-3 transition", TONES[n.tone])}>
                <button
                  type="button"
                  onClick={() => {
                    markRead([n.id]);
                    if (n.target) onOpenTarget?.(n.target);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left transition hover:brightness-125"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/12">
                    <n.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">{n.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-white/70">{n.description}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => markRead([n.id])}
                  title="Mark as read"
                  aria-label={`Mark ${n.title} as read`}
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <Check className="size-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="tint-icon tint-emerald flex size-12 items-center justify-center rounded-2xl">
                <Sparkles className="size-5" />
              </span>
              <p className="font-display text-base font-bold">You&apos;re all caught up</p>
              <p className="text-xs text-white/60">New alerts about sales, stock and expiry will appear here.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RefreshButton({ onRefresh }: { onRefresh?: () => Promise<unknown> | void }) {
  const [refreshing, setRefreshing] = useState(false);

  const run = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success("Data refreshed", { id: "header-refresh" });
    } catch {
      toast.error("Could not refresh the data", { id: "header-refresh" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={refreshing || !onRefresh}
      className={cn(iconButton, "disabled:cursor-wait")}
      aria-label="Refresh data"
      title="Refresh data"
    >
      <RefreshCw className={cn("size-[1.1rem]", refreshing && "animate-spin text-fuchsia-200")} />
    </button>
  );
}
