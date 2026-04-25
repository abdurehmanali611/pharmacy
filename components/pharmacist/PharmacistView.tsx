"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ReportDataTable } from "@/components/report/ReportDataTable";
import { fetchMedicine, fetchPurchase, CreatePurchase, Logout } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { purchase } from "@/lib/validations";
import type { MedicineData, PurchaseData } from "@/lib/actions";
import type { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";

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
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);

  const purchaseForm = useForm<z.input<typeof purchase>, any, z.output<typeof purchase>>({
    resolver: zodResolver(purchase),
    defaultValues: {
      medicine_name: "",
      quantity: 1,
      price: 0,
    },
  });

  const selectedMedicineName = purchaseForm.watch("medicine_name");
  const selectedMedicine = medicines.find((item) => item.name === selectedMedicineName);
  const quantity = purchaseForm.watch("quantity");
  const price = purchaseForm.watch("price");
  const totalPrice = Number(quantity || 0) * Number(price || 0);
  const availableStock = Number(selectedMedicine?.quantity ?? 0);
  const requestedQuantity = Number(quantity ?? 0);
  const insufficientStock =
    Boolean(selectedMedicineName) && requestedQuantity > 0 && requestedQuantity > availableStock;

  const summary = useMemo(() => {
    const totalSales = sales.reduce((sum, item) => sum + Number(item.total_price), 0);
    const totalItems = sales.reduce((sum, item) => sum + item.quantity, 0);
    const averageSale = sales.length ? totalSales / sales.length : 0;
    return { totalSales, totalItems, averageSale };
  }, [sales]);

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

  useEffect(() => {
    if (selectedMedicine) {
      purchaseForm.setValue("price", Number(selectedMedicine.price), { shouldValidate: true });
    }
  }, [selectedMedicine, purchaseForm]);

  const handleSubmitSale = async (data: z.output<typeof purchase>) => {
    setLoading(true);
    try {
      await CreatePurchase(
        {
          medicine_name: data.medicine_name,
          quantity: data.quantity,
          price: data.price,
          total_price: Number(data.quantity) * Number(data.price),
        },
        setLoading,
      );
      await loadData();
      purchaseForm.reset({ medicine_name: "", quantity: 1, price: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={logo || "/assets/pharmacy.jpg"} alt={pharmacy || "Pharmacy"} />
              <AvatarFallback>{pharmacy ? pharmacy[0] : "P"}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-semibold">{pharmacy || "Pharmacy"}</h1>
              <p className="text-sm text-muted-foreground">Pharmacist sales register and daily revenue tracking.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={Logout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.85fr]">
        <Card className="rounded-3xl p-6">
          <CardHeader>
            <CardTitle>Register a sale</CardTitle>
            <CardDescription>Choose a medicine, enter quantity, and record the transaction.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={purchaseForm.handleSubmit(handleSubmitSale)}>
              <CustomFormField
                name="medicine_name"
                control={purchaseForm.control}
                fieldType={formFieldTypes.SELECT}
                label="Medicine"
                placeholder="Select medicine"
                options={medicines.map((medicine) => ({
                  label: `${medicine.name} - ${formatCurrency(medicine.price)}`,
                  value: medicine.name,
                }))}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <CustomFormField
                  name="quantity"
                  control={purchaseForm.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Quantity"
                  placeholder="Enter quantity"
                  type="number"
                />
                <CustomFormField
                  name="price"
                  control={purchaseForm.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Sale price"
                  placeholder="0.00"
                  type="number"
                />
              </div>
              <div className="rounded-3xl border border-white/10 bg-muted p-4">
                <p className="text-sm text-muted-foreground">Transaction total</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalPrice)}</p>
              </div>
              {selectedMedicine ? (
                <p className="text-sm text-muted-foreground">
                  Stock available: <span className={insufficientStock ? "text-destructive" : "text-foreground"}>{availableStock}</span>
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !selectedMedicineName || insufficientStock || availableStock <= 0}
              >
                {loading ? "Recording..." : "Record sale"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl p-6">
            <CardHeader>
              <CardTitle>Sales summary</CardTitle>
              <CardDescription>Live totals for today&apos;s sales work.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
              <div className="min-w-0 rounded-3xl border border-white/10 bg-muted p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">AVG. SALE</p>
                <p className="mt-2 truncate text-xl font-semibold tabular-nums md:text-2xl">
                  {formatCurrency(summary.averageSale)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password credentials are managed by the manager role. */}
        </div>
      </div>

      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
          <CardDescription>Latest registered transactions appear below.</CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="rounded-2xl border border-white/10 bg-muted p-4 text-sm text-muted-foreground">
              Loading sales…
            </div>
          ) : (
            <ReportDataTable columns={purchaseColumns} data={sales} searchColumnId="medicine_name" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
