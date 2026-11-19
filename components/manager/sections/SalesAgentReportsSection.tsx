"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Award,
  BadgeDollarSign,
  Clock3,
  Crown,
  Percent,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Swords,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Chip, EmptyState, InitialsAvatar, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import {
  matchesReportPeriod,
  ReportPeriodFilter,
  type ReportPeriod,
} from "@/components/manager/sections/ManagerReportSection";
import { WorkspacePanel, WorkspaceSectionHeader } from "@/components/manager/workspace";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PendingSaleData, PurchaseData, UserData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { toNumber } from "@/lib/inventory";
import { cn } from "@/lib/utils";

type AgentStats = {
  key: string;
  name: string;
  username?: string;
  removed: boolean;
  lines: number;
  receipts: number;
  units: number;
  revenue: number;
  profit: number;
  avgReceipt: number;
  discountGiven: number;
  discountedLines: number;
  ruleLines: number;
  held: number;
  settled: number;
  rejected: number;
  activeDays: number;
  lastSale: string | null;
  bestDay: { date: string; revenue: number } | null;
  topMedicines: { name: string; qty: number }[];
  hours: number[];
  daily: number[];
  peakHour: number | null;
  share: number;
};

const METRICS: { value: string; label: string; pick: (a: AgentStats) => number; money: boolean }[] = [
  { value: "revenue", label: "Revenue", pick: (a) => a.revenue, money: true },
  { value: "profit", label: "Profit", pick: (a) => a.profit, money: true },
  { value: "units", label: "Units sold", pick: (a) => a.units, money: false },
  { value: "receipts", label: "Sales made", pick: (a) => a.receipts, money: false },
  { value: "avg", label: "Average sale value", pick: (a) => a.avgReceipt, money: true },
  { value: "discount", label: "Discounts given", pick: (a) => a.discountGiven, money: true },
];

