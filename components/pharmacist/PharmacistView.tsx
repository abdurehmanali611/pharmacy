"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";
import { Calendar as CalendarIcon } from "lucide-react";

import { MedicineCatalog } from "@/components/pharmacist/MedicineCatalog";
import { SaleCartSection } from "@/components/pharmacist/SaleCartSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      <div className="glass panel-glow rounded-[2rem] border border-white/10 p-6 shadow-black/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-white/10">
              <AvatarImage src={logo || "/assets/pharmacy.jpg"} alt={pharmacy || "Pharmacy"} />
              <AvatarFallback>{pharmacy ? pharmacy[0] : "P"}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="display-kicker text-amber-200">Pharmacist deck</p>
              <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.05em] text-white">{pharmacy || "Pharmacy"}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/62">
                Pharmacist register with fast search, category filtering, and multi-medicine checkout.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-white/12 bg-white/6 text-white hover:bg-white/10" onClick={Logout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <MedicineCatalog
          medicines={medicines}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddMedicine={handleAddMedicineToCart}
        />

        <div className="space-y-6">
          <SaleCartSection
            form={saleForm}
            fields={fields}
            loading={loading}
            medicines={medicines}
            remove={remove}
            onSubmit={handleSubmitSale}
          />

          <Card className="rounded-3xl p-6">
            <CardHeader>
              <CardTitle>Sales summary</CardTitle>
              <CardDescription>
                Showing totals for{" "}
                <span className="font-medium text-foreground">
                  {salesDay ? format(parseISO(salesDay), "PPP") : "today"}
                </span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  Select a day to review your sales.
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-2">
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
              <div className="min-w-0 rounded-3xl border border-white/10 bg-muted p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">TOTAL REVENUE</p>
                <p className="mt-2 truncate text-xl font-semibold tabular-nums md:text-2xl">
                  {formatCurrency(summary.totalSales)}
                </p>
              </div>
              <div className="min-w-0 rounded-3xl border border-white/10 bg-muted p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">TOTAL ITEMS</p>
                <p className="mt-2 truncate text-xl font-semibold tabular-nums md:text-2xl">
                  {summary.totalItems}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <CardDescription>
            Showing sales for{" "}
            <span className="font-medium text-foreground">{format(parseISO(salesDay), "PPP")}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="rounded-2xl border border-white/10 bg-muted p-4 text-sm text-muted-foreground">
              Loading sales...
            </div>
          ) : (
            <ReportDataTable columns={purchaseColumns} data={filteredSales} searchColumnId="medicine_name" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
