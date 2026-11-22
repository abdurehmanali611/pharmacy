"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { BadgePercent, ClipboardCheck, Scale, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Chip, EmptyState, InitialsAvatar, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import { WorkspacePanel } from "@/components/manager/workspace";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PendingSaleData, PurchaseData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { toNumber } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { soldPacks, trimNumber } from "@/lib/packSelling";

const TRIGGER_LABEL: Record<string, { label: string; tone: string }> = {
  quantity_band: { label: "Quantity band", tone: "border-cyan-300/45 bg-cyan-400/15 text-cyan-100" },
  needs_approval: { label: "Needs approval", tone: "border-amber-300/45 bg-amber-400/15 text-amber-100" },
  attachment: { label: "Manager attachment", tone: "border-violet-300/45 bg-violet-400/15 text-violet-100" },
};

const isDiscounted = (p: PurchaseData) => toNumber(p.discount_percent) > 0;
const isAttachment = (p: PurchaseData) => p.rule_trigger === "attachment";
const isRule = (p: PurchaseData) => !!p.rule_trigger && p.rule_trigger !== "none" && !isAttachment(p);
const discountGiven = (p: PurchaseData) =>
  isDiscounted(p) ? Math.max(0, toNumber(p.list_price) - toNumber(p.price)) * toNumber(p.quantity) : 0;
