"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  Flame,
  HandCoins,
  Hourglass,
  PackageX,
  Rocket,
  Snail,
  TimerOff,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";

import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { ManagerAnalyticsCharts } from "@/components/manager/ManagerAnalyticsCharts";
import { PharmacyHealthOverview } from "@/components/manager/PharmacyHealthOverview";
import { ReportRuleImpact } from "@/components/manager/ReportRuleImpact";
import { Chip, EmptyState, InitialsAvatar, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import { WorkspacePanel, WorkspaceSectionHeader, WorkspaceStat } from "@/components/manager/workspace";
import { ReportDataTable } from "@/components/report/ReportDataTable";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  CashoutData,
  InvoiceData,
  MedicineData,
  PendingSaleData,
  PurchaseData,
  StockLossData,
  SupplierData,
} from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import {
  creditDue,
  daysToExpiry,
  EXPIRY_DOT_CLASSES,
  EXPIRY_TONE_CLASSES,
  expiryLabel,
  expiryTone,
  paidAmount,
  stockCostValue,
  toNumber,
  totalCost,
  type ExpiryTone,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";

const purchaseColumns: ColumnDef<PurchaseData>[] = [
  { accessorKey: "medicine_name", header: "Medicine" },
  { accessorKey: "quantity", header: "Qty" },
  {
    accessorKey: "total_price",
    header: "Revenue",
    cell: ({ row }) => formatCurrency(row.original.total_price),
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ row }) => formatCurrency(row.original.profit),
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];

export type ReportPeriod = "daily" | "monthly" | "quarterly" | "half-year" | "annually";

export function matchesReportPeriod(
  createdAt: string,
  reportMode: ReportPeriod,
  reportDay: string,
  reportMonth: string,
  reportYear: string,
  reportQuarter: string,
  reportHalf: string,
) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  switch (reportMode) {
    case "daily":
      return date.toISOString().slice(0, 10) === reportDay;
    case "monthly":
      return date.toISOString().slice(0, 7) === reportMonth;
    case "quarterly":
      return String(year) === reportYear && String(Math.ceil(month / 3)) === reportQuarter;
    case "half-year":
      return String(year) === reportYear && String(month <= 6 ? 1 : 2) === reportHalf;
    case "annually":
      return String(year) === reportYear;
  }
}

export function ReportPeriodFilter({
  reportMode,
  reportDay,
  reportMonth,
  reportYear,
  reportQuarter,
  reportHalf,
  yearOptions,
  onModeChange,
  onDayChange,
  onMonthChange,
  onYearChange,
  onQuarterChange,
  onHalfChange,
}: {
  reportMode: ReportPeriod;
  reportDay: string;
  reportMonth: string;
  reportYear: string;
  reportQuarter: string;
  reportHalf: string;
  yearOptions: ComboboxOption[];
  onModeChange: (mode: ReportPeriod) => void;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onQuarterChange: (value: string) => void;
  onHalfChange: (value: string) => void;
}) {
  const periodOptions: ComboboxOption[] = [
    { value: "daily", label: "Daily" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "half-year", label: "Half-year" },
    { value: "annually", label: "Annually" },
  ];
  const subdivisionOptions: ComboboxOption[] =
    reportMode === "quarterly"
      ? [1, 2, 3, 4].map((quarter) => ({ value: String(quarter), label: `Quarter ${quarter}` }))
      : [
          { value: "1", label: "First half (Jan–Jun)" },
          { value: "2", label: "Second half (Jul–Dec)" },
        ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {reportMode === "daily" ? (
        <DateFilterPicker value={reportDay} onChange={onDayChange} placeholder="Pick a day" />
      ) : reportMode === "monthly" ? (
        <DateFilterPicker value={reportMonth} onChange={onMonthChange} placeholder="Pick a month" granularity="month" />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {reportMode !== "annually" ? (
            <Combobox
              value={reportMode === "quarterly" ? reportQuarter : reportHalf}
              onChange={reportMode === "quarterly" ? onQuarterChange : onHalfChange}
              options={subdivisionOptions}
              placeholder={reportMode === "quarterly" ? "Choose quarter" : "Choose half"}
              className="min-w-48"
            />
          ) : null}
          <Combobox
            value={reportYear}
            onChange={onYearChange}
            options={yearOptions}
            placeholder="Choose year"
            searchPlaceholder="Search years..."
            className="w-36"
          />
        </div>
      )}
      <Combobox
        value={reportMode}
        onChange={(value) => onModeChange(value as ReportPeriod)}
        options={periodOptions}
        placeholder="Choose period"
        searchPlaceholder="Search periods..."
        className="w-44"
      />
    </div>
  );
}

