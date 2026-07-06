"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { DollarSign, Package, TrendingUp, Wallet } from "lucide-react";

import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { LinkedNamesCell } from "@/components/manager/LinkedNamesCell";
import { ManagerAnalyticsCharts } from "@/components/manager/ManagerAnalyticsCharts";
import { ManagerCommandStrip } from "@/components/manager/ManagerCommandStrip";
import { ReportTabsNav } from "@/components/manager/ReportTabsNav";
import {
  WorkspacePanel,
  WorkspaceSectionHeader,
  WorkspaceStat,
} from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ReportDataTable } from "@/components/report/ReportDataTable";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CashoutData, InvoiceData, MedicineData, PurchaseData, SupplierData } from "@/lib/actions";
import type { ReportSectionKey } from "@/components/manager/types";

type MedicineReportRow = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  supplier_name: string;
  batch_number: string;
  expiry_date: string;
  expiry_level: "expired" | "soon" | "ok" | "none";
  stock_level: "critical" | "low" | "ok" | "out";
};

type SupplierReportRow = {
  id: string;
  supplier_name: string;
  supplier_phone: string;
  supplier_email: string;
  medicine_names: string[];
  medicine_count: number;
  invoice_count: number;
  invoice_amount: number;
};

const medicineColumns: ColumnDef<MedicineReportRow>[] = [
  { accessorKey: "name", header: "Medicine" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "supplier_name", header: "Supplier" },
  {
    accessorKey: "quantity",
    header: "Stock",
    cell: ({ row }) => {
      const stockLevel = row.original.stock_level;
      return (
        <div className="space-y-1">
          <Badge
            variant={stockLevel === "critical" || stockLevel === "out" ? "destructive" : stockLevel === "low" ? "secondary" : "outline"}
            className={stockLevel === "ok" ? "font-bold" : "font-black tracking-[0.18em]"}
          >
            {stockLevel === "out" ? "OUT" : stockLevel === "critical" ? "CRITICAL" : stockLevel === "low" ? "LOW" : "OK"}
          </Badge>
          <p className={stockLevel === "ok" ? "text-xs font-semibold" : "text-xs font-black uppercase tracking-wide"}>
            {row.original.quantity} units
          </p>
        </div>
      );
    },
  },
  { accessorKey: "batch_number", header: "Batch" },
  {
    accessorKey: "expiry_date",
    header: "Expiry",
    cell: ({ row }) => {
      const level = row.original.expiry_level;
      if (level === "none") return <span className="text-sm text-white/45">No date</span>;
      return (
        <div className="space-y-1">
          <Badge
            variant={level === "expired" ? "destructive" : level === "soon" ? "secondary" : "outline"}
            className={level === "ok" ? "font-bold" : "font-black tracking-[0.18em]"}
          >
            {level === "expired" ? "EXPIRED" : level === "soon" ? "SOON" : "OK"}
          </Badge>
          <p className={level === "ok" ? "text-xs font-semibold" : "text-xs font-black uppercase tracking-wide"}>
            {row.original.expiry_date}
          </p>
        </div>
      );
    },
  },
];

const supplierColumns: ColumnDef<SupplierReportRow>[] = [
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "supplier_phone", header: "Phone" },
  { accessorKey: "supplier_email", header: "Email" },
  {
    id: "medicines",
    header: "Medicines",
    cell: ({ row }) => (
      <LinkedNamesCell
        items={row.original.medicine_names}
        itemLabel="medicine"
        emptyLabel="No medicines yet"
      />
    ),
  },
  { accessorKey: "invoice_count", header: "Invoices" },
  {
    accessorKey: "invoice_amount",
    header: "Invoice Amount",
    cell: ({ row }) => formatCurrency(row.original.invoice_amount),
  },
];

const invoiceColumns: ColumnDef<InvoiceData>[] = [
  { accessorKey: "invoice_number", header: "Invoice" },
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "invoice_type", header: "Type" },
  { accessorKey: "invoice_status", header: "Status" },
  {
    accessorKey: "invoice_amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.invoice_amount),
  },
  {
    accessorKey: "invoice_date",
    header: "Date",
    cell: ({ row }) => format(parseISO(row.original.invoice_date), "PPP"),
  },
];

const cashoutColumns: ColumnDef<CashoutData>[] = [
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  { accessorKey: "reason", header: "Reason" },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];

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

function matchesReportPeriod(
  createdAt: string,
  reportMode: "daily" | "monthly",
  reportDay: string,
  reportMonth: string,
) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  return reportMode === "daily"
    ? date.toISOString().slice(0, 10) === reportDay
    : date.toISOString().slice(0, 7) === reportMonth;
}

