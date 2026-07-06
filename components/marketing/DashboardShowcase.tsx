"use client";

import { Activity, Pill, ShoppingCart, Wallet } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PRODUCT } from "@/constants/branding";

const profitTrend = [
  { w: "W1", profit: 12.4, sales: 38 },
  { w: "W2", profit: 15.1, sales: 44 },
  { w: "W3", profit: 14.2, sales: 41 },
  { w: "W4", profit: 18.8, sales: 52 },
  { w: "W5", profit: 21.3, sales: 58 },
  { w: "W6", profit: 24.6, sales: 63 },
];

const modules = [
  {
    icon: Pill,
    title: "Medicine intelligence",
    stat: "1,284",
    unit: "active SKUs",
    detail: "Batch, expiry, supplier-linked records",
  },
  {
    icon: ShoppingCart,
    title: "Counter velocity",
    stat: "4.2s",
    unit: "avg checkout",
    detail: "Multi-item cart with search-first UX",
  },
  {
    icon: Wallet,
    title: "Financial clarity",
    stat: "ETB 12.8K",
    unit: "profit today",
    detail: "Invoices, cashouts, sales unified",
  },
  {
    icon: Activity,
    title: "Operational pulse",
    stat: "3",
    unit: "urgent alerts",
    detail: "Stock & expiry surfaced instantly",
  },
];

export function DashboardShowcase() {
  return (
    <section className="relative">
      <div className="mb-10 text-center lg:mb-14">
        <p className="display-kicker text-apex-orange">Inside the command center</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">
          See what {PRODUCT.name} actually looks like
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
          Not mockups on paper — a live operating surface with charts, urgency signals,
          and financial intelligence your team uses every hour.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        {/* Main chart panel */}
        <div className="gradient-border-apex overflow-hidden rounded-[1.75rem]">
          <div className="rounded-[calc(1.75rem-1px)] bg-[linear-gradient(180deg,rgba(11,25,46,0.98),rgba(6,14,26,0.96))] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="display-kicker text-white/40">
                  Profit trajectory
                </p>
                <p className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
                  6-week performance
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[0.58rem] uppercase tracking-wider text-white/35">Sales</p>
                  <p className="font-display text-base font-bold text-apex-orange-light">↑ 63K</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.58rem] uppercase tracking-wider text-white/35">Profit</p>
                  <p className="font-display text-base font-bold text-emerald-300">↑ 24.6K</p>
                </div>
              </div>
            </div>

            <div className="mt-6 h-[240px] w-full sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="w"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b192e",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 14,
                    }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#f5b042" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 border-t border-white/8 pt-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="h-0.5 w-6 rounded bg-apex-orange-light" />
                Sales (ETB thousands)
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="h-0.5 w-6 rounded bg-emerald-400" />
                Profit (ETB thousands)
              </div>
            </div>
          </div>
        </div>

        {/* Module cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {modules.map((m) => (
            <div
              key={m.title}
              className="group glass-apex panel-glow flex gap-4 rounded-2xl p-5 transition duration-300 hover:border-apex-orange/20"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-apex-orange/20 bg-apex-orange/10 transition group-hover:bg-apex-orange/18">
                <m.icon className="h-5 w-5 text-apex-orange-light" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/40">
                  {m.title}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-white">
                  {m.stat}
                  <span className="ml-2 text-xs font-medium text-white/40">{m.unit}</span>
                </p>
                <p className="mt-1 text-xs leading-5 text-white/50">{m.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
