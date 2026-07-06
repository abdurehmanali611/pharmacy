"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Package,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PRODUCT } from "@/constants/branding";
import { cn } from "@/lib/utils";

const salesData = [
  { day: "Mon", sales: 42, profit: 18 },
  { day: "Tue", sales: 58, profit: 24 },
  { day: "Wed", sales: 51, profit: 21 },
  { day: "Thu", sales: 72, profit: 31 },
  { day: "Fri", sales: 68, profit: 28 },
  { day: "Sat", sales: 84, profit: 36 },
  { day: "Sun", sales: 61, profit: 26 },
];

const stockBars = [
  { cat: "Pain", qty: 88 },
  { cat: "Anti", qty: 62 },
  { cat: "Malaria", qty: 45 },
  { cat: "Vitamins", qty: 91 },
  { cat: "Other", qty: 54 },
];

const alerts = [
  { label: "Paracetamol 500mg", level: "CRITICAL", tone: "text-red-200 bg-red-500/18 border-red-400/35" },
  { label: "Amoxicillin 250mg", level: "EXPIRING", tone: "text-amber-200 bg-amber-500/15 border-amber-400/30" },
  { label: "ORS Sachets", level: "LOW", tone: "text-orange-200 bg-orange-500/14 border-orange-400/28" },
];

function HeroPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/14 bg-[#0a1628]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function HeroVisualization({ className }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 6, y: -10 });

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const onMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setTilt({ x: 8 - dy * 10, y: -12 + dx * 14 });
    };

    const onLeave = () => setTilt({ x: 6, y: -10 });

    scene.addEventListener("mousemove", onMove);
    scene.addEventListener("mouseleave", onLeave);
    return () => {
      scene.removeEventListener("mousemove", onMove);
      scene.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={sceneRef} className={cn("relative mx-auto w-full max-w-[640px] lg:max-w-none", className)}>
      {/* Balanced dual glow — warm + cool */}
      <div className="pointer-events-none absolute inset-0 -z-10 scale-105">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(232,149,30,0.14),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(50,95,160,0.18),transparent_70%)] blur-3xl" />
      </div>

      {/* Floating alert card */}
      <HeroPanel className="animate-float-medium absolute -left-2 top-8 z-30 hidden w-52 p-3 backdrop-blur-xl sm:block lg:-left-8">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
          </span>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-red-300">Live alert</p>
        </div>
        <p className="mt-2 text-sm font-semibold text-white/90">3 medicines need action</p>
        <p className="mt-1 text-xs text-white/50">Stock & expiry intelligence</p>
      </HeroPanel>

      {/* Floating sales card */}
      <HeroPanel className="animate-float-slow absolute -right-2 top-1/3 z-30 hidden w-48 p-3 backdrop-blur-xl sm:block lg:-right-6">
        <div className="flex items-center gap-2 text-apex-orange-light">
          <TrendingUp className="h-4 w-4" />
          <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]">Today</p>
        </div>
        <p className="mt-2 font-display text-xl font-bold text-white">ETB 48.2K</p>
        <p className="text-xs text-emerald-300">+18.4% vs yesterday</p>
      </HeroPanel>

      {/* Main 3D browser frame */}
      <div
        className="perspective-scene relative transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="overflow-hidden rounded-[1.35rem] border border-white/14 bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,rgba(11,25,46,0.95)_40%,rgba(6,14,26,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_50px_120px_-40px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(232,149,30,0.15)]">
          <div className="overflow-hidden rounded-[calc(1.35rem-1px)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-white/12 bg-[#0b192e] px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-white/12 bg-[#060e1a] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="truncate text-[0.65rem] text-white/50">medicare.app / manager / reports</span>
                </div>
              </div>
            </div>

            {/* App shell mock */}
            <div className="grid min-h-[380px] grid-cols-[72px_1fr] bg-[#070f1c] sm:min-h-[420px]">
              {/* Sidebar */}
              <div className="border-r border-white/10 bg-[#081222] p-2">
                <div className="mx-auto mb-4 h-9 w-9 rounded-xl border border-apex-orange/30 bg-apex-orange/18" />
                {[Package, BarChart3, ReceiptText, AlertTriangle].map((Icon, i) => (
                  <div
                    key={i}
                    className={cn(
                      "mb-2 flex h-9 w-full items-center justify-center rounded-lg",
                      i === 1
                        ? "border border-apex-orange/25 bg-apex-orange/15 text-apex-orange-light"
                        : "text-white/40",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="space-y-3 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.24em] text-apex-orange/90">Manager</p>
                    <p className="font-display text-sm font-bold text-white sm:text-base">{PRODUCT.name} Reports</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[0.58rem] font-bold text-emerald-300">
                    LIVE
                  </span>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Sales", v: "48.2K", c: "text-apex-orange-light" },
                    { l: "Profit", v: "12.8K", c: "text-emerald-300" },
                    { l: "Invoices", v: "23", c: "text-white/90" },
                  ].map((k) => (
                    <HeroPanel key={k.l} className="p-2">
                      <p className="text-[0.55rem] uppercase tracking-wider text-white/45">{k.l}</p>
                      <p className={cn("font-display text-sm font-bold sm:text-base", k.c)}>{k.v}</p>
                    </HeroPanel>
                  ))}
                </div>

                {/* Chart area */}
                <HeroPanel className="p-2">
                  <p className="mb-1 px-1 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-white/45">
                    Weekly revenue
                  </p>
                  <div className="h-[110px] w-full sm:h-[130px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <defs>
                          <linearGradient id="heroSalesFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e8951e" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#e8951e" stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: "#0b192e",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 12,
                            fontSize: 11,
                          }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#f5b042" strokeWidth={2} fill="url(#heroSalesFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </HeroPanel>

                {/* Alerts list */}
                <div className="space-y-1.5">
                  {alerts.map((a) => (
                    <div
                      key={a.label}
                      className={cn("flex items-center justify-between rounded-lg border px-2 py-1.5", a.tone)}
                    >
                      <span className="truncate text-[0.65rem] font-medium text-white/85">{a.label}</span>
                      <span className="text-[0.55rem] font-black tracking-wider">{a.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock mini chart below */}
      <HeroPanel className="animate-float-slow absolute -bottom-6 left-1/2 z-20 hidden w-64 -translate-x-1/2 p-3 backdrop-blur-xl lg:block">
        <p className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-white/45">Category stock</p>
        <div className="mt-2 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockBars} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <Bar dataKey="qty" fill="#e8951e" radius={[4, 4, 0, 0]} opacity={0.9} />
              <XAxis dataKey="cat" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </HeroPanel>
    </div>
  );
}