const LINE_COLORS = ["#c084fc", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"];
const MEDALS = ["from-amber-300 to-yellow-500", "from-slate-200 to-slate-400", "from-orange-300 to-amber-700"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Small filled trend line used on agent cards. */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 120;
  const h = 36;
  if (values.length < 2 || Math.max(...values) <= 0) {
    return <div className="flex h-9 w-28 items-center justify-center text-[0.6rem] text-white/35">no trend</div>;
  }
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const id = `spark-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const agentKey = (p: PurchaseData) =>
  p.sold_by_id != null ? `id:${p.sold_by_id}` : p.sold_by_name ? `name:${p.sold_by_name}` : "none";

const isDiscounted = (p: PurchaseData) => toNumber(p.discount_percent) > 0;
const discountGiven = (p: PurchaseData) =>
  isDiscounted(p) ? Math.max(0, toNumber(p.list_price) - toNumber(p.price)) * toNumber(p.quantity) : 0;

export function SalesAgentReportsSection({
  pharmacists,
  purchases,
  pendingSales,
}: {
  pharmacists: UserData[];
  purchases: PurchaseData[];
  pendingSales: PendingSaleData[];
}) {
  const [reportMode, setReportMode] = useState<ReportPeriod>("monthly");
  const [reportDay, setReportDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportYear, setReportYear] = useState(() => String(new Date().getFullYear()));
  const [reportQuarter, setReportQuarter] = useState(() => String(Math.ceil((new Date().getMonth() + 1) / 3)));
  const [reportHalf, setReportHalf] = useState(() => (new Date().getMonth() < 6 ? "1" : "2"));
  const [metric, setMetric] = useState("revenue");
  const [ledgerAgent, setLedgerAgent] = useState("all");
  const [ledgerSearch, setLedgerSearch] = useState("");

  const inPeriod = (createdAt: string) =>
    matchesReportPeriod(createdAt, reportMode, reportDay, reportMonth, reportYear, reportQuarter, reportHalf);

  const yearOptions = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    for (const p of purchases) {
      const y = new Date(p.created_at).getUTCFullYear();
      if (Number.isFinite(y)) years.add(y);
    }
    return [...years].sort((a, b) => b - a).map((y) => ({ value: String(y), label: String(y) }));
  }, [purchases]);

  const periodPurchases = useMemo(
    () => purchases.filter((p) => inPeriod(p.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [purchases, reportDay, reportHalf, reportMode, reportMonth, reportQuarter, reportYear],
  );
  const periodPending = useMemo(
    () => pendingSales.filter((s) => inPeriod(s.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingSales, reportDay, reportHalf, reportMode, reportMonth, reportQuarter, reportYear],
  );

  const agents = useMemo<AgentStats[]>(() => {
    const roster = new Map<string, { name: string; username?: string; removed: boolean }>();
    for (const u of pharmacists) roster.set(`id:${u.id}`, { name: u.full_name || u.username, username: u.username, removed: false });
    for (const p of periodPurchases) {
      const key = agentKey(p);
      if (!roster.has(key)) {
        roster.set(key, {
          name: key === "none" ? "Unassigned (before agents)" : p.sold_by_name || "Former agent",
          removed: key !== "none",
        });
      }
    }

    const totalRevenue = periodPurchases.reduce((s, p) => s + toNumber(p.total_price), 0);
    const dayKeys = [...new Set(periodPurchases.map((p) => format(new Date(p.created_at), "yyyy-MM-dd")))].sort();
    const out: AgentStats[] = [];
    for (const [key, info] of roster) {
      const mine = periodPurchases.filter((p) => agentKey(p) === key);
      const receipts = new Set(mine.map((p) => `${p.created_at.slice(0, 19)}`)).size;
      const revenue = mine.reduce((s, p) => s + toNumber(p.total_price), 0);
      const days = new Map<string, number>();
      const meds = new Map<string, number>();
      const hours = Array.from({ length: 24 }, () => 0);
      for (const p of mine) {
        const d = new Date(p.created_at);
        const dayKey = format(d, "yyyy-MM-dd");
        days.set(dayKey, (days.get(dayKey) ?? 0) + toNumber(p.total_price));
        meds.set(p.medicine_name, (meds.get(p.medicine_name) ?? 0) + toNumber(p.quantity));
        hours[d.getHours()] += 1;
      }
      const bestDayEntry = [...days.entries()].sort((a, b) => b[1] - a[1])[0];
      const peak = Math.max(...hours);
      const agentId = key.startsWith("id:") ? Number(key.slice(3)) : null;
      const theirPending = agentId != null ? periodPending.filter((s) => s.created_by === agentId) : [];

      out.push({
        key,
        name: info.name,
        username: info.username,
        removed: info.removed,
        lines: mine.length,
        receipts,
        units: mine.reduce((s, p) => s + toNumber(p.quantity), 0),
        revenue,
        profit: mine.reduce((s, p) => s + toNumber(p.profit), 0),
        avgReceipt: receipts ? revenue / receipts : 0,
        discountGiven: mine.reduce((s, p) => s + discountGiven(p), 0),
        discountedLines: mine.filter(isDiscounted).length,
        ruleLines: mine.filter((p) => p.rule_trigger && p.rule_trigger !== "none").length,
        held: theirPending.length,
        settled: theirPending.filter((s) => s.status === "settled").length,
        rejected: theirPending.filter((s) => s.status === "rejected").length,
        activeDays: days.size,
        lastSale: mine.length ? mine.map((p) => p.created_at).sort().at(-1) ?? null : null,
        bestDay: bestDayEntry ? { date: bestDayEntry[0], revenue: bestDayEntry[1] } : null,
        topMedicines: [...meds.entries()].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 3),
        hours,
        daily: dayKeys.map((k) => days.get(k) ?? 0),
        peakHour: peak > 0 ? hours.indexOf(peak) : null,
        share: totalRevenue ? (revenue / totalRevenue) * 100 : 0,
      });
    }
    return out.sort((a, b) => b.revenue - a.revenue);
  }, [pharmacists, periodPending, periodPurchases]);

  const active = agents.filter((a) => a.lines > 0);
  const totalRevenue = agents.reduce((s, a) => s + a.revenue, 0);
  const top = active[0];
  const byReceipts = [...active].sort((a, b) => b.receipts - a.receipts)[0];
  const byAvg = [...active].sort((a, b) => b.avgReceipt - a.avgReceipt)[0];
  const byDiscount = [...active].sort((a, b) => b.discountGiven - a.discountGiven)[0];
  const heldTotal = agents.reduce((s, a) => s + a.held, 0);
  const settledTotal = agents.reduce((s, a) => s + a.settled, 0);

  const metricDef = METRICS.find((m) => m.value === metric) ?? METRICS[0];
  const ranked = [...agents].sort((a, b) => metricDef.pick(b) - metricDef.pick(a));
  const maxMetric = Math.max(...ranked.map((a) => metricDef.pick(a)), 1);
  const fmt = (n: number) => (metricDef.money ? formatCurrency(n) : n.toLocaleString());

  // Trend: hourly for a single day, otherwise one point per day.
  const trend = (() => {
    const topAgents = active.slice(0, 6);
    const buckets = new Map<string, Record<string, number | string>>();
    for (const p of periodPurchases) {
      const key = agentKey(p);
      if (!topAgents.some((a) => a.key === key)) continue;
      const d = new Date(p.created_at);
      const label = reportMode === "daily" ? `${String(d.getHours()).padStart(2, "0")}:00` : format(d, "MMM d");
      const sortKey = reportMode === "daily" ? label : format(d, "yyyy-MM-dd");
      const row = buckets.get(sortKey) ?? { label };
      row[key] = (Number(row[key]) || 0) + toNumber(p.total_price);
      buckets.set(sortKey, row);
    }
    return { rows: [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v), topAgents };
  })();

  // Weekday x hour heat map for the whole team.
  const heat = (() => {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    for (const p of periodPurchases) {
      const d = new Date(p.created_at);
      grid[(d.getDay() + 6) % 7][d.getHours()] += 1;
    }
    return { grid, max: Math.max(...grid.flat(), 1), total: periodPurchases.length };
  })();

  // Radar: every measure scaled 0-100 against the best agent.
  const radar = (() => {
    const axes = METRICS.filter((m) => m.value !== "discount");
    const list = active.slice(0, 5);
    const rows = axes.map((m) => {
      const best = Math.max(...list.map((a) => m.pick(a)), 1);
      const row: Record<string, number | string> = { axis: m.label.replace("Average sale value", "Avg sale") };
      for (const a of list) row[a.key] = Math.round((m.pick(a) / best) * 100);
      return row;
    });
    return { rows, list };
  })();

  const ledger = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    return periodPurchases
      .filter((p) => (ledgerAgent === "all" ? true : agentKey(p) === ledgerAgent))
      .filter((p) => !q || `${p.medicine_name} ${p.customer_name ?? ""} ${p.sold_by_name ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 60);
  }, [ledgerAgent, ledgerSearch, periodPurchases]);

  const agentName = (p: PurchaseData) => agents.find((a) => a.key === agentKey(p))?.name ?? (p.sold_by_name || "Unassigned");

  const kpis = [
    { label: "Agent sales", value: formatCurrency(totalRevenue), hint: `${active.length} of ${pharmacists.length} agents sold`, icon: BadgeDollarSign, tint: "tint-violet" },
    { label: "Top performer", value: top?.name ?? "—", hint: top ? `${formatCurrency(top.revenue)} · ${top.share.toFixed(0)}% of sales` : "No sales yet", icon: Crown, tint: "tint-amber" },
    { label: "Most active", value: byReceipts?.name ?? "—", hint: byReceipts ? `${byReceipts.receipts} sales made` : "No sales yet", icon: Zap, tint: "tint-cyan" },
    { label: "Best average sale", value: byAvg?.name ?? "—", hint: byAvg ? `${formatCurrency(byAvg.avgReceipt)} per sale` : "No sales yet", icon: TrendingUp, tint: "tint-emerald" },
    { label: "Biggest discounter", value: byDiscount && byDiscount.discountGiven > 0 ? byDiscount.name : "—", hint: byDiscount && byDiscount.discountGiven > 0 ? `${formatCurrency(byDiscount.discountGiven)} given` : "No discounts given", icon: Percent, tint: "tint-pink" },
    { label: "Held-sale approval", value: heldTotal ? `${Math.round((settledTotal / heldTotal) * 100)}%` : "—", hint: `${settledTotal} of ${heldTotal} held sales completed`, icon: ShieldCheck, tint: "tint-sky" },
  ];

  return (
    <div className="space-y-5">
      <WorkspacePanel>
        <WorkspaceSectionHeader
          title="Sales agent performance"
          description="Activity, sales and side-by-side comparison of every sales agent."
        />
        <div className="space-y-5 p-4 sm:p-6">
          <ReportPeriodFilter
            reportMode={reportMode}
            reportDay={reportDay}
            reportMonth={reportMonth}
            reportYear={reportYear}
            reportQuarter={reportQuarter}
            reportHalf={reportHalf}
            yearOptions={yearOptions}
            onModeChange={setReportMode}
            onDayChange={setReportDay}
            onMonthChange={setReportMonth}
            onYearChange={setReportYear}
            onQuarterChange={setReportQuarter}
            onHalfChange={setReportHalf}
          />
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
            {kpis.map((k) => (
              <div key={k.label} className={cn("workspace-inner-surface relative flex min-h-36 w-64 shrink-0 snap-start flex-col justify-between p-4", k.tint)}>
                <div className="flex items-start justify-between gap-3">
                  <p className="tint-text text-[0.65rem] font-bold uppercase tracking-[0.14em]">{k.label}</p>
                  <span className="tint-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <k.icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="truncate font-display text-2xl font-bold text-white" title={k.value}>{k.value}</p>
                  <p className="mt-1 truncate text-sm text-white/70">{k.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </WorkspacePanel>

      {agents.length === 0 ? (
        <WorkspacePanel className="p-6">
          <EmptyState icon={Users} tint="violet" title="No sales agents yet" description="Create sales agents in the Team section to start tracking their sales." />
        </WorkspacePanel>
      ) : (
        <>
          {/* podium */}
          {active.length ? (
            <WorkspacePanel className="space-y-5 p-5 sm:p-6">
              <SectionTitle icon={Trophy} tint="amber" title="Top sellers" subtitle="The agents bringing in the most revenue this period" />
              <div className="grid items-end gap-4 sm:grid-cols-3">
                {[1, 0, 2].map((rank) => {
                  const a = active[rank];
                  if (!a) return <div key={rank} className="hidden sm:block" />;
                  const heights = ["sm:min-h-64", "sm:min-h-52", "sm:min-h-44"];
                  return (
                    <div
                      key={a.key}
                      className={cn(
                        "relative flex flex-col items-center justify-end gap-2 overflow-hidden rounded-3xl border p-5 text-center",
                        heights[rank],
                        rank === 0
                          ? "border-amber-300/45 bg-[linear-gradient(180deg,rgba(251,191,36,0.2),rgba(168,85,247,0.1))] shadow-[0_20px_50px_-28px_rgba(251,191,36,0.9)]"
                          : "border-white/12 bg-white/5",
                      )}
                    >
                      <span className={cn("flex size-9 items-center justify-center rounded-full bg-gradient-to-br font-display text-sm font-bold text-slate-900", MEDALS[rank])}>
                        {rank === 0 ? <Crown className="size-4" /> : rank + 1}
                      </span>
                      <InitialsAvatar name={a.name} className={cn(rank === 0 ? "size-16 text-xl" : "size-12 text-base")} />
                      <p className="max-w-full truncate font-display text-base font-bold text-white">{a.name}</p>
                      <p className="font-display text-xl font-bold tabular-nums text-white">{formatCurrency(a.revenue)}</p>
                      <p className="text-xs text-white/60">{a.receipts} sales · {a.share.toFixed(0)}% of revenue</p>
                    </div>
                  );
                })}
              </div>
            </WorkspacePanel>
          ) : null}

          {/* radar + heat map */}
          <div className="grid gap-5 xl:grid-cols-2">
            <WorkspacePanel className="space-y-4 p-5 sm:p-6">
              <SectionTitle icon={Sparkles} tint="violet" title="Strengths radar" subtitle="Each measure scaled against the best agent (100)" />
              {radar.list.length >= 2 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radar.rows} outerRadius="72%">
                      <PolarGrid stroke="rgba(255,255,255,0.14)" />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      {radar.list.map((a, i) => (
                        <Radar key={a.key} name={a.name} dataKey={a.key} stroke={LINE_COLORS[i % LINE_COLORS.length]} fill={LINE_COLORS[i % LINE_COLORS.length]} fillOpacity={0.18} strokeWidth={2} />
                      ))}
                      <Tooltip contentStyle={{ background: "#14103a", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, color: "#fff" }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={Users} tint="violet" title="Need two selling agents" description="The radar compares agents once at least two have sales in this period." />
              )}
            </WorkspacePanel>

            <WorkspacePanel className="space-y-4 p-5 sm:p-6">
              <SectionTitle icon={Clock3} tint="cyan" title="When sales happen" subtitle="Team activity by weekday and hour — brighter is busier" />
              {heat.total ? (
                <div className="overflow-x-auto pb-1">
                  <div className="min-w-[30rem] space-y-1">
                    {heat.grid.map((row, d) => (
                      <div key={WEEKDAYS[d]} className="flex items-center gap-2">
                        <span className="w-8 shrink-0 text-[0.65rem] font-bold uppercase text-white/55">{WEEKDAYS[d]}</span>
                        <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-0.5">
                          {row.map((count, h) => (
                            <div
                              key={h}
                              title={`${WEEKDAYS[d]} ${String(h).padStart(2, "0")}:00 · ${count} line${count === 1 ? "" : "s"}`}
                              className="aspect-square rounded-[3px] border border-white/5"
                              style={{ background: count ? `rgba(168,85,247,${0.18 + (count / heat.max) * 0.82})` : "rgba(255,255,255,0.05)" }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pl-10 text-[0.6rem] text-white/45">
                      {[0, 6, 12, 18, 23].map((h) => (
                        <span key={h} className="flex-1">{String(h).padStart(2, "0")}h</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Clock3} tint="cyan" title="No sales in this period" description="Pick another period to see when the team sells most." />
              )}
            </WorkspacePanel>
          </div>

          {/* comparison */}
          <WorkspacePanel className="space-y-5 p-5 sm:p-6">
            <SectionTitle
              icon={Swords}
              tint="fuchsia"
              title="Agent comparison"
              subtitle="Rank every agent on the measure you pick"
              right={
                <div className="w-full sm:w-56">
                  <Combobox
                    value={metric}
                    onChange={setMetric}
                    options={METRICS.map((m) => ({ value: m.value, label: m.label }))}
                    placeholder="Compare by…"
                  />
                </div>
              }
            />
            <div className="space-y-2.5">
              {ranked.map((a, i) => {
                const value = metricDef.pick(a);
                return (
                  <div key={a.key} className="grid grid-cols-[2.25rem_minmax(0,11rem)_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-3 py-2.5">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-sm font-bold text-slate-900",
                        i < 3 ? `bg-gradient-to-br ${MEDALS[i]}` : "bg-white/15 text-white",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <InitialsAvatar name={a.name} className="size-9 rounded-xl text-xs" />
                      <p className="truncate text-sm font-bold text-white">{a.name}</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7,#f472b6,#fbbf24)] transition-[width] duration-500"
                        style={{ width: `${Math.max(2, (value / maxMetric) * 100)}%` }}
                      />
                    </div>
                    <span className="w-28 text-right text-sm font-bold tabular-nums text-white">{fmt(value)}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-200">Share of total sales</p>
              <div className="flex h-4 overflow-hidden rounded-full bg-white/10">
                {agents.filter((a) => a.revenue > 0).map((a, i) => (
                  <div key={a.key} title={`${a.name}: ${a.share.toFixed(1)}%`} className="h-full" style={{ width: `${a.share}%`, backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                {agents.filter((a) => a.revenue > 0).map((a, i) => (
                  <span key={a.key} className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                    {a.name} · {a.share.toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          </WorkspacePanel>

          {/* trend */}
          <WorkspacePanel className="space-y-4 p-5 sm:p-6">
            <SectionTitle
              icon={TrendingUp}
              tint="cyan"
              title={reportMode === "daily" ? "Sales by hour" : "Sales trend by day"}
              subtitle="Revenue of your top agents over the period"
            />
            {trend.rows.length ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.rows} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                      tickFormatter={(v) => (Math.abs(Number(v)) >= 1000 ? `${Math.round(Number(v) / 100) / 10}k` : `${v}`)}
                    />
                    <Tooltip
                      contentStyle={{ background: "#0d0b2b", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 12 }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    {trend.topAgents.map((a, i) => (
                      <Line key={a.key} type="monotone" dataKey={a.key} name={a.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={3} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} tint="cyan" title="No sales in this period" description="Pick another period to see agent trends." />
            )}
          </WorkspacePanel>

          {/* leaderboard */}
          <WorkspacePanel className="space-y-5 p-5 sm:p-6">
            <SectionTitle icon={Trophy} tint="amber" title="Leaderboard" subtitle="Every measure side by side" />
            <div className="overflow-x-auto rounded-2xl border border-violet-300/25">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    {["#", "Sales agent", "Sales", "Units", "Revenue", "Profit", "Avg sale", "Discounts", "Rule sales", "Held / approved", "Active days", "Last sale"].map((h) => (
                      <TableHead key={h} className={tableHeadClass}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((a, i) => (
                    <TableRow key={a.key} className="border-white/8">
                      <TableCell className="tabular-nums text-white/70">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={a.name} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{a.name}</p>
                            <p className="text-xs text-white/50">{a.removed ? "Former agent" : a.username ? `@${a.username}` : "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-white/85">{a.receipts}</TableCell>
                      <TableCell className="tabular-nums text-white/85">{a.units}</TableCell>
                      <TableCell>
                        <div className="w-32 space-y-1">
                          <p className="font-bold tabular-nums text-white">{formatCurrency(a.revenue)}</p>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[linear-gradient(90deg,#a855f7,#f472b6)]" style={{ width: `${a.share}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-emerald-200">{formatCurrency(a.profit)}</TableCell>
                      <TableCell className="tabular-nums text-white/85">{formatCurrency(a.avgReceipt)}</TableCell>
                      <TableCell className="tabular-nums text-fuchsia-200">{a.discountGiven ? formatCurrency(a.discountGiven) : "—"}</TableCell>
                      <TableCell className="tabular-nums text-white/85">{a.ruleLines}</TableCell>
                      <TableCell className="tabular-nums text-white/85">{a.held ? `${a.settled}/${a.held}` : "—"}</TableCell>
                      <TableCell className="tabular-nums text-white/85">{a.activeDays}</TableCell>
                      <TableCell className="whitespace-nowrap text-white/70">{a.lastSale ? format(new Date(a.lastSale), "PP p") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </WorkspacePanel>

          {/* agent cards */}
          <div className="grid gap-5 xl:grid-cols-2">
            {agents.map((a, i) => {
              const peak = Math.max(...a.hours, 1);
              const accent = LINE_COLORS[i % LINE_COLORS.length];
              return (
                <WorkspacePanel key={a.key} className="relative space-y-4 overflow-hidden p-5">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <InitialsAvatar name={a.name} className="size-12 text-base" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-bold text-white">{a.name}</p>
                        <p className="text-xs text-white/55">{a.removed ? "Former agent" : a.username ? `@${a.username}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Sparkline values={a.daily} color={accent} />
                      <div className="flex flex-wrap justify-end gap-1">
                        {top?.key === a.key ? (
                          <Chip className="border-amber-300/50 bg-amber-400/20 text-amber-100"><Award className="size-3" /> Top seller</Chip>
                        ) : null}
                        {byReceipts?.key === a.key && a.receipts > 0 ? (
                          <Chip className="border-cyan-300/50 bg-cyan-400/15 text-cyan-100"><Zap className="size-3" /> Most active</Chip>
                        ) : null}
                        {byAvg?.key === a.key && a.avgReceipt > 0 ? (
                          <Chip className="border-emerald-300/50 bg-emerald-400/15 text-emerald-100"><TrendingUp className="size-3" /> Best avg</Chip>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, a.share)}%`, background: `linear-gradient(90deg, ${accent}, #f472b6)` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-white/80">{a.share.toFixed(0)}% of revenue</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ["Revenue", formatCurrency(a.revenue)],
                      ["Profit", formatCurrency(a.profit)],
                      ["Units", String(a.units)],
                      ["Avg sale", formatCurrency(a.avgReceipt)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <p className="text-[0.6rem] font-bold uppercase tracking-wider text-white/50">{label}</p>
                        <p className="truncate text-sm font-bold tabular-nums text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-200">
                      <Clock3 className="size-3.5" /> Activity by hour{a.peakHour != null ? ` · peak ${String(a.peakHour).padStart(2, "0")}:00` : ""}
                    </p>
                    <div className="flex h-12 items-end gap-0.5">
                      {a.hours.map((count, hour) => (
                        <div key={hour} title={`${String(hour).padStart(2, "0")}:00 · ${count} line${count === 1 ? "" : "s"}`} className="flex-1 rounded-sm bg-white/10" style={{ height: `${Math.max(8, (count / peak) * 100)}%` }}>
                          <div className={cn("h-full w-full rounded-sm", count ? "bg-[linear-gradient(180deg,#22d3ee,#a855f7)]" : "")} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                    {a.topMedicines.length ? a.topMedicines.map((m) => (
                      <Chip key={m.name} seed={m.name}>{m.name} · {m.qty}</Chip>
                    )) : <span className="text-white/45">No sales in this period</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
                    <span><ReceiptText className="mr-1 inline size-3.5 text-violet-300" />{a.receipts} sales · {a.lines} lines</span>
                    <span><Sparkles className="mr-1 inline size-3.5 text-fuchsia-300" />{a.discountedLines} discounted</span>
                    <span><ShieldCheck className="mr-1 inline size-3.5 text-emerald-300" />{a.held ? `${a.settled}/${a.held} held sales approved${a.rejected ? ` · ${a.rejected} rejected` : ""}` : "No held sales"}</span>
                    {a.bestDay ? <span>Best day {format(new Date(a.bestDay.date), "PP")} · {formatCurrency(a.bestDay.revenue)}</span> : null}
                  </div>
                </WorkspacePanel>
              );
            })}
          </div>

          {/* ledger */}
          <WorkspacePanel className="space-y-5 p-5 sm:p-6">
            <SectionTitle icon={ReceiptText} tint="violet" title="Sales by agent" subtitle="Latest sales in this period, newest first" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Input value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} placeholder="Search medicine, customer or agent…" className="h-10 w-full sm:max-w-sm" />
              <div className="w-full sm:w-60">
                <Combobox
                  value={ledgerAgent}
                  onChange={setLedgerAgent}
                  options={[{ value: "all", label: "All agents" }, ...agents.map((a) => ({ value: a.key, label: a.name }))]}
                  placeholder="Agent…"
                />
              </div>
            </div>
            {ledger.length ? (
              <div className="max-h-96 overflow-auto rounded-2xl border border-violet-300/25">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      {["Time", "Agent", "Medicine", "Qty", "Price", "Customer", "Revenue"].map((h) => (
                        <TableHead key={h} className={tableHeadClass}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger.map((p) => (
                      <TableRow key={p.id} className="border-white/8">
                        <TableCell className="whitespace-nowrap text-white/70">{format(new Date(p.created_at), "PP p")}</TableCell>
                        <TableCell className="font-semibold text-white">{agentName(p)}</TableCell>
                        <TableCell className="text-white/85">{p.medicine_name}</TableCell>
                        <TableCell className="tabular-nums text-white/85">{p.quantity}</TableCell>
                        <TableCell className="tabular-nums text-white/85">{formatCurrency(toNumber(p.price))}</TableCell>
                        <TableCell className="text-white/70">{p.customer_name || "—"}</TableCell>
                        <TableCell className="font-bold tabular-nums text-white">{formatCurrency(toNumber(p.total_price))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState icon={ReceiptText} tint="violet" title="No sales match" description="Try another agent, search or period." />
            )}
          </WorkspacePanel>
        </>
      )}
    </div>
  );
}
