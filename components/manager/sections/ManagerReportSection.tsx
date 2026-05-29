"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDataTable } from "@/components/report/ReportDataTable";
import { formatCurrency } from "@/lib/format";
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
  medicines: string;
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
      if (level === "none") return <span className="text-sm text-muted-foreground">No date</span>;
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
  { accessorKey: "medicines", header: "Medicines" },
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
    return purchases.filter((item) => {
      const date = new Date(item.created_at);
      if (Number.isNaN(date.getTime())) return false;
      return reportMode === "daily"
        ? date.toISOString().slice(0, 10) === reportDay
        : date.toISOString().slice(0, 7) === reportMonth;
    });
  }, [purchases, reportDay, reportMode, reportMonth]);

  const overview = useMemo(() => {
    const totalSales = filteredPurchases.reduce((sum, item) => sum + Number(item.total_price), 0);
    const totalProfit = filteredPurchases.reduce((sum, item) => sum + Number(item.profit), 0);
    const totalUnits = filteredPurchases.reduce((sum, item) => sum + Number(item.quantity), 0);
    const totalCashout = cashouts.reduce((sum, item) => sum + Number(item.amount), 0);
    return { totalSales, totalProfit, totalUnits, totalCashout, netAfterCashout: totalProfit - totalCashout };
  }, [cashouts, filteredPurchases]);

  const supplierReportData = useMemo<SupplierReportRow[]>(() => {
    return suppliers.map((supplier) => {
      const supplierMedicines = medicines.filter((medicine) => medicine.supplier_name === supplier.supplier_name);
      const supplierInvoices = invoices.filter((invoice) => invoice.supplier_name === supplier.supplier_name);

      return {
        id: supplier.id,
        supplier_name: supplier.supplier_name,
        supplier_phone: supplier.supplier_phone,
        supplier_email: supplier.supplier_email || "No email",
        medicines: supplierMedicines.map((medicine) => medicine.name).join(", ") || "No medicines yet",
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
    <div className="space-y-6">
      <Card className="glass panel-glow rounded-[1.75rem] border-white/10 p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="font-[family-name:var(--font-display)] text-2xl">Analytics hub</CardTitle>
          <CardDescription>
            Drill into sales performance, stock health, supplier activity, invoices, and cashouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ReportSectionKey)}
            orientation="vertical"
            className="flex flex-col gap-6 lg:flex-row"
          >
            <TabsList
              variant="line"
              className="h-auto w-full shrink-0 flex-col items-stretch gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2 lg:w-56"
            >
              {[
                { key: "overview", label: "Overview" },
                { key: "medicines", label: "Medicine report" },
                { key: "suppliers", label: "Supplier report" },
                { key: "invoices", label: "Invoice report" },
                { key: "cashouts", label: "Cashout report" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="w-full justify-start rounded-xl px-3 py-2.5 data-active:bg-amber-500/10 data-active:text-amber-100"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-w-0 flex-1">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={reportMode === "daily" ? "default" : "outline"}
                    className={reportMode !== "daily" ? "border-white/10 bg-white/5" : undefined}
                    onClick={() => setReportMode("daily")}
                  >
                    Daily
                  </Button>
                  <Button
                    type="button"
                    variant={reportMode === "monthly" ? "default" : "outline"}
                    className={reportMode !== "monthly" ? "border-white/10 bg-white/5" : undefined}
                    onClick={() => setReportMode("monthly")}
                  >
                    Monthly
                  </Button>
                  {reportMode === "daily" ? (
                    <DateFilterPicker value={reportDay} onChange={setReportDay} placeholder="Pick a day" />
                  ) : (
                    <DateFilterPicker
                      value={reportMonth}
                      onChange={setReportMonth}
                      placeholder="Pick a month"
                      granularity="month"
                    />
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total sales", value: formatCurrency(overview.totalSales), tone: "text-amber-200" },
                    { label: "Total profit", value: formatCurrency(overview.totalProfit), tone: "text-cyan-200" },
                    { label: "Units sold", value: String(overview.totalUnits), tone: "text-white" },
                    {
                      label: "Net after cashout",
                      value: formatCurrency(overview.netAfterCashout),
                      tone: overview.netAfterCashout >= 0 ? "text-emerald-200" : "text-rose-200",
                      hint: `Cashouts: ${formatCurrency(overview.totalCashout)}`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    >
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">{stat.label}</p>
                      <p className={`mt-2 font-[family-name:var(--font-display)] text-2xl tracking-tight ${stat.tone}`}>
                        {stat.value}
                      </p>
                      {"hint" in stat && stat.hint ? (
                        <p className="mt-1 text-xs text-white/45">{stat.hint}</p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <ReportDataTable columns={purchaseColumns} data={filteredPurchases} searchColumnId="medicine_name" />
              </TabsContent>

              <TabsContent value="medicines" className="mt-0">
                <ReportDataTable columns={medicineColumns} data={medicineReportData} searchColumnId="name" />
              </TabsContent>

              <TabsContent value="suppliers" className="mt-0">
                <ReportDataTable columns={supplierColumns} data={supplierReportData} searchColumnId="supplier_name" />
              </TabsContent>

              <TabsContent value="invoices" className="mt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "Total invoices", value: invoices.length },
                    { label: "Paid invoices", value: paidInvoices.length },
                    { label: "Unpaid invoices", value: unpaidInvoices.length },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <ReportDataTable columns={invoiceColumns} data={invoices} searchColumnId="invoice_number" />
              </TabsContent>

              <TabsContent value="cashouts" className="mt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-muted-foreground">Total cashout entries</p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">{cashouts.length}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-muted-foreground">Total cashout amount</p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">
                      {formatCurrency(cashouts.reduce((sum, item) => sum + Number(item.amount), 0))}
                    </p>
                  </div>
                </div>
                <ReportDataTable columns={cashoutColumns} data={cashouts} searchColumnId="reason" />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
