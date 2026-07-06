"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { WorkspaceInnerPanel } from "@/components/manager/workspace";
import { formatCurrency } from "@/lib/format";
import type { MedicineData, PurchaseData } from "@/lib/actions";

type StockHealthRow = { name: string; count: number; fill: string };

function InventoryHealthBars({ rows }: { rows: StockHealthRow[] }) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {rows.map((row) => (
        <div
          key={row.name}
          title={`${row.name}: ${row.count} ${row.count === 1 ? "medicine" : "medicines"}`}
          className="group grid grid-cols-[4.75rem_minmax(0,1fr)_2.25rem] items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-colors hover:border-white/10 hover:bg-white/6"
        >
          <span className="text-[0.68rem] font-semibold leading-none text-white/55 group-hover:text-white/85">
            {row.name}
          </span>

          <div className="h-3 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-[width] duration-300 group-hover:brightness-110"
              style={{
                width: `${(row.count / maxCount) * 100}%`,
                backgroundColor: row.fill,
              }}
            />
          </div>

          <span className="text-right text-xs font-bold tabular-nums leading-none text-white/70 group-hover:text-white">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ManagerAnalyticsCharts({
  purchases,
  medicines,
  getStockLevel,
  getExpiryLevel,
}: {
  purchases: PurchaseData[];
  medicines: MedicineData[];
  getStockLevel: (qty: number) => "out" | "critical" | "low" | "ok";
  getExpiryLevel: (date?: string | null) => "expired" | "soon" | "ok" | "none";
}) {
  const salesTrend = useMemo(() => {
    const buckets = new Map<string, { label: string; sales: number; profit: number }>();

    for (const item of purchases) {
      const date = new Date(item.created_at);
      if (Number.isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const existing = buckets.get(key) ?? { label, sales: 0, profit: 0 };
      existing.sales += Number(item.total_price);
      existing.profit += Number(item.profit);
      buckets.set(key, existing);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        label: value.label,
        sales: Math.round(value.sales),
        profit: Math.round(value.profit),
      }));
  }, [purchases]);

  const stockHealth = useMemo<StockHealthRow[]>(() => {
    const counts = { out: 0, critical: 0, low: 0, ok: 0, expired: 0, soon: 0 };
    for (const med of medicines) {
      const stock = getStockLevel(Number(med.quantity));
      counts[stock] += 1;
      const expiry = getExpiryLevel(med.expiry_date);
      if (expiry === "expired") counts.expired += 1;
      if (expiry === "soon") counts.soon += 1;
    }
    return [
      { name: "OK", count: counts.ok, fill: "#34d399" },
      { name: "Low", count: counts.low, fill: "#f5b042" },
      { name: "Critical", count: counts.critical, fill: "#fb923c" },
      { name: "Out", count: counts.out, fill: "#f87171" },
      { name: "Expiring", count: counts.soon, fill: "#fbbf24" },
      { name: "Expired", count: counts.expired, fill: "#ef4444" },
    ].filter((row) => row.count > 0);
  }, [getExpiryLevel, getStockLevel, medicines]);

  const tooltipStyle = {
    background: "#0b192e",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    fontSize: 11,
    color: "#fff",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <WorkspaceInnerPanel className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/45">Revenue pulse</p>
            <p className="mt-0.5 text-sm text-white/55">Sales & profit for selected period</p>
          </div>
        </div>
        <div className="h-[220px] w-full">
          {salesTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === "sales" ? "Sales" : "Profit",
                  ]}
                />
                <Line type="monotone" dataKey="sales" stroke="#f5b042" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/40">
              No sales data for this period
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-4 border-t border-white/8 pt-3">
          <span className="flex items-center gap-2 text-xs text-white/45">
            <span className="h-0.5 w-5 rounded bg-apex-orange-light" />
            Sales
          </span>
          <span className="flex items-center gap-2 text-xs text-white/45">
            <span className="h-0.5 w-5 rounded bg-emerald-400" />
            Profit
          </span>
        </div>
      </WorkspaceInnerPanel>

      <WorkspaceInnerPanel className="p-4">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/45">Inventory health</p>
        <p className="mt-0.5 text-sm text-white/55">Stock & expiry distribution</p>
        <div className="mt-3 h-[220px] w-full">
          {stockHealth.length ? (
            <InventoryHealthBars rows={stockHealth} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/40">No medicines in inventory</div>
          )}
        </div>
      </WorkspaceInnerPanel>
    </div>
  );
}
