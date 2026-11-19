"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BadgeCheck,
  Banknote,
  ChevronRight,
  CreditCard,
  ExternalLink,
  HandCoins,
  Layers,
  PackageCheck,
  PackageX,
  Pill,
  ShoppingCart,
  Wallet,
} from "lucide-react";

import { Chip, EmptyState, InitialsAvatar, ListToolbar, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import { WorkspacePanel } from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MedicineData, PurchaseData, StockLossData, SupplierData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import {
  buildMovement,
  creditDue,
  daysToExpiry,
  EXPIRY_TONE_CLASSES,
  expiryLabel,
  expiryTone,
  paidAmount,
  paymentBucket,
  toNumber,
  totalCost,
  type MovementRow,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";

export type InventoryMode = "all" | "credit" | "paid";

const PAGE_SIZE = 6;

const MODE_COPY: Record<InventoryMode, { title: string; subtitle: string; tint: "violet" | "pink" | "emerald"; icon: typeof Wallet }> = {
  all: {
    title: "All inventory lines",
    subtitle: "Every stock line with what was bought, sold and what is still on the shelf",
    tint: "violet",
    icon: Layers,
  },
  credit: {
    title: "Credit items",
    subtitle: "Lines bought on credit, oldest first, so you know what to pay next",
    tint: "pink",
    icon: HandCoins,
  },
  paid: {
    title: "Fully paid items",
    subtitle: "Lines that have been paid for in full",
    tint: "emerald",
    icon: BadgeCheck,
  },
};

type Row = MovementRow & {
  total: number;
  paid: number;
  due: number;
  bucket: "paid" | "credit";
  days: number | null;
};

/** Sold / lost / in-stock split of everything that was received. */
function QuantityBar({ row, className }: { row: Pick<Row, "received" | "sold" | "lost" | "inStock">; className?: string }) {
  const base = Math.max(row.received, row.sold + row.lost + row.inStock, 1);
  const pct = (n: number) => `${Math.min(100, (n / base) * 100)}%`;
  return (
    <div className={cn("flex h-2 overflow-hidden rounded-full bg-white/10", className)} title={`${row.sold} sold · ${row.lost} lost · ${row.inStock} in stock`}>
      <div className="h-full bg-[linear-gradient(90deg,#a855f7,#f472b6)]" style={{ width: pct(row.sold) }} />
      <div className="h-full bg-amber-400" style={{ width: pct(row.lost) }} />
      <div className="h-full bg-[linear-gradient(90deg,#34d399,#22d3ee)]" style={{ width: pct(row.inStock) }} />
    </div>
  );
}

function PaymentChip({ row }: { row: Row }) {
  return row.bucket === "credit" ? (
    <div className="space-y-1">
      <Chip className="border-rose-300/45 bg-rose-400/15 text-rose-200">
        <Wallet className="size-3" />
        On credit
      </Chip>
      <p className="text-xs font-semibold tabular-nums text-rose-200">{formatCurrency(row.due)} due</p>
    </div>
  ) : (
    <Chip className="border-emerald-300/45 bg-emerald-400/15 text-emerald-200">
      <BadgeCheck className="size-3" />
      Fully paid
    </Chip>
  );
}

function LineDetail({
  row,
  purchases,
  losses,
  supplier,
  children,
}: {
  row: Row;
  purchases: PurchaseData[];
  losses: StockLossData[];
  supplier?: SupplierData;
  children: React.ReactNode;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleOpen = () => {
    if (sheetOpen) return;
    clearTimers();
    openTimer.current = setTimeout(() => setPreviewOpen(true), 200);
  };
  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setPreviewOpen(false), 180);
  };
  const openSheet = () => {
    clearTimers();
    setPreviewOpen(false);
    setSheetOpen(true);
  };

  const m = row.medicine;
  const tone = expiryTone(row.days);
  const myPurchases = purchases.filter((p) => String(p.medicine_id) === String(m.id));
  const myLosses = losses.filter((l) => String(l.medicine_id) === String(m.id));
  const revenue = myPurchases.reduce((s, p) => s + toNumber(p.total_price), 0);
  const profit = myPurchases.reduce((s, p) => s + toNumber(p.profit), 0);
  const margin = toNumber(m.price) - toNumber(m.cost);

  return (
    <>
      <Popover open={previewOpen && !sheetOpen} onOpenChange={(next) => !next && setPreviewOpen(false)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="group/trigger -mx-2 flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-fuchsia-300/50 hover:bg-fuchsia-400/12"
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
            onFocus={scheduleOpen}
            onBlur={scheduleClose}
            onClick={(e) => {
              e.stopPropagation();
              openSheet();
            }}
          >
            {children}
            <ChevronRight className="ml-auto size-4 shrink-0 text-fuchsia-200 opacity-0 transition group-hover/trigger:translate-x-0.5 group-hover/trigger:opacity-100" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-[min(22rem,calc(100vw-2rem))] p-5 text-white"
          onMouseEnter={scheduleOpen}
          onMouseLeave={scheduleClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{m.name}</p>
                <p className="mt-0.5 text-xs text-white/60">Batch {m.batch_number || "—"} · {m.supplier_name || "No supplier"}</p>
              </div>
              <PaymentChip row={row} />
            </div>
            <QuantityBar row={row} />
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Received", row.received, "text-white"],
                ["Sold", row.sold, "text-fuchsia-200"],
                ["Lost", row.lost, "text-amber-200"],
                ["In stock", row.inStock, "text-emerald-200"],
              ].map(([label, value, cls]) => (
                <div key={label as string} className="rounded-lg border border-white/10 bg-white/5 px-1 py-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">{label}</p>
                  <p className={cn("text-sm font-bold tabular-nums", cls as string)}>{value as number}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Paid {formatCurrency(row.paid)} of {formatCurrency(row.total)}</span>
              {m.expiry_date ? <Chip className={EXPIRY_TONE_CLASSES[tone]}>{expiryLabel(row.days)}</Chip> : null}
            </div>
            <Button type="button" size="sm" variant="secondary" className="w-full gap-1.5" onClick={openSheet}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open full detail
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-[min(100%,36rem)] flex-col gap-0 border-l border-violet-300/30 bg-[#0b0929] p-0 text-white shadow-2xl sm:max-w-2xl"
        >
          <SheetHeader className="shrink-0 space-y-1.5 border-b border-white/10 px-6 py-5 pr-14 text-left">
            <div className="flex items-center gap-3">
              <InitialsAvatar name={m.name} />
              <div className="min-w-0">
                <SheetTitle className="truncate font-display text-lg font-bold text-white">{m.name}</SheetTitle>
                <SheetDescription className="text-xs text-white/60">
                  Batch {m.batch_number || "—"} · {m.category || "General"} · added{" "}
                  {m.created_at ? format(parseISO(m.created_at), "PP") : "—"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {/* payment */}
            <div className="rounded-2xl border border-rose-300/25 bg-rose-400/6 p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-rose-200">
                  <CreditCard className="size-4" /> Payment
                </p>
                <PaymentChip row={row} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Total cost", formatCurrency(row.total), "text-white"],
                  ["Paid", formatCurrency(row.paid), "text-emerald-200"],
                  ["Due", formatCurrency(row.due), row.due > 0 ? "text-rose-200" : "text-white/60"],
                ].map(([label, value, cls]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
                    <p className={cn("mt-0.5 text-sm font-bold tabular-nums", cls)}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22d3ee)]"
                  style={{ width: `${row.total ? Math.min(100, (row.paid / row.total) * 100) : 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/55">
                {row.received} units received × {formatCurrency(toNumber(m.cost))} cost
              </p>
            </div>

            {/* quantity movement */}
            <div className="rounded-2xl border border-violet-300/25 bg-violet-400/6 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-200">
                <PackageCheck className="size-4" /> Quantity movement
              </p>
              <QuantityBar row={row} className="mt-3 h-3" />
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  ["Received", row.received, "text-white"],
                  ["Sold", row.sold, "text-fuchsia-200"],
                  ["Lost", row.lost, "text-amber-200"],
                  ["In stock", row.inStock, "text-emerald-200"],
                ].map(([label, value, cls]) => (
                  <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
                    <p className={cn("mt-0.5 text-base font-bold tabular-nums", cls as string)}>{value as number}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/60">
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-fuchsia-400" /> Sold</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> Damaged / wasted</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-400" /> In stock</span>
              </div>
            </div>

            {/* pricing + expiry */}
            <div className="grid gap-3">
              <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/6 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">
                  <Banknote className="size-4" /> Pricing
                </p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-white/60">Sale price</dt><dd className="font-bold tabular-nums">{formatCurrency(toNumber(m.price))}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/60">Cost</dt><dd className="tabular-nums">{formatCurrency(toNumber(m.cost))}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/60">Margin / unit</dt><dd className="font-bold tabular-nums text-emerald-200">{formatCurrency(margin)}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/60">Revenue so far</dt><dd className="tabular-nums">{formatCurrency(revenue)}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/60">Profit so far</dt><dd className="tabular-nums">{formatCurrency(profit)}</dd></div>
                </dl>
              </div>
              <div className="rounded-2xl border border-amber-300/25 bg-amber-400/6 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">
                  <Pill className="size-4" /> Supplier & expiry
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-bold">{m.supplier_name || "No supplier"}</p>
                  <p className="text-xs text-white/60">{supplier?.supplier_phone || m.supplier_phone || "No phone"}</p>
                  <p className="text-xs text-white/60">{supplier?.supplier_email || m.supplier_email || "No email"}</p>
                  <div className="pt-1">
                    {m.expiry_date ? (
                      <Chip className={EXPIRY_TONE_CLASSES[tone]}>
                        {format(parseISO(m.expiry_date), "PP")} · {expiryLabel(row.days)}
                      </Chip>
                    ) : (
                      <span className="text-xs text-white/50">No expiry date</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* sales history */}
            <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/6 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-200">
                <ShoppingCart className="size-4" /> Sales history ({myPurchases.length})
              </p>
              {myPurchases.length ? (
                <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {myPurchases.slice(0, 20).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                      <span className="text-white/70">{format(new Date(p.created_at), "PP p")}</span>
                      <span className="tabular-nums text-white/85">{p.quantity} × {formatCurrency(toNumber(p.price))}</span>
                      <span className="font-bold tabular-nums text-fuchsia-100">{formatCurrency(toNumber(p.total_price))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-white/55">Nothing sold from this line yet.</p>
              )}
            </div>

            {/* losses */}
            <div className="rounded-2xl border border-amber-300/25 bg-amber-400/6 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">
                <PackageX className="size-4" /> Damaged / wasted ({myLosses.length})
              </p>
              {myLosses.length ? (
                <div className="mt-2 space-y-1.5">
                  {myLosses.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
                      <span className="text-white/70">{format(new Date(l.created_at), "PP")}</span>
                      <span className="min-w-0 flex-1 truncate text-white/60">{l.note || "No note"}</span>
                      <span className="font-bold tabular-nums text-amber-100">{l.quantity} units · {formatCurrency(toNumber(l.value))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-white/55">No write-offs for this line.</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function InventoryPaymentSection({
  mode,
  medicines,
  purchases,
  stockLosses,
  suppliers,
}: {
  mode: InventoryMode;
  medicines: MedicineData[];
  purchases: PurchaseData[];
  stockLosses: StockLossData[];
  suppliers: SupplierData[];
}) {
  const copy = MODE_COPY[mode];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const rows = useMemo<Row[]>(
    () =>
      buildMovement(medicines, purchases, stockLosses).map((r) => ({
        ...r,
        total: totalCost(r.medicine),
        paid: paidAmount(r.medicine),
        due: creditDue(r.medicine),
        bucket: paymentBucket(r.medicine),
        days: daysToExpiry(r.medicine.expiry_date),
      })),
    [medicines, purchases, stockLosses],
  );

  // The submenu decides the base set; the toolbar filters narrow it further.
  const baseRows = useMemo(() => {
    const scoped =
      mode === "credit" ? rows.filter((r) => r.bucket === "credit") : mode === "paid" ? rows.filter((r) => r.bucket === "paid") : rows;
    // Credit items: oldest first, because that is the one to pay first.
    return mode === "credit"
      ? [...scoped].sort((a, b) => new Date(a.medicine.created_at ?? 0).getTime() - new Date(b.medicine.created_at ?? 0).getTime())
      : scoped;
  }, [mode, rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseRows.filter((r) => {
      const m = r.medicine;
      if (supplierFilter !== "all" && m.supplier_name !== supplierFilter) return false;
      if (stockFilter === "in_stock" && r.inStock <= 0) return false;
      if (stockFilter === "sold_out" && r.inStock > 0) return false;
      if (stockFilter === "sold" && r.sold <= 0) return false;
      if (stockFilter === "unsold" && r.sold > 0) return false;
      if (mode === "all" && paymentFilter !== "all" && r.bucket !== paymentFilter) return false;
      if (expiryFilter !== "all") {
        const tone = expiryTone(r.days);
        if (expiryFilter === "expiring" ? !(tone === "red" || tone === "yellow") : tone !== expiryFilter) return false;
      }
      if (!q) return true;
      return [m.name, m.batch_number, m.supplier_name, m.category].filter(Boolean).some((f) => String(f).toLowerCase().includes(q));
    });
  }, [baseRows, expiryFilter, mode, paymentFilter, search, stockFilter, supplierFilter]);

  const { items: pageRows, safePage, totalCount } = paginateItems(filtered, page, PAGE_SIZE);
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const totals = useMemo(() => {
    const sum = (pick: (r: Row) => number) => filtered.reduce((s, r) => s + pick(r), 0);
    return {
      received: sum((r) => r.received),
      sold: sum((r) => r.sold),
      lost: sum((r) => r.lost),
      inStock: sum((r) => r.inStock),
      total: sum((r) => r.total),
      paid: sum((r) => r.paid),
      due: sum((r) => r.due),
    };
  }, [filtered]);

  const supplierOptions = useMemo(
    () => [
      { value: "all", label: "All suppliers" },
      ...[...new Set(medicines.map((m) => m.supplier_name).filter(Boolean))].sort().map((name) => ({ value: name, label: name })),
    ],
    [medicines],
  );
  const reset = <T,>(set: (v: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  const sellThrough = totals.received ? Math.round((totals.sold / totals.received) * 100) : 0;

  return (
    <div className="space-y-5">

      <WorkspacePanel className="space-y-4 p-5 sm:p-6">
        <SectionTitle
          icon={PackageCheck}
          tint="sky"
          title="Overall quantity"
          subtitle={`${sellThrough}% of everything received has been sold`}
        />
        <QuantityBar row={totals} className="h-3.5" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Received", totals.received, "text-white", "border-white/20"],
            ["Sold", totals.sold, "text-fuchsia-200", "border-fuchsia-300/40"],
            ["Damaged / wasted", totals.lost, "text-amber-200", "border-amber-300/40"],
            ["Unsold · in stock", totals.inStock, "text-emerald-200", "border-emerald-300/40"],
          ].map(([label, value, cls, border]) => (
            <div key={label as string} className={cn("rounded-2xl border bg-white/4 px-4 py-3", border as string)}>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/60">{label}</p>
              <p className={cn("mt-1 font-display text-2xl font-bold tabular-nums", cls as string)}>{(value as number).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel className="space-y-5 p-5 sm:p-6">
        <SectionTitle
          icon={copy.icon}
          tint={copy.tint}
          title={copy.title}
          subtitle={`Showing ${filtered.length} of ${baseRows.length} · ${copy.subtitle}`}
        />
        <ListToolbar
          search={search}
          onSearchChange={reset(setSearch)}
          searchPlaceholder="Search medicine, batch, supplier or category…"
          filterValue={supplierFilter}
          onFilterChange={reset(setSupplierFilter)}
          filterOptions={supplierOptions}
          filterPlaceholder="Supplier…"
          extra={
            <>
              <div className="w-full sm:w-48">
                <Combobox
                  value={stockFilter}
                  onChange={reset(setStockFilter)}
                  options={[
                    { value: "all", label: "All stock" },
                    { value: "in_stock", label: "In stock" },
                    { value: "sold_out", label: "Sold out" },
                    { value: "sold", label: "Has sales" },
                    { value: "unsold", label: "Never sold" },
                  ]}
                  placeholder="Stock…"
                />
              </div>
              <div className="w-full sm:w-48">
                <Combobox
                  value={expiryFilter}
                  onChange={reset(setExpiryFilter)}
                  options={[
                    { value: "all", label: "Any expiry" },
                    { value: "expired", label: "Expired" },
                    { value: "expiring", label: "Expiring (≤ 3 mo)" },
                    { value: "lime", label: "3–5 months" },
                    { value: "green", label: "5+ months" },
                  ]}
                  placeholder="Expiry…"
                />
              </div>
              {mode === "all" ? (
                <div className="w-full sm:w-44">
                  <Combobox
                    value={paymentFilter}
                    onChange={reset(setPaymentFilter)}
                    options={[
                      { value: "all", label: "Any payment" },
                      { value: "credit", label: "On credit" },
                      { value: "paid", label: "Fully paid" },
                    ]}
                    placeholder="Payment…"
                  />
                </div>
              ) : null}
            </>
          }
        />

        {pageRows.length ? (
          <div className="overflow-x-auto rounded-2xl border border-violet-300/25">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  {[mode === "credit" ? "Priority" : "#", "Medicine", "Supplier", "Received", "Sold", "In stock", "Paid / total", "Payment"].map((h, i) => (
                    <TableHead key={`${h}-${i}`} className={tableHeadClass}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row, i) => {
                  const m = row.medicine;
                  const tone = expiryTone(row.days);
                  const rank = (safePage - 1) * PAGE_SIZE + i;
                  return (
                    <TableRow key={m.id} className="border-white/8">
                      <TableCell>
                        {mode === "credit" && rank === 0 ? (
                          <Chip className="border-rose-300/60 bg-rose-400/25 text-rose-50">Pay first</Chip>
                        ) : (
                          <span className="text-sm tabular-nums text-white/60">{rank + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <LineDetail
                          row={row}
                          purchases={purchases}
                          losses={stockLosses}
                          supplier={suppliers.find((s) => s.supplier_name === m.supplier_name)}
                        >
                          <InitialsAvatar name={m.name} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{m.name}</p>
                            <p className="flex items-center gap-1.5 text-xs text-white/55">
                              Batch {m.batch_number || "—"}
                              {m.expiry_date ? <Chip className={cn("px-1.5 py-0 text-[10px]", EXPIRY_TONE_CLASSES[tone])}>{expiryLabel(row.days)}</Chip> : null}
                            </p>
                          </div>
                        </LineDetail>
                      </TableCell>
                      <TableCell className="text-white/80">{m.supplier_name || "—"}</TableCell>
                      <TableCell className="tabular-nums text-white/85">{row.received}</TableCell>
                      <TableCell>
                        <div className="w-24 space-y-1">
                          <p className="text-sm font-bold tabular-nums text-fuchsia-200">{row.sold} sold</p>
                          <QuantityBar row={row} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className={cn("font-bold tabular-nums", row.inStock <= 0 ? "text-rose-300" : row.inStock <= 5 ? "text-amber-200" : "text-emerald-200")}>
                          {row.inStock}
                        </p>
                        {row.lost ? <p className="text-[11px] text-amber-200/80">{row.lost} lost</p> : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        <p className="font-bold text-white/90">{formatCurrency(row.paid)}</p>
                        <p className="text-xs text-white/55">of {formatCurrency(row.total)}</p>
                      </TableCell>
                      <TableCell>
                        <PaymentChip row={row} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={copy.icon}
            tint={copy.tint}
            title={baseRows.length ? "No lines match" : mode === "credit" ? "No items on credit" : mode === "paid" ? "No fully paid items yet" : "No inventory lines yet"}
            description={baseRows.length ? "Try another search or filter." : "Items appear here as you register stock."}
          />
        )}

        {totalCount > 0 ? (
          <TablePagination page={safePage} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} itemLabel="lines" />
        ) : null}
      </WorkspacePanel>
    </div>
  );
}
