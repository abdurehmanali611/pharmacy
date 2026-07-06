"use client";

import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import { AlertTriangle, Package, Pill, Search, Upload } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
  WorkspaceStat,
} from "@/components/manager/workspace";
import { TablePagination } from "@/components/manager/TablePagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DRUG_CATEGORIES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addMedicine } from "@/lib/validations";
import type { MedicineData, SupplierData } from "@/lib/actions";

function getStockLevel(quantity: number) {
  if (quantity <= 0) return "out";
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

function ModuleHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b border-white/10 pb-5">
      <p className="display-kicker text-apex-orange/90">{kicker}</p>
      <CardTitle className="mt-2 font-display text-xl font-bold text-white">{title}</CardTitle>
      <CardDescription className="mt-1.5 text-sm leading-6 text-white/55">{description}</CardDescription>
    </CardHeader>
  );
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
  const pageSize = 4;

  let critical = 0;
  let expiring = 0;
  for (const item of medicines) {
    const stock = getStockLevel(Number(item.quantity));
    if (stock === "critical" || stock === "out") critical += 1;
    if (getExpiryLevel(item.expiry_date) === "soon" || getExpiryLevel(item.expiry_date) === "expired") {
      expiring += 1;
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <WorkspaceStat label="Total SKUs" value={String(medicineCount)} icon={Package} />
        <WorkspaceStat label="On this page" value={String(medicines.length)} tone="text-white/85" icon={Pill} />
        <WorkspaceStat
          label="Urgent stock"
          value={String(critical)}
          tone={critical > 0 ? "text-red-300" : "text-emerald-300"}
          icon={AlertTriangle}
        />
        <WorkspaceStat
          label="Expiry flags"
          value={String(expiring)}
          tone={expiring > 0 ? "text-amber-200" : "text-white/85"}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <Card className={cn(workspacePanelClass, "overflow-hidden")}>
          <ModuleHeader
            kicker={medicineToEdit ? "Edit mode" : "Inventory intake"}
            title={medicineToEdit ? "Update medicine record" : "Register new medicine"}
            description="Link each SKU to a supplier, set pricing, batch, and expiry for intelligent stock tracking."
          />
          <CardContent className="pt-6">
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

              <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                <Button type="submit" disabled={loading || !suppliers.length}>
                  {loading ? "Saving..." : medicineToEdit ? "Update medicine" : "Add medicine"}
                </Button>
                {medicineToEdit ? (
                  <Button type="button" variant="outline" className="border-white/14 bg-white/5" onClick={onCancelEdit}>
                    Cancel edit
                  </Button>
                ) : null}
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/8">
                  <Upload className="h-4 w-4 text-apex-orange-light" />
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

        <Card className={cn(workspacePanelClass, "overflow-hidden")}>
          <ModuleHeader
            kicker="Stock ledger"
            title="Medicine inventory"
            description="Search, filter, and act on stock levels and expiry urgency in real time."
          />
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  value={medicineSearch}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search medicines, category, supplier..."
                  className="h-11 border-white/12 bg-[#060e1a]/80 pl-9 text-white placeholder:text-white/35"
                />
              </div>
              <DateFilterPicker
                value={medicineCreatedDate}
                onChange={onCreatedDateChange}
                placeholder="Filter by created date"
                allowClear
              />
            </div>

            <div className={cn(workspaceInnerPanelClass, "overflow-x-auto")}>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    {["Medicine", "Category", "Supplier", "Stock", "Price", "Expiry", "Actions"].map((h) => (
                      <TableHead
                        key={h}
                        className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/45"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.length ? (
                    medicines.map((item) => (
                      <TableRow key={item.id} className="border-white/8 hover:bg-white/4">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-white/90">{item.name}</p>
                            <p className="text-xs text-white/40">Batch: {item.batch_number || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="border-white/10 bg-white/8 text-white/75">
                            {DRUG_CATEGORIES.find((c) => c.value === item.category)?.name ??
                              item.category ??
                              "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-white/85">{item.supplier_name}</p>
                            <p className="text-xs text-white/40">{item.supplier_phone || "No phone"}</p>
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
                                  <p className="text-xs font-bold text-red-300">0 units left</p>
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-1">
                                <Badge
                                  variant={
                                    stockLevel === "critical"
                                      ? "destructive"
                                      : stockLevel === "low"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={stockLevel === "ok" ? "font-bold" : "font-black tracking-[0.18em]"}
                                >
                                  {stockLevel === "critical" ? "CRITICAL" : stockLevel === "low" ? "LOW" : "OK"}
                                </Badge>
                                <p className="text-xs font-semibold text-white/70">{item.quantity} units</p>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="font-medium text-apex-orange-light">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const expiryLevel = getExpiryLevel(item.expiry_date);
                            if (!item.expiry_date) {
                              return <span className="text-sm text-white/40">No date</span>;
                            }
                            return (
                              <div className="space-y-1">
                                <Badge
                                  variant={
                                    expiryLevel === "expired"
                                      ? "destructive"
                                      : expiryLevel === "soon"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={expiryLevel === "ok" ? "font-bold" : "font-black tracking-[0.18em]"}
                                >
                                  {expiryLevel === "expired" ? "EXPIRED" : expiryLevel === "soon" ? "SOON" : "OK"}
                                </Badge>
                                <p className="text-xs font-semibold text-white/65">
                                  {format(parseISO(item.expiry_date), "PPP")}
                                </p>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/12 bg-white/5"
                            onClick={() => onEdit(item)}
                          >
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
                      <TableCell colSpan={7} className="py-12 text-center text-white/40">
                        No medicines found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              page={medicinePage}
              pageSize={pageSize}
              totalCount={medicineCount}
              onPageChange={onPageChange}
              itemLabel="medicines"
            />

            <div className={cn(workspaceInnerPanelClass, "p-4 text-sm")}>
              <p className="font-semibold text-white/85">Excel import format</p>
              <p className="mt-2 leading-6 text-white/50">
                Columns: name, category, price, cost, quantity, batch_number, expiry_date, description,
                supplier_name, supplier_phone, supplier_email. Suppliers are auto-created when missing.
              </p>
              <Button asChild variant="outline" className="mt-4 border-white/12 bg-white/5">
                <a href="/sample/medicines-sample.xlsx" download>
                  Download sample Excel
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
