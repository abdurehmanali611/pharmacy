"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";
import { Calendar as CalendarIcon } from "lucide-react";

import { AppShell } from "@/components/chrome/AppShell";
import { MedicineCatalog } from "@/components/pharmacist/MedicineCatalog";
import { getPharmacistPageMeta, PHARMACIST_NAV, type PharmacistSectionKey } from "@/components/pharmacist/navigation";
import { SaleCartSection } from "@/components/pharmacist/SaleCartSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReportDataTable } from "@/components/report/ReportDataTable";
import { CreateBulkPurchase, fetchMedicine, fetchPurchase, Logout } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { saleCart } from "@/lib/validations";
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

  const saleForm = useForm<z.input<typeof saleCart>, unknown, z.output<typeof saleCart>>({
    resolver: zodResolver(saleCart),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: saleForm.control,
    name: "items",
  });

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

  const handleAddMedicineToCart = (medicine: MedicineData) => {
    const currentItems = saleForm.getValues("items");
    const existingIndex = currentItems.findIndex((item) => item.medicine_name === medicine.name);

    if (existingIndex >= 0) {
      const nextItems = [...currentItems];
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: Number(nextItems[existingIndex].quantity) + 1,
      };
      replace(nextItems);
      return;
    }

    append({
      medicine_name: medicine.name,
      quantity: 1,
      price: Number(medicine.price),
    });
  };

  const handleSubmitSale = async (data: z.infer<typeof saleCart>) => {
    setLoading(true);
    try {
      await CreateBulkPurchase(
        {
          items: data.items.map((item) => ({
            medicine_name: item.medicine_name,
            quantity: Number(item.quantity),
            price: Number(item.price),
            total_price: Number(item.quantity) * Number(item.price),
          })),
        },
        setLoading,
      );
      await loadData();
      saleForm.reset({ items: [] });
    } finally {
      setLoading(false);
    }
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
      <div className="mx-auto max-w-7xl space-y-6">
        {selected === "register" ? (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
            <MedicineCatalog
              medicines={medicines}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAddMedicine={handleAddMedicineToCart}
            />

            <SaleCartSection
              form={saleForm}
              fields={fields}
              loading={loading}
              medicines={medicines}
              remove={remove}
              onSubmit={handleSubmitSale}
            />
          </div>
        ) : null}

        {selected === "sales" ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass panel-glow rounded-[1.75rem] border-white/10 bg-white/3">
                <CardContent className="p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">Total revenue</p>
                  <p className="mt-3 font-display text-3xl tracking-tight text-apex-orange-light">
                    {formatCurrency(summary.totalSales)}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass panel-glow rounded-[1.75rem] border-white/10 bg-white/3">
                <CardContent className="p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">Items sold</p>
                  <p className="mt-3 font-display text-3xl tracking-tight text-white">
                    {summary.totalItems}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass panel-glow rounded-[1.75rem] border-white/10 bg-white/3">
                <CardContent className="p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">Average sale</p>
                  <p className="mt-3 font-display text-3xl tracking-tight text-white">
                    {formatCurrency(summary.averageSale)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass panel-glow rounded-[1.75rem] border-white/10 p-6">
              <CardHeader className="px-0 pt-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="font-display text-2xl">Recent sales</CardTitle>
                    <CardDescription>
                      Showing sales for{" "}
                      <span className="font-medium text-foreground">
                        {salesDay ? format(parseISO(salesDay), "PPP") : "today"}
                      </span>
                      .
                    </CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
                  <div className="rounded-2xl border border-white/10 bg-muted/40 p-4 text-sm text-muted-foreground">
                    Loading sales...
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