const priceAdjustment = (p: PurchaseData) =>
  !isDiscounted(p) && p.list_price != null ? (toNumber(p.list_price) - toNumber(p.price)) * toNumber(p.quantity) : 0;

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function ReportRuleImpact({
  purchases,
  pendingSales,
  ruleCounts,
}: {
  /** Sales already filtered to the selected report period. */
  purchases: PurchaseData[];
  /** Held sales already filtered to the selected report period. */
  pendingSales: PendingSaleData[];
  ruleCounts: { quantity: number; approval: number; discount: number };
}) {
  const stats = useMemo(() => {
    const total = purchases.reduce((s, p) => s + toNumber(p.total_price), 0);
    const units = purchases.reduce((s, p) => s + soldPacks(p), 0);

    let regular = 0;
    let discountOnly = 0;
    let ruleOnly = 0;
    let both = 0;
    let attachment = 0;
    let attachmentUnits = 0;
    let discountValue = 0;
    let adjustment = 0;
    let discountUnits = 0;
    let ruleUnits = 0;
    const percents: number[] = [];

    for (const p of purchases) {
      const revenue = toNumber(p.total_price);
      const d = isDiscounted(p);
      const r = isRule(p);
      if (isAttachment(p)) {
        attachment += revenue;
        attachmentUnits += soldPacks(p);
      } else if (d && r) both += revenue;
      else if (d) discountOnly += revenue;
      else if (r) ruleOnly += revenue;
      else regular += revenue;
      if (d) {
        discountValue += discountGiven(p);
        discountUnits += soldPacks(p);
        percents.push(toNumber(p.discount_percent));
      }
      if (r) {
        ruleUnits += soldPacks(p);
        adjustment += priceAdjustment(p);
      }
    }

    const discountedRevenue = discountOnly + both;
    const ruleRevenue = ruleOnly + both;
    const avgPercent = percents.length ? percents.reduce((a, b) => a + b, 0) / percents.length : 0;

    const byCustomer = new Map<string, { lines: number; revenue: number; given: number }>();
    for (const p of purchases.filter(isDiscounted)) {
      const key = p.customer_name || "Unnamed customer";
      const row = byCustomer.get(key) ?? { lines: 0, revenue: 0, given: 0 };
      row.lines += 1;
      row.revenue += toNumber(p.total_price);
      row.given += discountGiven(p);
      byCustomer.set(key, row);
    }
    const customers = [...byCustomer.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.given - a.given);

    return {
      total, units, regular, discountOnly, ruleOnly, both, attachment, attachmentUnits,
      discountedRevenue, ruleRevenue, discountValue, adjustment, discountUnits, ruleUnits, avgPercent, customers,
      discountLines: purchases.filter(isDiscounted).length,
      ruleLines: purchases.filter(isRule).length,
      attachmentLines: purchases.filter(isAttachment).length,
    };
  }, [purchases]);

  const queue = useMemo(() => {
    const count = (status: PendingSaleData["status"]) => pendingSales.filter((s) => s.status === status).length;
    return {
      awaitingManager: count("awaiting_manager"),
      awaitingPharmacist: count("awaiting_pharmacist"),
      settled: count("settled"),
      rejected: count("rejected"),
      failed: count("failed"),
      total: pendingSales.length,
    };
  }, [pendingSales]);

  const affected = useMemo(
    () => purchases.filter((p) => isDiscounted(p) || isRule(p) || isAttachment(p)).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [purchases],
  );

  const segments = [
    { label: "Regular sales", value: stats.regular, bar: "bg-slate-300", dot: "bg-slate-300" },
    { label: "Discounted", value: stats.discountOnly, bar: "bg-[linear-gradient(90deg,#d946ef,#f472b6)]", dot: "bg-fuchsia-400" },
    { label: "Rule-approved", value: stats.ruleOnly, bar: "bg-[linear-gradient(90deg,#22d3ee,#38bdf8)]", dot: "bg-cyan-400" },
    { label: "Discounted + rule", value: stats.both, bar: "bg-[linear-gradient(90deg,#fbbf24,#fb923c)]", dot: "bg-amber-400" },
    { label: "Manager attachments", value: stats.attachment, bar: "bg-[linear-gradient(90deg,#8b5cf6,#6366f1)]", dot: "bg-violet-400" },
  ];

  return (
    <WorkspacePanel className="space-y-5 p-5 sm:p-6">
      <SectionTitle
        icon={Scale}
        tint="fuchsia"
        title="Sales rules & discounts vs overall sales"
        subtitle="How bands, approvals and discounts shaped sales this period"
        right={
          <div className="flex flex-wrap gap-2">
            <Chip className="border-cyan-300/40 bg-cyan-400/12 text-cyan-100">{ruleCounts.quantity} quantity bands</Chip>
            <Chip className="border-amber-300/40 bg-amber-400/12 text-amber-100">{ruleCounts.approval} approval items</Chip>
            <Chip className="border-fuchsia-300/40 bg-fuchsia-400/12 text-fuchsia-100">{ruleCounts.discount} discount rules</Chip>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="workspace-inner-surface tint-violet p-4">
          <p className="tint-text text-[0.65rem] font-bold uppercase tracking-[0.14em]">Overall sales</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{formatCurrency(stats.total)}</p>
          <p className="mt-1 text-sm text-white/70">{trimNumber(stats.units)} units · {purchases.length} sale line{purchases.length === 1 ? "" : "s"}</p>
        </div>
        <div className="workspace-inner-surface tint-fuchsia p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="tint-text text-[0.65rem] font-bold uppercase tracking-[0.14em]">Discounted sales</p>
            <Chip className="border-fuchsia-300/45 bg-fuchsia-400/15 text-fuchsia-100">{pct(stats.discountedRevenue, stats.total)}% of sales</Chip>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">{formatCurrency(stats.discountedRevenue)}</p>
          <p className="mt-1 text-sm text-white/70">
            {stats.discountLines} line{stats.discountLines === 1 ? "" : "s"} · avg {stats.avgPercent.toFixed(1)}% off
          </p>
          <p className="mt-1 text-sm font-bold text-fuchsia-100">{formatCurrency(stats.discountValue)} given away</p>
        </div>
        <div className="workspace-inner-surface tint-violet p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="tint-text text-[0.65rem] font-bold uppercase tracking-[0.14em]">Attachment sales</p>
            <Chip className="border-violet-300/45 bg-violet-400/15 text-violet-100">{pct(stats.attachment, stats.total)}% of sales</Chip>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">{formatCurrency(stats.attachment)}</p>
          <p className="mt-1 text-sm text-white/70">
            {stats.attachmentLines} line{stats.attachmentLines === 1 ? "" : "s"} · {stats.attachmentUnits} units
          </p>
          <p className="mt-1 text-sm font-bold text-violet-100">Items you added to held sales</p>
        </div>
        <div className="workspace-inner-surface tint-cyan p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="tint-text text-[0.65rem] font-bold uppercase tracking-[0.14em]">Rule-approved sales</p>
            <Chip className="border-cyan-300/45 bg-cyan-400/15 text-cyan-100">{pct(stats.ruleRevenue, stats.total)}% of sales</Chip>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-white">{formatCurrency(stats.ruleRevenue)}</p>
          <p className="mt-1 text-sm text-white/70">
            {stats.ruleLines} line{stats.ruleLines === 1 ? "" : "s"} · {stats.ruleUnits} units held then approved
          </p>
          <p className={cn("mt-1 text-sm font-bold", stats.adjustment > 0 ? "text-amber-100" : "text-cyan-100")}>
            {stats.adjustment > 0
              ? `${formatCurrency(stats.adjustment)} price cut by manager`
              : stats.adjustment < 0
                ? `${formatCurrency(Math.abs(stats.adjustment))} price raised by manager`
                : "No manager price changes"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-200">Where the revenue came from</p>
        <div className="flex h-4 overflow-hidden rounded-full bg-white/10">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={cn("h-full transition-[width]", seg.bar)}
              style={{ width: `${stats.total ? (seg.value / stats.total) * 100 : 0}%` }}
              title={`${seg.label}: ${formatCurrency(seg.value)}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 px-3 py-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", seg.dot)} />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/75">{seg.label}</p>
                <p className="text-sm font-bold tabular-nums text-white">
                  {formatCurrency(seg.value)} <span className="text-xs font-semibold text-white/50">· {pct(seg.value, stats.total)}%</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-fuchsia-200">
            <Users className="size-3.5" /> Customers who received discounts
          </p>
          {stats.customers.length ? (
            stats.customers.slice(0, 6).map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-3 rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/6 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <InitialsAvatar name={c.name} className="size-9 rounded-xl text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{c.name}</p>
                    <p className="text-xs text-white/55">{c.lines} line{c.lines === 1 ? "" : "s"} · {formatCurrency(c.revenue)} bought</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-fuchsia-100">−{formatCurrency(c.given)}</span>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/55">No discounted sales in this period.</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-cyan-200">
            <ClipboardCheck className="size-3.5" /> Held sales in this period
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ["Awaiting you", queue.awaitingManager, "border-amber-300/40 bg-amber-400/10 text-amber-100"],
              ["Awaiting pharmacist", queue.awaitingPharmacist, "border-sky-300/40 bg-sky-400/10 text-sky-100"],
              ["Settled", queue.settled, "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"],
              ["Rejected", queue.rejected, "border-rose-300/40 bg-rose-400/10 text-rose-100"],
              ["Cancelled", queue.failed, "border-white/20 bg-white/6 text-white/75"],
              ["All held", queue.total, "border-violet-300/40 bg-violet-400/10 text-violet-100"],
            ].map(([label, value, cls]) => (
              <div key={label as string} className={cn("rounded-xl border px-3 py-2.5", cls as string)}>
                <p className="text-[0.62rem] font-bold uppercase tracking-wider opacity-80">{label}</p>
                <p className="font-display text-xl font-bold tabular-nums">{value as number}</p>
              </div>
            ))}
          </div>
          <p className="flex items-center gap-2 text-xs text-white/55">
            <ShieldCheck className="size-3.5 text-emerald-300" />
            {pct(queue.settled, queue.total)}% of held sales were approved and completed.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-violet-200">
          <BadgePercent className="size-3.5" /> Rule & discount sales ledger
        </p>
        {affected.length ? (
          <div className="max-h-96 overflow-auto rounded-2xl border border-violet-300/25">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  {["Date", "Medicine", "Customer", "Rule", "Qty", "List price", "Sold at", "Discount", "Revenue"].map((h) => (
                    <TableHead key={h} className={tableHeadClass}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {affected.map((p) => {
                  const trigger = p.rule_trigger ? TRIGGER_LABEL[p.rule_trigger] : undefined;
                  return (
                    <TableRow key={p.id} className="border-white/8">
                      <TableCell className="whitespace-nowrap text-white/75">{format(new Date(p.created_at), "PP p")}</TableCell>
                      <TableCell className="font-bold text-white">{p.medicine_name}</TableCell>
                      <TableCell className="text-white/80">{p.customer_name || "—"}</TableCell>
                      <TableCell>
                        {trigger ? <Chip className={trigger.tone}>{trigger.label}</Chip> : <span className="text-white/45">—</span>}
                      </TableCell>
                      <TableCell className="tabular-nums text-white/85">{p.quantity}{p.sale_unit === "loose" && p.unit_name ? <span className="ml-1 text-xs text-fuchsia-200/80">{p.unit_name}</span> : null}</TableCell>
                      <TableCell className="tabular-nums text-white/60 line-through decoration-white/30">
                        {p.list_price != null ? formatCurrency(toNumber(p.list_price)) : "—"}
                      </TableCell>
                      <TableCell className="tabular-nums text-white/90">{formatCurrency(toNumber(p.price))}</TableCell>
                      <TableCell>
                        {isDiscounted(p) ? (
                          <Chip className="border-fuchsia-300/45 bg-fuchsia-400/15 text-fuchsia-100">
                            <Sparkles className="size-3" />
                            {toNumber(p.discount_percent)}% off
                          </Chip>
                        ) : (
                          <span className="text-white/45">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold tabular-nums text-white">{formatCurrency(toNumber(p.total_price))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={Scale}
            tint="fuchsia"
            title="No rule or discount sales in this period"
            description="Held or discounted sales will appear here."
          />
        )}
      </div>
    </WorkspacePanel>
  );
}
