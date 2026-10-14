"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Boxes, Calendar as CalendarIcon, PackageCheck, Pill } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/chrome/AppShell";
import { MedicineCatalog } from "@/components/pharmacist/MedicineCatalog";
import { getPharmacistPageMeta, PHARMACIST_NAV, type PharmacistSectionKey } from "@/components/pharmacist/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReportDataTable } from "@/components/report/ReportDataTable";
import { CreateBulkPurchase, fetchMedicine, fetchPurchase, Logout } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import type { MedicineData, PurchaseData } from "@/lib/actions";

const purchaseColumns: ColumnDef<PurchaseData>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
  },
  {
    accessorKey: "medicine_name",
    header: "Medicine",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "total_price",
    header: "Sale",
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

export default function PharmacistView() {
  const [pharmacy, setPharmacy] = useState("");
  const [logo, setLogo] = useState("");
  const [selected, setSelected] = useState<PharmacistSectionKey>("register");
  const [medicines, setMedicines] = useState<MedicineData[]>([]);
  const [sales, setSales] = useState<PurchaseData[]>([]);
  const [salesDay, setSalesDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const date = new Date(item.created_at);
      if (Number.isNaN(date.getTime())) return false;
      return date.toISOString().slice(0, 10) === salesDay;
    });
  }, [sales, salesDay]);

  const summary = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, item) => sum + Number(item.total_price), 0);
    const totalItems = filteredSales.reduce((sum, item) => sum + item.quantity, 0);
    const averageSale = filteredSales.length ? totalSales / filteredSales.length : 0;
    return { totalSales, totalItems, averageSale };
  }, [filteredSales]);

  const inventorySummary = useMemo(() => ({
    medicineCount: medicines.filter((item) => Number(item.quantity) > 0).length,
    totalUnits: medicines.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    lowStockCount: medicines.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= 5).length,
  }), [medicines]);

  const loadData = async () => {
    setSalesLoading(true);
    try {
      const [medicineData, purchaseData] = await Promise.all([fetchMedicine(), fetchPurchase()]);
      setMedicines(medicineData ?? []);
      setSales(purchaseData ?? []);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    setPharmacy(localStorage.getItem("Pharmacy") ?? "");
    setLogo(localStorage.getItem("Logo") ?? "");
    void loadData();
  }, []);

  const handleSubmitOrder = async (entries: { medicine: MedicineData; quantity: number }[]) => {
    const result = await CreateBulkPurchase(
      {
        items: entries.map(({ medicine, quantity }) => ({
          medicine_id: Number(medicine.id),
          medicine_name: medicine.name,
          quantity: Number(quantity),
          price: Number(medicine.price),
          total_price: Number(quantity) * Number(medicine.price),
        })),
      },
      setLoading,
    );
    if (result === undefined) return false;

    try {
      await loadData();
    } catch {
      toast.error("Order recorded, but the pharmacist data could not be refreshed.");
    }
    return true;
  };

  const pageMeta = getPharmacistPageMeta(selected);

  return (
    <AppShell
      pharmacy={pharmacy}
      logo={logo}
      roleLabel="Pharmacist"
      navItems={PHARMACIST_NAV}
      selected={selected}
      onSelect={(key) => setSelected(key as PharmacistSectionKey)}
      onLogout={Logout}
      pageTitle={pageMeta.title}
    >
      <div className="mx-auto max-w-7xl space-y-6 pb-8">
        {selected === "register" ? (
          <>
            <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-apex-orange/22 bg-[linear-gradient(120deg,rgba(232,149,30,0.16),rgba(11,25,46,0.94)_44%,rgba(30,64,175,0.16))] p-5 shadow-[0_24px_70px_-48px_rgba(232,149,30,0.55)] sm:p-6">
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-24 h-56 w-56 rounded-full bg-apex-orange/10 blur-3xl" />
              <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-apex-orange/25 bg-apex-orange/10 text-apex-orange-light shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.24em] text-apex-orange-light/85">
                      Pharmacist · Sales counter
                    </p>
                    <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      A clear view of your counter
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-white/60">
                      Find a medicine, check its stock, and place a single or batch order with confidence.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-100">
                  <div className="rounded-2xl border border-white/10 bg-[#060e1a]/45 p-3 sm:p-3.5">
                    <div className="flex items-center gap-1.5 text-white/55">
                      <PackageCheck className="h-3.5 w-3.5 text-emerald-300" />
                      <span className="text-[0.62rem] font-semibold uppercase tracking-wider sm:text-xs">In stock</span>
                    </div>
                    <p className="mt-2 font-display text-xl font-semibold tabular-nums text-white sm:text-2xl">
                      {inventorySummary.medicineCount}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-white/45 sm:text-xs">medicines</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#060e1a]/45 p-3 sm:p-3.5">
                    <div className="flex items-center gap-1.5 text-white/55">
                      <Boxes className="h-3.5 w-3.5 text-sky-200" />
                      <span className="text-[0.62rem] font-semibold uppercase tracking-wider sm:text-xs">On hand</span>
                    </div>
                    <p className="mt-2 font-display text-xl font-semibold tabular-nums text-white sm:text-2xl">
                      {inventorySummary.totalUnits.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-white/45 sm:text-xs">total units</p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-400/5 p-3 sm:p-3.5">
                    <div className="flex items-center gap-1.5 text-amber-100/70">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                      <span className="text-[0.62rem] font-semibold uppercase tracking-wider sm:text-xs">Low stock</span>
                    </div>
                    <p className="mt-2 font-display text-xl font-semibold tabular-nums text-amber-100 sm:text-2xl">
                      {inventorySummary.lowStockCount}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-white/45 sm:text-xs">at or below 5</p>
                  </div>
                </div>
              </div>
            </section>
            <MedicineCatalog
              medicines={medicines}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              loading={loading}
              onOrder={handleSubmitOrder}
            />
          </>
        ) : null}

        {selected === "sales" ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.24em] text-apex-orange-light/80">
                  Pharmacist · Performance
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Sales at a glance
                </h2>
              </div>
              <p className="text-sm text-white/55">
                Summary for {format(parseISO(salesDay), "PPP")}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass panel-glow rounded-[1.5rem] border-apex-orange/15 bg-[linear-gradient(145deg,rgba(232,149,30,0.08),rgba(11,25,46,0.45)_60%,rgba(6,14,26,0.65))]">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Total revenue</p>
                  <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-apex-orange-light">
                    {formatCurrency(summary.totalSales)}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass panel-glow rounded-[1.5rem] border-sky-300/15 bg-[linear-gradient(145deg,rgba(56,110,170,0.12),rgba(11,25,46,0.45)_60%,rgba(6,14,26,0.65))]">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Items sold</p>
                  <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
                    {summary.totalItems}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass panel-glow rounded-[1.5rem] border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(11,25,46,0.45)_60%,rgba(6,14,26,0.65))]">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Average sale</p>
                  <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
                    {formatCurrency(summary.averageSale)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass panel-glow rounded-[1.75rem] border-white/10 p-5 sm:p-6">
              <CardHeader className="px-0 pt-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Recent sales</CardTitle>
                    <CardDescription className="mt-1 text-white/55">
                      Showing completed sales for{" "}
                      <span className="font-medium text-white/85">
                        {salesDay ? format(parseISO(salesDay), "PPP") : "today"}
                      </span>
                      .
                    </CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-10 gap-2 border-white/12 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">
                        <CalendarIcon className="h-4 w-4 text-apex-orange-light" />
                        {salesDay ? format(parseISO(salesDay), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={salesDay ? parseISO(salesDay) : undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          setSalesDay(format(date, "yyyy-MM-dd"));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {salesLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/4 p-5 text-sm text-white/60">
                    Loading sales…
                  </div>
                ) : (
                  <ReportDataTable columns={purchaseColumns} data={filteredSales} searchColumnId="medicine_name" />
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
