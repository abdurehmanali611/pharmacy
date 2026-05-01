"use client";

import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DRUG_CATEGORIES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { addMedicine } from "@/lib/validations";
import type { MedicineData, SupplierData } from "@/lib/actions";

function getStockLevel(quantity: number) {
  if (quantity <= 5) return "critical";
  if (quantity <= 20) return "low";
  return "ok";
}

function getExpiryLevel(expiryDate?: string | null) {
  if (!expiryDate) return "none";
  const date = parseISO(expiryDate);
  if (Number.isNaN(date.getTime())) return "none";
  const today = new Date();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  if (date.getTime() < endOfToday.getTime()) return "expired";
  const in30Days = new Date(endOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (date.getTime() <= in30Days.getTime()) return "soon";
  return "ok";
}

export function MedicineManagementSection({
  form,
  loading,
  importing,
  medicineToEdit,
  medicines,
  medicineCount,
  medicinePage,
  medicineSearch,
  medicineCreatedDate,
  suppliers,
  onSearchChange,
  onCreatedDateChange,
  onSubmit,
  onCancelEdit,
  onDelete,
  onEdit,
  onImport,
  onPageChange,
}: {
  form: UseFormReturn<z.infer<typeof addMedicine>>;
  loading: boolean;
  importing: boolean;
  medicineToEdit: MedicineData | null;
  medicines: MedicineData[];
  medicineCount: number;
  medicinePage: number;
  medicineSearch: string;
  medicineCreatedDate: string;
  suppliers: SupplierData[];
  onSearchChange: (value: string) => void;
  onCreatedDateChange: (value: string) => void;
  onSubmit: (data: z.infer<typeof addMedicine>) => void | Promise<void>;
  onCancelEdit: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onEdit: (medicine: MedicineData) => void;
  onImport: (file: File) => void | Promise<void>;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(medicineCount / 10));

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>{medicineToEdit ? "Edit medicine" : "Add medicine"}</CardTitle>
          <CardDescription>
            Medicines now select suppliers from the supplier records already saved in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <CustomFormField
              name="name"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Medicine name"
              placeholder="Enter medicine name"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <CustomFormField
                name="category"
                control={form.control}
                fieldType={formFieldTypes.SELECT}
                label="Category"
                placeholder="Select category"
                options={DRUG_CATEGORIES.map((item) => ({
                  label: item.name,
                  value: item.value,
                }))}
              />
              <CustomFormField
                name="supplier_id"
                control={form.control}
                fieldType={formFieldTypes.SELECT}
                label="Supplier"
                placeholder={suppliers.length ? "Select supplier" : "Add suppliers first"}
                options={suppliers.map((supplier) => ({
                  label: supplier.supplier_name,
                  value: supplier.id,
                }))}
                disabled={!suppliers.length}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <CustomFormField
                name="price"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Sale price"
                placeholder="0.00"
                type="number"
              />
              <CustomFormField
                name="cost"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Cost price"
                placeholder="0.00"
                type="number"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <CustomFormField
                name="quantity"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Quantity"
                placeholder="0"
                type="number"
              />
              <CustomFormField
                name="batch_number"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Batch number"
                placeholder="Batch number"
              />
            </div>
            <CustomFormField
              name="expiry_date"
              control={form.control}
              fieldType={formFieldTypes.CALENDAR}
              label="Expiry date"
              placeholder="Pick expiry date"
            />
            <CustomFormField
              name="description"
              control={form.control}
              fieldType={formFieldTypes.TEXTAREA}
              label="Description"
              placeholder="Enter medicine description"
            />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading || !suppliers.length}>
                {loading ? "Saving..." : medicineToEdit ? "Update medicine" : "Add medicine"}
              </Button>
              {medicineToEdit ? (
                <Button type="button" variant="secondary" onClick={onCancelEdit}>
                  Cancel edit
                </Button>
              ) : null}
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium">
                {importing ? "Importing..." : "Import Excel"}
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  disabled={importing}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void onImport(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>Medicine inventory</CardTitle>
          <CardDescription>
            Search current stock and review the supplier attached to each medicine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={medicineSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search medicines, category, supplier..."
              className="h-11 rounded-2xl border border-input/80 bg-background/72 px-4 text-sm"
            />
            <DateFilterPicker
              value={medicineCreatedDate}
              onChange={onCreatedDateChange}
              placeholder="Filter by created date"
              allowClear
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.length ? (
                medicines.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Batch: {item.batch_number || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {DRUG_CATEGORIES.find((category) => category.value === item.category)?.name ?? item.category ?? "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{item.supplier_name}</p>
                        <p className="text-xs text-muted-foreground">{item.supplier_phone || "No phone"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const stockLevel = getStockLevel(Number(item.quantity));
                        if (Number(item.quantity) === 0) {
                          return (
                            <div className="space-y-1">
                              <Badge variant="destructive" className="font-black tracking-[0.18em]">
                                OUT
                              </Badge>
                              <p className="text-xs font-bold text-destructive">0 units left</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-1">
                            <Badge
                              variant={stockLevel === "critical" ? "destructive" : stockLevel === "low" ? "secondary" : "outline"}
                              className={stockLevel === "ok" ? "font-bold" : "font-black tracking-[0.18em]"}
                            >
                              {stockLevel === "critical" ? "CRITICAL" : stockLevel === "low" ? "LOW" : "OK"}
                            </Badge>
                            <p
                              className={
                                stockLevel === "ok"
                                  ? "text-xs font-semibold text-foreground"
                                  : "text-xs font-black uppercase tracking-wide text-foreground"
                              }
                            >
                              {item.quantity} units
                            </p>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      {(() => {
                        const expiryLevel = getExpiryLevel(item.expiry_date);
                        if (!item.expiry_date) {
                          return <span className="text-sm text-muted-foreground">No date</span>;
                        }

                        return (
                          <div className="space-y-1">
                            <Badge
                              variant={expiryLevel === "expired" ? "destructive" : expiryLevel === "soon" ? "secondary" : "outline"}
                              className={expiryLevel === "ok" ? "font-bold" : "font-black tracking-[0.18em]"}
                            >
                              {expiryLevel === "expired" ? "EXPIRED" : expiryLevel === "soon" ? "SOON" : "OK"}
                            </Badge>
                            <p
                              className={
                                expiryLevel === "ok"
                                  ? "text-xs font-semibold text-foreground"
                                  : "text-xs font-black uppercase tracking-wide text-foreground"
                              }
                            >
                              {format(parseISO(item.expiry_date), "PPP")}
                            </p>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                        Edit
                      </Button>
                      <ConfirmDeleteButton
                        title="Delete medicine?"
                        description={`Remove ${item.name} from inventory. This action cannot be undone.`}
                        onConfirm={() => onDelete(item.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No medicines found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {medicinePage} of {totalPages} ({medicineCount} total medicines)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={medicinePage <= 1}
                onClick={() => onPageChange(Math.max(1, medicinePage - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={medicinePage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, medicinePage + 1))}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-muted/30 p-4 text-sm">
            <p className="font-semibold text-foreground">Excel import format</p>
            <p className="mt-1 text-muted-foreground">
              Download the updated sample workbook to see the exact import structure. The aligned columns are:{" "}
              <span className="font-medium text-foreground">
                name, category, price, cost, quantity, batch_number, expiry_date, description, supplier_name, supplier_phone, supplier_email
              </span>.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Supplier rows are matched by supplier name and created automatically if they do not already exist.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <a href="/sample/medicines-sample.xlsx" download>
                Download sample Excel
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