/** One tall KPI card in the horizontally scrolling strip. */
function KpiCard({
  label,
  value,
  hint,
  detail,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  hint?: string;
  detail?: string;
  icon: typeof Wallet;
  tint: string;
}) {
  return (
    <div
      className={cn(
        "workspace-inner-surface relative flex min-h-40 w-64 shrink-0 snap-start flex-col justify-between p-4",
        tint,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="tint-text text-[0.65rem] font-bold uppercase tracking-[0.14em]">{label}</p>
        <span className="tint-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3">
        <p className="truncate font-display text-2xl font-bold tracking-tight text-white" title={value}>
          {value}
        </p>
        {hint ? <p className="mt-1 truncate text-sm font-semibold text-white/80">{hint}</p> : null}
      </div>
      {detail ? <p className="mt-2 truncate text-xs text-white/55">{detail}</p> : null}
    </div>
  );
}

const EXPIRY_FILTERS: { value: "all" | ExpiryTone; label: string; dot?: string }[] = [
  { value: "all", label: "All" },
  { value: "red", label: "≤ 1 month", dot: EXPIRY_DOT_CLASSES.red },
  { value: "yellow", label: "≤ 3 months", dot: EXPIRY_DOT_CLASSES.yellow },
  { value: "lime", label: "3–5 months", dot: EXPIRY_DOT_CLASSES.lime },
  { value: "green", label: "5+ months", dot: EXPIRY_DOT_CLASSES.green },
];

export function ManagerReportSection({
  medicines,
  purchases,
  suppliers,
  invoices,
  cashouts,
  stockLosses,
  pendingSales,
  ruleCounts,
}: {
  medicines: MedicineData[];
  purchases: PurchaseData[];
  suppliers: SupplierData[];
  invoices: InvoiceData[];
  cashouts: CashoutData[];
  stockLosses: StockLossData[];
  pendingSales: PendingSaleData[];
  ruleCounts: { quantity: number; approval: number; discount: number };
}) {
  const getExpiryLevel = (expiryDate?: string | null) => {
    const tone = expiryTone(daysToExpiry(expiryDate));
    if (tone === "none") return "none" as const;
    if (tone === "expired") return "expired" as const;
    if (tone === "red") return "soon" as const;
    return "ok" as const;
  };
  const getStockLevel = (quantity: number) => {
    if (quantity <= 0) return "out" as const;
    if (quantity <= 5) return "critical" as const;
    if (quantity <= 20) return "low" as const;
    return "ok" as const;
  };

  const [reportMode, setReportMode] = useState<ReportPeriod>("daily");
  const [reportDay, setReportDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportYear, setReportYear] = useState(() => String(new Date().getFullYear()));
  const [reportQuarter, setReportQuarter] = useState(() => String(Math.ceil((new Date().getMonth() + 1) / 3)));
  const [reportHalf, setReportHalf] = useState(() => (new Date().getMonth() < 6 ? "1" : "2"));
  const [expiryFilter, setExpiryFilter] = useState<"all" | ExpiryTone>("all");
  const [nowMs] = useState(() => Date.now());

  const yearOptions = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    for (const item of [...purchases, ...cashouts, ...stockLosses]) {
      const year = new Date(item.created_at).getUTCFullYear();
      if (Number.isFinite(year)) years.add(year);
    }
    return [...years].sort((a, b) => b - a).map((year) => ({ value: String(year), label: String(year) }));
  }, [cashouts, purchases, stockLosses]);

  const inPeriod = (createdAt: string) =>
    matchesReportPeriod(createdAt, reportMode, reportDay, reportMonth, reportYear, reportQuarter, reportHalf);

  const filteredPurchases = useMemo(
    () => purchases.filter((item) => inPeriod(item.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [purchases, reportDay, reportHalf, reportMode, reportMonth, reportQuarter, reportYear],
  );
  const filteredCashouts = useMemo(
    () => cashouts.filter((item) => inPeriod(item.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cashouts, reportDay, reportHalf, reportMode, reportMonth, reportQuarter, reportYear],
  );
  const filteredLosses = useMemo(
    () => stockLosses.filter((item) => inPeriod(item.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stockLosses, reportDay, reportHalf, reportMode, reportMonth, reportQuarter, reportYear],
  );

  const filteredPending = useMemo(
    () => pendingSales.filter((item) => inPeriod(item.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingSales, reportDay, reportHalf, reportMode, reportMonth, reportQuarter, reportYear],
  );

  const overview = useMemo(() => {
    const totalSales = filteredPurchases.reduce((sum, item) => sum + toNumber(item.total_price), 0);
    const totalProfit = filteredPurchases.reduce((sum, item) => sum + toNumber(item.profit), 0);
    const totalUnits = filteredPurchases.reduce((sum, item) => sum + toNumber(item.quantity), 0);
    const totalCashout = filteredCashouts.reduce((sum, item) => sum + toNumber(item.amount), 0);
    return { totalSales, totalProfit, totalUnits, totalCashout, net: totalProfit - totalCashout };
  }, [filteredCashouts, filteredPurchases]);

  // Sales per medicine name in the chosen period, with the stock still on hand.
  const movement = useMemo(() => {
    const sold = new Map<string, { qty: number; revenue: number }>();
    for (const p of filteredPurchases) {
      const key = p.medicine_name;
      const row = sold.get(key) ?? { qty: 0, revenue: 0 };
      row.qty += toNumber(p.quantity);
      row.revenue += toNumber(p.total_price);
      sold.set(key, row);
    }
    const stock = new Map<string, number>();
    for (const m of medicines) stock.set(m.name, (stock.get(m.name) ?? 0) + toNumber(m.quantity));

    const fastList = [...sold.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty);
    const slowList = [...stock.entries()]
      .filter(([, qty]) => qty > 0)
      .map(([name, inStock]) => ({ name, inStock, qty: sold.get(name)?.qty ?? 0 }))
      .sort((a, b) => a.qty - b.qty || b.inStock - a.inStock);
    return { fastList, slowList };
  }, [filteredPurchases, medicines]);

  const fast = movement.fastList[0];
  const slow = movement.slowList[0];

  const expiryRows = useMemo(
    () =>
      medicines
        .filter((m) => toNumber(m.quantity) > 0 && m.expiry_date)
        .map((m) => {
          const days = daysToExpiry(m.expiry_date);
          return { m, days, tone: expiryTone(days), value: stockCostValue(m) };
        })
        .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999)),
    [medicines],
  );
  const expiredRows = expiryRows.filter((r) => r.tone === "expired");
  const liveRows = expiryRows.filter((r) => r.tone !== "expired");
  const nearRows = liveRows.filter((r) => r.tone === "red" || r.tone === "yellow");
  const visibleLive = liveRows.filter((r) => expiryFilter === "all" || r.tone === expiryFilter);

  const sumValue = (rows: { value: number }[]) => rows.reduce((s, r) => s + r.value, 0);
  const nearValue = sumValue(nearRows);
  const expiredValue = sumValue(expiredRows);

  const lossQty = filteredLosses.reduce((s, l) => s + toNumber(l.quantity), 0);
  const lossValue = filteredLosses.reduce((s, l) => s + toNumber(l.value), 0);

  const creditLines = useMemo(
    () =>
      medicines
        .filter((m) => creditDue(m) > 0.01)
        .sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()),
    [medicines],
  );
  const totalCredit = creditLines.reduce((s, m) => s + creditDue(m), 0);
  const creditBySupplier = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of creditLines) map.set(m.supplier_name || "Unknown", (map.get(m.supplier_name || "Unknown") ?? 0) + creditDue(m));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [creditLines]);

  const snapshot = useMemo(() => {
    const units = medicines.reduce((s, m) => s + toNumber(m.quantity), 0);
    const costValue = medicines.reduce((s, m) => s + stockCostValue(m), 0);
    const retailValue = medicines.reduce((s, m) => s + toNumber(m.quantity) * toNumber(m.price), 0);
    const outOfStock = medicines.filter((m) => toNumber(m.quantity) <= 0).length;
    const lowStock = medicines.filter((m) => toNumber(m.quantity) > 0 && toNumber(m.quantity) <= 5).length;
    return { units, costValue, retailValue, margin: retailValue - costValue, outOfStock, lowStock };
  }, [medicines]);

  const unpaidInvoices = invoices.filter((invoice) => invoice.invoice_status === "unpaid");
  const unpaidInvoiceTotal = unpaidInvoices.reduce((s, i) => s + toNumber(i.invoice_amount), 0);
  const topSellers = [...movement.fastList].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="space-y-5">
      <WorkspacePanel>
        <WorkspaceSectionHeader
          title="Analytics command center"
          description="Sales, credit, expiry and loss intelligence for your pharmacy, in one place."
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
            <KpiCard
              label="Total sales"
              value={formatCurrency(overview.totalSales)}
              hint={`${overview.totalUnits} units sold`}
              detail={`${filteredPurchases.length} sale line${filteredPurchases.length === 1 ? "" : "s"} in this period`}
              icon={BadgeDollarSign}
              tint="tint-violet"
            />
            <KpiCard
              label="Total credit amount"
              value={formatCurrency(totalCredit)}
              hint={`${creditLines.length} credit line${creditLines.length === 1 ? "" : "s"}`}
              detail={creditLines[0] ? `Oldest: ${creditLines[0].name}` : "Nothing owed to suppliers"}
              icon={HandCoins}
              tint="tint-rose"
            />
            <KpiCard
              label="Fast moving"
              value={fast ? fast.name : "—"}
              hint={fast ? `${fast.qty} sold` : "No sales yet"}
              detail={fast ? `${formatCurrency(fast.revenue)} revenue` : undefined}
              icon={Rocket}
              tint="tint-emerald"
            />
            <KpiCard
              label="Slow moving"
              value={slow ? slow.name : "—"}
              hint={slow ? `${slow.qty} sold · ${slow.inStock} in stock` : "No stock"}
              detail={slow ? "Lowest sales among stocked items" : undefined}
              icon={Snail}
              tint="tint-amber"
            />
            <KpiCard
              label="Near expire (≤ 3 mo)"
              value={formatCurrency(nearValue)}
              hint={`${nearRows.length} item${nearRows.length === 1 ? "" : "s"} · at cost`}
              detail="Money tied up in stock expiring soon"
              icon={Hourglass}
              tint="tint-orange"
            />
            <KpiCard
              label="Expired"
              value={formatCurrency(expiredValue)}
              hint={`${expiredRows.length} item${expiredRows.length === 1 ? "" : "s"} · at cost`}
              detail="Expired stock still on the shelf"
              icon={TimerOff}
              tint="tint-pink"
            />
            <KpiCard
              label="Damaged / wasted"
              value={formatCurrency(lossValue)}
              hint={`${lossQty} unit${lossQty === 1 ? "" : "s"} · ${filteredLosses.length} record${filteredLosses.length === 1 ? "" : "s"}`}
              detail="Written off in this period"
              icon={PackageX}
              tint="tint-fuchsia"
            />
            <KpiCard
              label="Profit"
              value={formatCurrency(overview.totalProfit)}
              hint={`Net after cashout ${formatCurrency(overview.net)}`}
              detail={`Cashouts ${formatCurrency(overview.totalCashout)}`}
              icon={TrendingUp}
              tint="tint-cyan"
            />
          </div>
        </div>
      </WorkspacePanel>

      <PharmacyHealthOverview purchases={purchases} medicines={medicines} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <WorkspaceStat label="Units in stock" value={snapshot.units.toLocaleString()} icon={Wallet} hint={`${snapshot.outOfStock} out · ${snapshot.lowStock} low`} />
        <WorkspaceStat label="Stock value (cost)" value={formatCurrency(snapshot.costValue)} icon={BadgeDollarSign} />
        <WorkspaceStat label="Stock value (retail)" value={formatCurrency(snapshot.retailValue)} icon={TrendingUp} hint={`Potential margin ${formatCurrency(snapshot.margin)}`} />
        <WorkspaceStat label="Unpaid invoices" value={formatCurrency(unpaidInvoiceTotal)} icon={AlertTriangle} hint={`${unpaidInvoices.length} invoice${unpaidInvoices.length === 1 ? "" : "s"}`} />
      </div>

      <ReportRuleImpact purchases={filteredPurchases} pendingSales={filteredPending} ruleCounts={ruleCounts} />

      {/* Expiry watch */}
      <WorkspacePanel className="space-y-5 p-5 sm:p-6">
        <SectionTitle
          icon={CalendarClock}
          tint="amber"
          title="Expiry watch"
          subtitle="Stock on hand by how soon it expires, closest first"
          right={
            <div className="flex flex-wrap gap-2">
              {EXPIRY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setExpiryFilter(f.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition",
                    expiryFilter === f.value
                      ? "border-fuchsia-300/80 bg-fuchsia-400/30 text-white"
                      : "border-white/15 bg-white/5 text-white/65 hover:border-fuchsia-300/50 hover:text-white",
                  )}
                >
                  {f.dot ? <span className={cn("size-2 rounded-full", f.dot)} /> : null}
                  {f.label}
                </button>
              ))}
            </div>
          }
        />
        {visibleLive.length ? (
          <div className="max-h-96 overflow-auto rounded-2xl border border-violet-300/25">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  {["Medicine", "Batch", "Expiry", "Time left", "In stock", "Value at cost"].map((h) => (
                    <TableHead key={h} className={tableHeadClass}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLive.map(({ m, days, tone, value }) => (
                  <TableRow key={m.id} className="border-white/8">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className={cn("size-2.5 shrink-0 rounded-full", EXPIRY_DOT_CLASSES[tone])} />
                        <div>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-xs text-white/50">{m.supplier_name || "No supplier"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/75">{m.batch_number || "—"}</TableCell>
                    <TableCell className="text-white/85">{m.expiry_date ? format(parseISO(m.expiry_date), "PPP") : "—"}</TableCell>
                    <TableCell>
                      <Chip className={EXPIRY_TONE_CLASSES[tone]}>{expiryLabel(days)}</Chip>
                    </TableCell>
                    <TableCell className="tabular-nums text-white/85">{toNumber(m.quantity)} units</TableCell>
                    <TableCell className="font-semibold tabular-nums text-white">{formatCurrency(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={CalendarClock} tint="emerald" title="Nothing in this range" description="No stocked items match this expiry window." />
        )}
      </WorkspacePanel>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Expired */}
        <WorkspacePanel className="space-y-5 p-5 sm:p-6">
          <SectionTitle
            icon={TimerOff}
            tint="pink"
            title="Expired items"
            subtitle={`${expiredRows.length} item${expiredRows.length === 1 ? "" : "s"} · ${formatCurrency(expiredValue)} at cost`}
          />
          {expiredRows.length ? (
            <div className="max-h-96 space-y-2 overflow-auto pr-1">
              {expiredRows.map(({ m, days, value }) => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-red-300/30 bg-red-400/8 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{m.name}</p>
                    <p className="mt-0.5 text-xs text-white/60">
                      Batch {m.batch_number || "—"} · expired {m.expiry_date ? format(parseISO(m.expiry_date), "PP") : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">{m.supplier_name || "No supplier"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Chip className={EXPIRY_TONE_CLASSES.expired}>{expiryLabel(days)}</Chip>
                    <p className="mt-1 text-xs tabular-nums text-white/70">{toNumber(m.quantity)} units</p>
                    <p className="text-sm font-bold tabular-nums text-red-100">{formatCurrency(value)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={TimerOff} tint="emerald" title="No expired stock" description="Everything on the shelf is still in date." />
          )}
        </WorkspacePanel>

        {/* Damaged / wasted */}
        <WorkspacePanel className="space-y-5 p-5 sm:p-6">
          <SectionTitle
            icon={PackageX}
            tint="fuchsia"
            title="Damaged / wasted"
            subtitle={`${filteredLosses.length} record${filteredLosses.length === 1 ? "" : "s"} · ${lossQty} units · ${formatCurrency(lossValue)}`}
          />
          {filteredLosses.length ? (
            <div className="max-h-96 space-y-2 overflow-auto pr-1">
              {filteredLosses.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-400/8 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{l.medicine_name}</p>
                    <p className="mt-0.5 text-xs text-white/60">
                      Batch {l.batch_number || "—"} · {format(new Date(l.created_at), "PP p")}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/50">
                      {l.note ? `“${l.note}”` : "No note"}
                      {l.recorded_by ? ` · by ${l.recorded_by}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Chip className="border-fuchsia-300/50 bg-fuchsia-400/20 text-fuchsia-100">{l.quantity} units</Chip>
                    <p className="mt-1 text-sm font-bold tabular-nums text-fuchsia-100">{formatCurrency(toNumber(l.value))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={PackageX} tint="fuchsia" title="No damaged or wasted stock" description="Nothing was written off in this period." />
          )}
        </WorkspacePanel>
      </div>

      {/* Credit ledger */}
      <WorkspacePanel className="space-y-5 p-5 sm:p-6">
        <SectionTitle
          icon={HandCoins}
          tint="cyan"
          title="Credit ledger — pay the oldest first"
          subtitle={`${creditLines.length} line${creditLines.length === 1 ? "" : "s"} on credit · ${formatCurrency(totalCredit)} outstanding`}
        />
        {creditLines.length ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="overflow-auto rounded-2xl border border-violet-300/25">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    {["Priority", "Medicine", "Supplier", "Age", "Paid", "Due"].map((h) => (
                      <TableHead key={h} className={tableHeadClass}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditLines.map((m, index) => {
                    const total = totalCost(m);
                    const paid = paidAmount(m);
                    const age = m.created_at ? Math.max(0, Math.round((nowMs - new Date(m.created_at).getTime()) / 86_400_000)) : 0;
                    return (
                      <TableRow key={m.id} className="border-white/8">
                        <TableCell>
                          {index === 0 ? (
                            <Chip className="border-rose-300/60 bg-rose-400/25 text-rose-50">
                              <Flame className="size-3" />
                              Pay first
                            </Chip>
                          ) : (
                            <Chip className="border-white/25 bg-white/8 text-white/80">#{index + 1}</Chip>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-xs text-white/50">Batch {m.batch_number || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <InitialsAvatar name={m.supplier_name || "?"} className="size-8 rounded-xl text-[11px]" />
                            <span className="text-white/85">{m.supplier_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-white/80">{age}d old</TableCell>
                        <TableCell>
                          <div className="w-44 space-y-1">
                            <p className="whitespace-nowrap text-xs tabular-nums text-white/70">
                              {formatCurrency(paid)} / {formatCurrency(total)}
                            </p>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22d3ee)]"
                                style={{ width: `${total ? Math.min(100, (paid / total) * 100) : 0}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold tabular-nums text-rose-200">{formatCurrency(creditDue(m))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-cyan-200">Owed per supplier</p>
              {creditBySupplier.map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/25 bg-cyan-400/8 px-3 py-2">
                  <span className="truncate text-sm font-semibold text-white/90">{name}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-cyan-100">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={HandCoins} tint="emerald" title="No credit outstanding" description="Every stock line is fully paid." />
        )}
      </WorkspacePanel>

      {/* Sales intelligence */}
      <WorkspacePanel className="space-y-5 p-5 sm:p-6">
        <SectionTitle
          icon={Trophy}
          tint="violet"
          title="Sales intelligence"
          subtitle="Revenue trend, stock health and best sellers for the selected period"
        />
        <ManagerAnalyticsCharts
          purchases={filteredPurchases}
          medicines={medicines}
          getStockLevel={getStockLevel}
          getExpiryLevel={getExpiryLevel}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-violet-300/25 bg-violet-400/5 p-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-200">Top sellers by revenue</p>
            {topSellers.length ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSellers.map((t) => ({ name: t.name, revenue: t.revenue, qty: t.qty }))} margin={{ top: 18, right: 8, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="topSellerBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 11 }} tickLine={false} axisLine={false} interval={0} tickFormatter={(v: string) => (v.length > 11 ? `${v.slice(0, 10)}…` : v)} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} tickLine={false} axisLine={false} width={46} tickFormatter={(v) => (Math.abs(Number(v)) >= 1000 ? `${Math.round(Number(v) / 100) / 10}k` : `${v}`)} />
                    <Tooltip
                      cursor={{ fill: "rgba(168,85,247,0.12)" }}
                      contentStyle={{ background: "#0d0b2b", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 12 }}
                      formatter={(value, _name, item) => [`${formatCurrency(Number(value))} · ${(item?.payload as { qty: number }).qty} units`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="url(#topSellerBar)" radius={[10, 10, 0, 0]} maxBarSize={56}>
                      <LabelList dataKey="revenue" position="top" fill="#f5d0fe" fontSize={10} formatter={(v) => formatCurrency(Number(v))} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/55">No sales in this period.</p>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-amber-300/25 bg-amber-400/5 p-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-amber-200">Slowest movers still in stock</p>
            {movement.slowList.length ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={movement.slowList.slice(0, 5).map((m) => ({ name: m.name, sold: m.qty, inStock: m.inStock }))} margin={{ top: 18, right: 8, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="slowSoldBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="slowStockBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 11 }} tickLine={false} axisLine={false} interval={0} tickFormatter={(v: string) => (v.length > 11 ? `${v.slice(0, 10)}…` : v)} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(251,191,36,0.1)" }}
                      contentStyle={{ background: "#0d0b2b", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sold" name="Sold" fill="url(#slowSoldBar)" radius={[8, 8, 0, 0]} maxBarSize={30}>
                      <LabelList dataKey="sold" position="top" fill="#fde68a" fontSize={10} />
                    </Bar>
                    <Bar dataKey="inStock" name="In stock" fill="url(#slowStockBar)" radius={[8, 8, 0, 0]} maxBarSize={30}>
                      <LabelList dataKey="inStock" position="top" fill="#a7f3d0" fontSize={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/55">No stocked items.</p>
            )}
          </div>
        </div>
        <div>
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-200">Sales ledger</p>
          <ReportDataTable columns={purchaseColumns} data={filteredPurchases} searchColumnId="medicine_name" />
        </div>
      </WorkspacePanel>

      <p className="px-1 text-xs text-white/40">
        {suppliers.length} suppliers · {medicines.length} stock lines tracked. Credit and expiry figures reflect current stock;
        sales, profit and write-offs follow the selected period.
      </p>
    </div>
  );
}
