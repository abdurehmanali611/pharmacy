"use client";

import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { AlertTriangle, Package, Pencil, Pill, Search, Upload } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { BatchMedicineDialog } from "@/components/manager/batch/BatchMedicineDialog";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
  WorkspaceModuleHeader,
  WorkspaceStat,
} from "@/components/manager/workspace";
import { TablePagination } from "@/components/manager/TablePagination";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { DRUG_CATEGORIES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addMedicine } from "@/lib/validations";
import type { MedicineData, SupplierData } from "@/lib/actions";

const medicineEditControlClass =
  "h-11 rounded-lg border-white/14 bg-[#111d2a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";
const medicineEditLabelClass = "text-xs font-semibold text-white/65";
const medicineEditTextareaClass =
  "h-[13.5rem] min-h-[13.5rem] resize-none rounded-lg border-white/14 bg-[#111d2a] text-sm text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";

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
  onRefresh,
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
  onRefresh: () => void | Promise<void>;
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
    <div className="space-y-6">
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

      <div className="flex flex-col gap-6">
        {medicineToEdit ? (
          <Dialog open onOpenChange={(open) => { if (!open) onCancelEdit(); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border border-white/12 bg-[#0b1420] p-0 text-white shadow-xl ring-0 sm:max-w-5xl">
              <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-teal-200">
                    <Pill className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white/45">Inventory record</p>
                    <DialogTitle className="mt-1 text-lg font-semibold text-white">Edit medicine</DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-white/60">Update product, supplier and stock details.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            <form className="grid gap-5 p-5 sm:p-6" onSubmit={form.handleSubmit(onSubmit)}>
              <section className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <CustomFormField
                    name="name"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Medicine name"
                    placeholder="Enter medicine name"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={medicineEditControlClass}
                  />
                  <div className="space-y-2">
                    <label htmlFor="medicine-category" className={medicineEditLabelClass}>Category</label>
                    <Controller
                      name="category"
                      control={form.control}
                      render={({ field }) => (
                        <Combobox
                          id="medicine-category"
                          value={field.value}
                          onChange={field.onChange}
                          options={DRUG_CATEGORIES.map((item) => ({ label: item.name, value: item.value }))}
                          placeholder="Select category"
                          searchPlaceholder="Search categories..."
                          className={medicineEditControlClass}
                        />
                      )}
                    />
                    {form.formState.errors.category ? (
                      <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="medicine-supplier" className={medicineEditLabelClass}>Supplier</label>
                    <Controller
                      name="supplier_id"
                      control={form.control}
                      render={({ field }) => (
                        <Combobox
                          id="medicine-supplier"
                          value={field.value}
                          onChange={field.onChange}
                          options={suppliers.map((supplier) => ({
                            label: supplier.supplier_name,
                            value: supplier.id,
                          }))}
                          placeholder={suppliers.length ? "Select supplier" : "Add suppliers first"}
                          searchPlaceholder="Search suppliers..."
                          disabled={!suppliers.length}
                          className={medicineEditControlClass}
                        />
                      )}
                    />
                    {form.formState.errors.supplier_id ? (
                      <p className="text-sm text-destructive">{form.formState.errors.supplier_id.message}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <CustomFormField
                    name="price"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Sale price"
                    placeholder="0.00"
                    type="number"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={medicineEditControlClass}
                  />
                  <CustomFormField
                    name="cost"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Cost price"
                    placeholder="0.00"
                    type="number"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={medicineEditControlClass}
                  />
                  <CustomFormField
                    name="quantity"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Quantity"
                    placeholder="0"
                    type="number"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={medicineEditControlClass}
                  />
                  <CustomFormField
                    name="batch_number"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Batch number"
                    placeholder="Batch number"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={medicineEditControlClass}
                  />
                  <CustomFormField
                    name="expiry_date"
                    control={form.control}
                    fieldType={formFieldTypes.CALENDAR}
                    label="Expiry date"
                    placeholder="Pick expiry date"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={`${medicineEditControlClass} w-full justify-between px-3 font-normal`}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <CustomFormField
                    name="description"
                    control={form.control}
                    fieldType={formFieldTypes.TEXTAREA}
                    label="Description"
                    placeholder="Enter medicine description"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={medicineEditTextareaClass}
                  />
                  <CustomFormField
                    name="image_url"
                    control={form.control}
                    fieldType={formFieldTypes.IMAGE_UPLOADER}
                    label="Medicine image"
                    placeholder="Upload or take a medicine photo"
                    labelClassName={medicineEditLabelClass}
                  />
                </div>
              </section>

              <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
                <Button type="button" variant="outline" className="border-white/14 bg-white/5" onClick={onCancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !suppliers.length}>
                  {loading ? "Saving..." : "Update medicine"}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="space-y-3">
            <BatchMedicineDialog suppliers={suppliers} onSuccess={onRefresh} />
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/8">
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
        )}

        <Card className={cn(workspacePanelClass, "overflow-hidden")}>
          <WorkspaceModuleHeader
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
                  className="h-11 border-white/10 bg-white/[0.035] pl-9 text-white placeholder:text-white/50 focus-visible:border-apex-orange/40 focus-visible:ring-apex-orange/20"
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
                            <div className="flex items-center gap-3">
                              <Avatar className="size-11 rounded-xl border border-apex-orange/20 bg-apex-orange/10">
                                <AvatarImage src={item.image_url || undefined} alt={`${item.name} medicine`} />
                                <AvatarFallback className="rounded-xl bg-apex-orange/10 text-xs font-bold uppercase text-apex-orange-light">
                                  {item.name
                                    .trim()
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join("") || "M"}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-medium text-white/90">{item.name}</p>
                            </div>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="border-white/12 bg-white/5"
                            onClick={() => onEdit(item)}
                            aria-label={`Edit ${item.name}`}
                            title={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDeleteButton
                            title="Delete medicine?"
                            description={`Remove ${item.name} from inventory. This action cannot be undone.`}
                            onConfirm={() => onDelete(item.id)}
                            iconOnly
                            ariaLabel={`Delete ${item.name}`}
                          />
                          </div>
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
