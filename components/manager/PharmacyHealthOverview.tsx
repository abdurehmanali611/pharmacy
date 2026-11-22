"use client";

import { useMemo } from "react";
import { addDays, addHours, differenceInCalendarDays, format, startOfDay } from "date-fns";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Equal,
  HeartPulse,
  Hourglass,
  Layers,
  Percent,
  Rocket,
  Wallet,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Chip, SectionTitle } from "@/components/manager/kit";
import { WorkspacePanel } from "@/components/manager/workspace";
import type { MedicineData, PurchaseData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { creditDue, daysToExpiry, stockCostValue, toNumber } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { soldPacks, trimNumber } from "@/lib/packSelling";

export type HealthPeriod = {
  /** True for a single day: the chart then shows hours instead of days. */
  hourly: boolean;
  start: Date;
  end: Date;
  label: string;
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function change(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/** Least-squares line through the points: a steady upward slope means the pharmacy is improving. */
function trendLine(values: number[]) {
  const n = values.length;
  const mx = (n - 1) / 2;
  const my = values.reduce((a, b) => a + b, 0) / (n || 1);
  let num = 0;
  let den = 0;
  values.forEach((y, x) => {
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  });
  const slope = den ? num / den : 0;
  return { slope, at: (x: number) => my + slope * (x - mx) };
}

function Delta({ value }: { value: number }) {
  const up = value > 1;
  const down = value < -1;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Equal;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums",
        up && "border-emerald-300/45 bg-emerald-400/15 text-emerald-200",
        down && "border-rose-300/45 bg-rose-400/15 text-rose-200",
        !up && !down && "border-white/25 bg-white/10 text-white/70",
      )}
    >
      <Icon className="size-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function PharmacyHealthOverview({
  purchases,
  medicines,
  period,
}: {
  /** Sales inside the chosen report period. */
  purchases: PurchaseData[];
  medicines: MedicineData[];
  period: HealthPeriod;
}) {
  const model = useMemo(() => {
    const keyOf = (d: Date) => format(d, period.hourly ? "yyyy-MM-dd HH" : "yyyy-MM-dd");
    const today = startOfDay(new Date());
    const last = period.end > today ? today : period.end;
    const first = period.start > last ? last : period.start;
    const count = period.hourly ? 24 : Math.max(2, differenceInCalendarDays(last, first) + 1);
    const days = Array.from({ length: count }, (_, i) => (period.hourly ? addHours(first, i) : addDays(first, i)));
    const byDay = new Map(days.map((d) => [keyOf(d), { revenue: 0, profit: 0, units: 0, sales: 0 }]));
    for (const p of purchases) {
      const bucket = byDay.get(keyOf(new Date(p.created_at)));
      if (!bucket) continue;
      bucket.revenue += toNumber(p.total_price);
      bucket.profit += toNumber(p.profit);
      bucket.units += soldPacks(p);
      bucket.sales += 1;
    }
    const series = days.map((d) => {
      const b = byDay.get(keyOf(d))!;
      return { date: d, label: format(d, period.hourly ? "HH:00" : "MMM d"), ...b };
    });
    const trend = trendLine(series.map((r) => r.revenue));
    const withAvg = series.map((r, i) => {
      const window = series.slice(Math.max(0, i - (period.hourly ? 2 : 6)), i + 1);
      return {
        ...r,
        average: window.reduce((s, x) => s + x.revenue, 0) / window.length,
        trend: Math.max(0, trend.at(i)),
      };
    });

    const sum = (rows: typeof series, key: "revenue" | "profit" | "units" | "sales") => rows.reduce((s, r) => s + r[key], 0);
    const mid = Math.floor(series.length / 2);
    const earlier = series.slice(0, mid);
    const later = series.slice(series.length - mid);
    const wow = {
      revenue: change(sum(later, "revenue"), sum(earlier, "revenue")),
      profit: change(sum(later, "profit"), sum(earlier, "profit")),
      units: change(sum(later, "units"), sum(earlier, "units")),
      sales: change(sum(later, "sales"), sum(earlier, "sales")),
    };
    const half = wow.revenue;

    const revenue30 = sum(series, "revenue");
    const profit30 = sum(series, "profit");
    const margin = revenue30 > 0 ? (profit30 / revenue30) * 100 : 0;
    const totals = {
      revenue: revenue30,
      profit: profit30,
      units: sum(series, "units"),
      sales: sum(series, "sales"),
    };

    // Health factors, each scored 0-100.
    const lines = medicines.length || 1;
    const out = medicines.filter((m) => toNumber(m.quantity) <= 0).length;
    const low = medicines.filter((m) => toNumber(m.quantity) > 0 && toNumber(m.quantity) <= 5).length;
    const stocked = medicines.filter((m) => toNumber(m.quantity) > 0);
    const risky = stocked.filter((m) => {
      const d = daysToExpiry(m.expiry_date);
      return d !== null && d <= 90;
    }).length;
    const stockValue = medicines.reduce((s, m) => s + stockCostValue(m), 0);
    const credit = medicines.reduce((s, m) => s + creditDue(m), 0);

    const factors = [
      { key: "growth", label: "Sales growth", detail: `${wow.revenue >= 0 ? "+" : ""}${wow.revenue.toFixed(1)}% later half vs earlier half`, score: clamp(55 + wow.revenue * 1.2), icon: Rocket, color: "#a855f7" },
      { key: "margin", label: "Profit margin", detail: `${margin.toFixed(1)}% in ${period.label}`, score: clamp(margin * 3.2), icon: Percent, color: "#22d3ee" },
      { key: "stock", label: "Stock health", detail: `${out} out · ${low} low of ${medicines.length} lines`, score: clamp(100 - ((out + low * 0.5) / lines) * 160), icon: Layers, color: "#34d399" },
      { key: "expiry", label: "Expiry safety", detail: `${risky} item${risky === 1 ? "" : "s"} expire within 3 months`, score: clamp(100 - (risky / (stocked.length || 1)) * 180), icon: Hourglass, color: "#fbbf24" },
      { key: "credit", label: "Credit health", detail: `${formatCurrency(credit)} owed to suppliers`, score: clamp(100 - (stockValue > 0 ? (credit / stockValue) * 160 : 0)), icon: Wallet, color: "#f472b6" },
    ];
    const weights = [0.3, 0.2, 0.2, 0.15, 0.15];
    const score = Math.round(factors.reduce((s, f, i) => s + f.score * weights[i], 0));

    const direction = trend.slope > 0 && half > 3 ? "up" : trend.slope < 0 && half < -3 ? "down" : "flat";
    return { series: withAvg, wow, half, margin, factors, score, direction, slope: trend.slope, totals, hasSales: purchases.length > 0 };
  }, [medicines, purchases, period]);

  const verdict =
    model.score >= 75 ? { label: "Thriving", tone: "text-emerald-200", ring: "#34d399" }
    : model.score >= 55 ? { label: "Healthy", tone: "text-cyan-200", ring: "#22d3ee" }
    : model.score >= 40 ? { label: "Needs attention", tone: "text-amber-200", ring: "#fbbf24" }
    : { label: "At risk", tone: "text-rose-200", ring: "#fb7185" };

  const story =
    !model.hasSales
      ? `No sales were recorded in ${period.label}, so there is no trend to read.`
      : model.direction === "up"
        ? `Sales are climbing in ${period.label}: the later half earned ${model.half.toFixed(0)}% more than the earlier half.`
        : model.direction === "down"
          ? `Sales are slipping in ${period.label}: the later half earned ${Math.abs(model.half).toFixed(0)}% less than the earlier half. Check slow movers and stock gaps.`
          : `Sales are steady through ${period.label} with no strong rise or fall.`;

  const gauge = [{ name: "score", value: model.score, fill: verdict.ring }];

  return (
    <WorkspacePanel className="space-y-5 p-5 sm:p-6">
      <SectionTitle
        icon={HeartPulse}
        tint="emerald"
        title="Pharmacy health overview"
        subtitle={`How the pharmacy did in ${period.label}, and whether it is improving`}
        right={
          <Chip
            className={cn(
              model.direction === "up" && "border-emerald-300/50 bg-emerald-400/18 text-emerald-100",
              model.direction === "down" && "border-rose-300/50 bg-rose-400/18 text-rose-100",
              model.direction === "flat" && "border-white/25 bg-white/10 text-white/80",
            )}
          >
            {model.direction === "up" ? <ArrowUpRight className="size-3" /> : model.direction === "down" ? <ArrowDownRight className="size-3" /> : <Equal className="size-3" />}
            {model.direction === "up" ? "Improving" : model.direction === "down" ? "Declining" : "Steady"}
          </Chip>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[19rem_minmax(0,1fr)]">
        {/* score */}
        <div className="workspace-inner-surface tint-emerald flex flex-col items-center gap-3 p-5">
          <p className="tint-text self-start text-[0.65rem] font-bold uppercase tracking-[0.14em]">Health score</p>
          <div className="relative h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="62%" innerRadius="72%" outerRadius="100%" startAngle={200} endAngle={-20} data={gauge} barSize={16}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "rgba(255,255,255,0.1)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-5">
              <span className="font-display text-5xl font-bold tabular-nums text-white">{model.score}</span>
              <span className={cn("text-sm font-bold", verdict.tone)}>{verdict.label}</span>
            </div>
          </div>
          <p className="text-center text-xs leading-relaxed text-white/70">{story}</p>
        </div>

        {/* trend */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-200">
              <Activity className="size-3.5" /> {period.label} · sales and profit
            </p>
            <div className="flex flex-wrap gap-3 text-[11px] text-white/65">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-violet-400" /> Revenue</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-400" /> Profit</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-amber-300" /> moving average</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-pink-300" /> Trend</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={model.series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.ceil(model.series.length / 8) - 1)} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} tickLine={false} axisLine={false} width={46} tickFormatter={(v) => (Math.abs(Number(v)) >= 1000 ? `${Math.round(Number(v) / 100) / 10}k` : `${v}`)} />
                <Tooltip
                  contentStyle={{ background: "#0d0b2b", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 12 }}
                  formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#c084fc" strokeWidth={2.5} fill="url(#healthRevenue)" />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#34d399" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="average" name="Moving average" stroke="#fcd34d" strokeWidth={2} dot={false} />
                <Line type="linear" dataKey="trend" name="Trend" stroke="#f9a8d4" strokeWidth={2} strokeDasharray="6 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* period totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Revenue", formatCurrency(model.totals.revenue), model.wow.revenue, "tint-violet"],
          ["Profit", formatCurrency(model.totals.profit), model.wow.profit, "tint-emerald"],
          ["Units sold", trimNumber(model.totals.units), model.wow.units, "tint-cyan"],
          ["Sale lines", model.totals.sales.toLocaleString(), model.wow.sales, "tint-pink"],
        ].map(([label, value, delta, tint]) => (
          <div key={label as string} className={cn("workspace-inner-surface p-4", tint as string)}>
            <p className="tint-text text-[0.65rem] font-bold uppercase tracking-[0.14em]">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums text-white">{value as string}</p>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-white/60">
              <Delta value={delta as number} /> later half vs earlier half
            </div>
          </div>
        ))}
      </div>

      {/* what drives the score */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {model.factors.map((f) => (
          <div key={f.key} className="rounded-2xl border border-white/12 bg-white/4 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${f.color}30`, color: f.color }}>
                <f.icon className="size-4" />
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-lg font-bold tabular-nums text-white">{Math.round(f.score)}</span>
                <span className="text-[0.62rem] font-bold uppercase tracking-wider" style={{ color: f.color }}>
                  {f.score >= 75 ? "Excellent" : f.score >= 55 ? "Good" : f.score >= 40 ? "Fair" : "Poor"}
                </span>
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-white">{f.label}</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${f.score}%`, background: `linear-gradient(90deg, ${f.color}, #f0abfc)` }} />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-white/55">{f.detail}</p>
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
}