function ReportPeriodFilter({
  reportMode,
  reportDay,
  reportMonth,
  onModeChange,
  onDayChange,
  onMonthChange,
}: {
  reportMode: "daily" | "monthly";
  reportDay: string;
  reportMonth: string;
  onModeChange: (mode: "daily" | "monthly") => void;
  onDayChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        size="sm"
        variant={reportMode === "daily" ? "default" : "outline"}
        className={cn(reportMode !== "daily" && "border-white/14 bg-white/6 text-white/75")}
        onClick={() => onModeChange("daily")}
      >
        Daily
      </Button>
      <Button
        type="button"
        size="sm"
        variant={reportMode === "monthly" ? "default" : "outline"}
        className={cn(reportMode !== "monthly" && "border-white/14 bg-white/6 text-white/75")}
        onClick={() => onModeChange("monthly")}
      >
        Monthly
      </Button>
      {reportMode === "daily" ? (
        <DateFilterPicker value={reportDay} onChange={onDayChange} placeholder="Pick a day" />
      ) : (
        <DateFilterPicker
          value={reportMonth}
          onChange={onMonthChange}
          placeholder="Pick a month"
          granularity="month"
        />
      )}
    </div>
  );
}

export function ManagerReportSection({
  medicines,
  purchases,
  suppliers,
  invoices,
  cashouts,
}: {
  medicines: MedicineData[];
  purchases: PurchaseData[];
  suppliers: SupplierData[];
  invoices: InvoiceData[];
  cashouts: CashoutData[];
}) {
  const getExpiryLevel = (expiryDate?: string | null) => {
    if (!expiryDate) return "none" as const;
    const date = parseISO(expiryDate);
    if (Number.isNaN(date.getTime())) return "none" as const;
    const today = new Date();
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    if (date.getTime() < endOfToday.getTime()) return "expired" as const;
    const in30Days = new Date(endOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (date.getTime() <= in30Days.getTime()) return "soon" as const;
    return "ok" as const;
  };

  const getStockLevel = (quantity: number) => {
    if (quantity <= 0) return "out" as const;
    if (quantity <= 5) return "critical" as const;
    if (quantity <= 20) return "low" as const;
    return "ok" as const;
  };

  const [activeTab, setActiveTab] = useState<ReportSectionKey>("overview");
  const [reportMode, setReportMode] = useState<"daily" | "monthly">("daily");
  const [reportDay, setReportDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) =>
      matchesReportPeriod(item.created_at, reportMode, reportDay, reportMonth),
    );
  }, [purchases, reportDay, reportMode, reportMonth]);

  const filteredCashouts = useMemo(() => {
    return cashouts.filter((item) =>
      matchesReportPeriod(item.created_at, reportMode, reportDay, reportMonth),
    );
  }, [cashouts, reportDay, reportMode, reportMonth]);

  const overview = useMemo(() => {
    const totalSales = filteredPurchases.reduce((sum, item) => sum + Number(item.total_price), 0);
    const totalProfit = filteredPurchases.reduce((sum, item) => sum + Number(item.profit), 0);
    const totalUnits = filteredPurchases.reduce((sum, item) => sum + Number(item.quantity), 0);
    const totalCashout = filteredCashouts.reduce((sum, item) => sum + Number(item.amount), 0);
    return { totalSales, totalProfit, totalUnits, totalCashout, netAfterCashout: totalProfit - totalCashout };
  }, [filteredCashouts, filteredPurchases]);

  const supplierReportData = useMemo<SupplierReportRow[]>(() => {
    return suppliers.map((supplier) => {
      const supplierMedicines = medicines.filter((medicine) => medicine.supplier_name === supplier.supplier_name);
      const supplierInvoices = invoices.filter((invoice) => invoice.supplier_name === supplier.supplier_name);

      return {
        id: supplier.id,
        supplier_name: supplier.supplier_name,
        supplier_phone: supplier.supplier_phone,
        supplier_email: supplier.supplier_email || "No email",
        medicine_names: supplierMedicines.map((medicine) => medicine.name),
        medicine_count: supplierMedicines.length,
        invoice_count: supplierInvoices.length,
        invoice_amount: supplierInvoices.reduce((sum, invoice) => sum + Number(invoice.invoice_amount), 0),
      };
    });
  }, [invoices, medicines, suppliers]);

  const medicineReportData = useMemo<MedicineReportRow[]>(() => {
    return medicines.map((medicine) => ({
      id: medicine.id,
      name: medicine.name,
      category: medicine.category || "Uncategorized",
      quantity: medicine.quantity,
      supplier_name: medicine.supplier_name,
      batch_number: medicine.batch_number || "N/A",
      expiry_date: medicine.expiry_date ? format(parseISO(medicine.expiry_date), "PPP") : "No date",
      expiry_level: getExpiryLevel(medicine.expiry_date),
      stock_level: getStockLevel(Number(medicine.quantity)),
    }));
  }, [medicines]);

  const paidInvoices = invoices.filter((invoice) => invoice.invoice_status === "paid");
  const unpaidInvoices = invoices.filter((invoice) => invoice.invoice_status === "unpaid");

  return (
    <div className="space-y-5">
      <ManagerCommandStrip
        medicines={medicines}
        unpaidInvoices={unpaidInvoices}
        getStockLevel={getStockLevel}
        getExpiryLevel={getExpiryLevel}
      />

      <WorkspacePanel>
        <WorkspaceSectionHeader
          title="Analytics command center"
          description="Real-time intelligence across sales, inventory health, suppliers, invoices, and cash movement."
        />

        <div className="px-4 pb-6 sm:px-6 lg:px-7">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportSectionKey)}>
            <ReportTabsNav
              counts={{
                medicines: medicines.length,
                suppliers: suppliers.length,
                invoices: invoices.length,
                cashouts: cashouts.length,
              }}
            />

            <TabsContent value="overview" className="mt-0 space-y-5">
              <ReportPeriodFilter
                reportMode={reportMode}
                reportDay={reportDay}
                reportMonth={reportMonth}
                onModeChange={setReportMode}
                onDayChange={setReportDay}
                onMonthChange={setReportMonth}
              />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <WorkspaceStat
                  label="Total sales"
                  value={formatCurrency(overview.totalSales)}
                  tone="text-apex-orange-light"
                  icon={DollarSign}
                />
                <WorkspaceStat
                  label="Total profit"
                  value={formatCurrency(overview.totalProfit)}
                  tone="text-emerald-300"
                  icon={TrendingUp}
                />
                <WorkspaceStat
                  label="Units sold"
                  value={String(overview.totalUnits)}
                  tone="text-white"
                  icon={Package}
                />
                <WorkspaceStat
                  label="Net after cashout"
                  value={formatCurrency(overview.netAfterCashout)}
                  tone={overview.netAfterCashout >= 0 ? "text-emerald-200" : "text-red-300"}
                  hint={`Cashouts: ${formatCurrency(overview.totalCashout)}`}
                  icon={Wallet}
                />
              </div>

              <ManagerAnalyticsCharts
                purchases={filteredPurchases}
                medicines={medicines}
                getStockLevel={getStockLevel}
                getExpiryLevel={getExpiryLevel}
              />

              <div>
                <p className="mb-3 text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/45">
                  Sales ledger
                </p>
                <ReportDataTable columns={purchaseColumns} data={filteredPurchases} searchColumnId="medicine_name" />
              </div>
            </TabsContent>

            <TabsContent value="medicines" className="mt-0">
              <ReportDataTable columns={medicineColumns} data={medicineReportData} searchColumnId="name" />
            </TabsContent>

            <TabsContent value="suppliers" className="mt-0">
              <ReportDataTable columns={supplierColumns} data={supplierReportData} searchColumnId="supplier_name" />
            </TabsContent>

            <TabsContent value="invoices" className="mt-0 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <WorkspaceStat label="Total invoices" value={String(invoices.length)} />
                <WorkspaceStat label="Paid" value={String(paidInvoices.length)} tone="text-emerald-300" />
                <WorkspaceStat label="Unpaid" value={String(unpaidInvoices.length)} tone="text-apex-orange-light" />
              </div>
              <ReportDataTable columns={invoiceColumns} data={invoices} searchColumnId="invoice_number" />
            </TabsContent>

            <TabsContent value="cashouts" className="mt-0 space-y-4">
              <ReportPeriodFilter
                reportMode={reportMode}
                reportDay={reportDay}
                reportMonth={reportMonth}
                onModeChange={setReportMode}
                onDayChange={setReportDay}
                onMonthChange={setReportMonth}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <WorkspaceStat label="Cashout entries" value={String(filteredCashouts.length)} />
                <WorkspaceStat
                  label="Total withdrawn"
                  value={formatCurrency(
                    filteredCashouts.reduce((sum, item) => sum + Number(item.amount), 0),
                  )}
                  tone="text-apex-orange-light"
                />
              </div>
              <ReportDataTable columns={cashoutColumns} data={filteredCashouts} searchColumnId="reason" />
            </TabsContent>
          </Tabs>
        </div>
      </WorkspacePanel>
    </div>
  );
}
