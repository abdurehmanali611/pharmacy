"use client";

import { BarChart3, Package, ReceiptText, Search, Shield, Stethoscope, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

const inventoryTrend = [
  { day: "Mon", stock: 1180, threshold: 900 },
  { day: "Tue", stock: 1124, threshold: 900 },
  { day: "Wed", stock: 1056, threshold: 900 },
  { day: "Thu", stock: 980, threshold: 900 },
  { day: "Fri", stock: 942, threshold: 900 },
  { day: "Sat", stock: 1012, threshold: 900 },
  { day: "Sun", stock: 1088, threshold: 900 },
];

const stockByCategory = [
  { name: "Pain", qty: 88, fill: "#f5b042" },
  { name: "Anti", qty: 62, fill: "#e8951e" },
  { name: "Malaria", qty: 45, fill: "#c97812" },
  { name: "Vitamins", qty: 91, fill: "#f5b042" },
  { name: "Other", qty: 54, fill: "#e8951e" },
];

const alerts = [
  { label: "Paracetamol 500mg", level: "CRITICAL", pct: 8, tone: "bg-red-500", text: "text-red-200", border: "border-red-400/35" },
  { label: "Amoxicillin 250mg", level: "EXPIRING", pct: 22, tone: "bg-amber-400", text: "text-amber-200", border: "border-amber-400/35" },
  { label: "ORS Sachets", level: "LOW STOCK", pct: 35, tone: "bg-orange-400", text: "text-orange-200", border: "border-orange-400/35" },
];

/** Inner panel — lifted contrast so charts read clearly on dark cards */
function BentoPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/14 bg-[#0a1628]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function InventoryRadarVisual() {
  return (
    <div className="flex min-h-[220px] flex-col gap-3 lg:min-h-[260px]">
      <BentoPanel className="flex-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[0.58rem] font-black uppercase tracking-[0.2em] text-white/50">
            Stock level · 7 days
          </p>
          <span className="rounded-full border border-red-400/30 bg-red-500/15 px-2 py-0.5 text-[0.55rem] font-bold text-red-300">
            3 alerts
          </span>
        </div>
        <div className="h-[130px] w-full lg:h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={inventoryTrend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8951e" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#e8951e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[800, 1250]} />
              <Tooltip
                contentStyle={{
                  background: "#0b192e",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  fontSize: 11,
                  color: "#fff",
                }}
                formatter={(v) => [`${v} units`, "Stock"]}
              />
              <Area
                type="monotone"
                dataKey="stock"
                stroke="#f5b042"
                strokeWidth={2}
                fill="url(#stockFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[0.58rem] text-white/45">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-apex-orange-light" />
            Total SKUs in stock
          </span>
          <span className="text-red-300/80">Threshold: 900</span>
        </div>
      </BentoPanel>

      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.label}
            className={cn("rounded-lg border bg-black/25 px-2.5 py-2", a.border)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[0.65rem] font-medium text-white/80">{a.label}</span>
              <span className={cn("shrink-0 text-[0.55rem] font-black tracking-wider", a.text)}>
                {a.level}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", a.tone)} style={{ width: `${a.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart() {
  return (
    <BentoPanel>
      <p className="mb-2 text-[0.58rem] font-black uppercase tracking-[0.2em] text-white/50">
        Weekly sales
      </p>
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockByCategory} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#0b192e",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                fontSize: 10,
              }}
            />
            <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
              {stockByCategory.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </BentoPanel>
  );
}

function MiniSearchUI() {
  return (
    <BentoPanel className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-white/12 bg-[#060e1a] px-3 py-2">
        <Search className="h-3.5 w-3.5 text-apex-orange-light" />
        <span className="text-xs text-white/50">Paracetamol...</span>
      </div>
      {[
        { name: "Paracetamol 500mg", stock: "142 in stock", ok: true },
        { name: "Panadol Extra", stock: "38 in stock", ok: true },
      ].map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/6 px-2.5 py-2"
        >
          <span className="text-[0.65rem] font-medium text-white/75">{item.name}</span>
          <span className="text-[0.6rem] text-emerald-300">{item.stock}</span>
        </div>
      ))}
    </BentoPanel>
  );
}

const cells = [
  {
    icon: Package,
    title: "Inventory radar",
    copy: "Expiry and stock urgency that screams before you run out.",
    span: "lg:col-span-2",
    visual: <InventoryRadarVisual />,
    tall: true,
  },
  {
    icon: Stethoscope,
    title: "Pharmacist POS",
    copy: "Search, filter, multi-item checkout in one motion.",
    span: "",
    visual: <MiniSearchUI />,
    tall: false,
  },
  {
    icon: BarChart3,
    title: "Manager reports",
    copy: "Sales, profit, suppliers — one intelligence layer.",
    span: "",
    visual: <MiniBarChart />,
    tall: false,
  },
  {
    icon: ReceiptText,
    title: "Finance flow",
    copy: "Invoices and cashouts stitched into daily profit.",
    span: "lg:col-span-2",
    visual: (
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Invoices", v: "23", accent: "text-white" },
          { l: "Cashouts", v: "ETB 8.4K", accent: "text-apex-orange-light" },
          { l: "Margin", v: "18.4%", accent: "text-emerald-300" },
        ].map((x) => (
          <BentoPanel key={x.l} className="text-center">
            <p className="text-[0.55rem] font-bold uppercase tracking-wider text-white/45">{x.l}</p>
            <p className={cn("mt-1 font-display text-sm font-bold", x.accent)}>{x.v}</p>
          </BentoPanel>
        ))}
      </div>
    ),
    tall: false,
  },
  {
    icon: Users,
    title: "Role workspaces",
    copy: "Manager and pharmacist views tuned to how each role works.",
    span: "",
    visual: (
      <div className="flex gap-2">
        {["Manager", "Pharmacist"].map((r, i) => (
          <div
            key={r}
            className={cn(
              "flex-1 rounded-xl border px-2 py-3 text-center text-[0.62rem] font-bold uppercase tracking-wider",
              i === 0
                ? "border-apex-orange/35 bg-apex-orange/15 text-apex-orange-light shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                : "border-white/12 bg-white/8 text-white/60",
            )}
          >
            {r}
          </div>
        ))}
      </div>
    ),
    tall: false,
  },
  {
    icon: Shield,
    title: "Apex engineering",
    copy: "Security-hardened, scalable, built in Ethiopia.",
    span: "",
    visual: (
      <BentoPanel className="flex items-center justify-center py-5">
        <p className="font-display text-base font-bold gradient-text-apex">Apex Solution</p>
      </BentoPanel>
    ),
    tall: false,
  },
];

export function FeatureBento() {
  return (
    <section>
      <div className="mb-10 text-center">
        <p className="display-kicker text-apex-orange">Platform depth</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">
          Every module, visually alive
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
          From inventory radar to counter checkout — each workflow has its own visual intelligence layer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cells.map((cell) => (
          <div
            key={cell.title}
            className={cn(
              "group flex flex-col overflow-hidden rounded-[1.75rem] border border-white/14 bg-[linear-gradient(160deg,rgba(255,255,255,0.07)_0%,rgba(11,25,46,0.92)_45%,rgba(6,14,26,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_24px_60px_-30px_rgba(0,0,0,0.8)] transition duration-300 hover:border-apex-orange/25 lg:p-6",
              cell.span,
              cell.tall && "lg:row-span-2",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-apex-orange/30 bg-apex-orange/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <cell.icon className="h-5 w-5 text-apex-orange-light" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-white">{cell.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">{cell.copy}</p>
            <div className="mt-auto pt-5">{cell.visual}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
