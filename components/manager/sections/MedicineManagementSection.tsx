"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { BadgeCheck, PackageX, Pencil, Pill, Upload, Wallet, X } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { Chip, EmptyState, ListToolbar, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import { ExportMenu } from "@/components/manager/ExportMenu";
import { BatchMedicineDialog } from "@/components/manager/batch/BatchMedicineDialog";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
} from "@/components/manager/workspace";
import { StockLossDialog } from "@/components/manager/StockLossDialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { MEDICINE_UNITS, quantityWithUnit, unitLabel } from "@/lib/medicineUnits";
import { PackSellingPanel } from "@/components/manager/PackSellingPanel";
import { isSplittable, stockText } from "@/lib/packSelling";
import { DRUG_CATEGORIES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addMedicine } from "@/lib/validations";
import type { MedicineData, SupplierData } from "@/lib/actions";

const medicineEditControlClass =
  "h-11 rounded-lg border-white/14 bg-[#120f3a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";
const medicineEditLabelClass = "text-xs font-semibold text-white/65";
const medicineEditTextareaClass =
  "h-[13.5rem] min-h-[13.5rem] resize-none rounded-lg border-white/14 bg-[#120f3a] text-sm text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";

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

function PaidSummary({ received, cost, paid }: { received: number; cost: number; paid: number }) {
  const total = Math.max(0, received) * cost;
  const over = paid - total > 0.005;
  const due = Math.max(0, total - paid);
  return (
    <div className="space-y-1.5 text-sm">
      <p className="text-white/70">
        Total cost <span className="font-bold text-white">{formatCurrency(total)}</span>
        <span className="text-white/45"> ({Math.max(0, received)} received × {formatCurrency(cost)})</span>
      </p>
      {over ? (
        <p className="font-bold text-rose-300">Paid amount cannot be more than the total cost.</p>
      ) : due > 0.005 ? (
        <p className="font-bold text-rose-200">On credit · {formatCurrency(due)} still to pay</p>
      ) : (
        <p className="font-bold text-emerald-300">Fully paid</p>
      )}
    </div>
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
  exportMedicines,
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
  /** Every medicine (not just this page), used for the Excel export. */
  exportMedicines?: MedicineData[];
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

  // Selection is keyed by id and keeps the medicine, so batch actions work across pages.
  const [selected, setSelected] = useState<Record<string, MedicineData>>({});
  const [lossDialog, setLossDialog] = useState<{ items: MedicineData[] } | null>(
    null,
  );
  const selectedItems = useMemo(() => Object.values(selected), [selected]);

  // Whether the edit dialog's "sell loose" panel is switched on.
  const [splitOn, setSplitOn] = useState(false);
  useEffect(() => {
    setSplitOn(Number(medicineToEdit?.pack_size ?? 1) > 1);
  }, [medicineToEdit?.id, medicineToEdit?.pack_size]);
  const pageSelectedCount = medicines.filter((item) => selected[String(item.id)]).length;
  const allPageSelected = medicines.length > 0 && pageSelectedCount === medicines.length;

  const toggleOne = (item: MedicineData, checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[String(item.id)] = item;
      else delete next[String(item.id)];
      return next;
    });

  const togglePage = (checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev };
      for (const item of medicines) {
        if (checked) next[String(item.id)] = item;
        else delete next[String(item.id)];
      }
      return next;
    });

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-6">
        {medicineToEdit ? (
          <Dialog open onOpenChange={(open) => { if (!open) onCancelEdit(); }}>
            <DialogContent className="max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto p-0 text-white sm:max-w-5xl">
              <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14">
                <div className="flex items-center gap-3">
                  <span className="tint-icon tint-emerald flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Pill className="size-5" />
                  </span>
                  <div>
                    <DialogTitle className="font-display text-xl font-bold text-white">Edit medicine</DialogTitle>
                    <DialogDescription className="mt-0.5 text-sm text-white/60">Update product, supplier and stock details.</DialogDescription>
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
                  <div className="space-y-2">
                    <label htmlFor="quantity" className={medicineEditLabelClass}>Quantity &amp; unit</label>
                    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-2">
                      <CustomFormField
                        name="quantity"
                        control={form.control}
                        fieldType={formFieldTypes.INPUT}
                        placeholder="0"
                        type="number"
                        inputClassName={medicineEditControlClass}
                      />
                      <Controller
                        name="unit"
                        control={form.control}
                        render={({ field }) => (
                          <Combobox
                            id="medicine-unit"
                            value={field.value}
                            onChange={field.onChange}
                            options={MEDICINE_UNITS.map((u) => ({ label: u.label, value: u.value }))}
                            placeholder="Unit"
                            searchPlaceholder="Search units..."
                            className={medicineEditControlClass}
                          />
                        )}
                      />
                    </div>
                    {form.formState.errors.unit ? (
                      <p className="text-sm text-destructive">{form.formState.errors.unit.message}</p>
                    ) : null}
                  </div>
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
                  <CustomFormField
                    name="paid_amount"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Paid amount"
                    placeholder="0.00"
                    type="number"
                    labelClassName={medicineEditLabelClass}
                    inputClassName={medicineEditControlClass}
                  />
                </div>
                <PackSellingPanel
                  enabled={splitOn}
                  onEnabledChange={(on) => {
                    setSplitOn(on);
                    if (on) {
                      const current = Number(form.getValues("pack_size") ?? 1);
                      form.setValue("pack_size", current > 1 ? current : 10, { shouldDirty: true });
                      form.setValue("loose_unit", form.getValues("loose_unit") || "tablet", { shouldDirty: true });
                    } else {
                      form.setValue("pack_size", 1, { shouldDirty: true });
                      form.setValue("loose_unit", "", { shouldDirty: true });
                      form.setValue("loose_price", null, { shouldDirty: true });
                    }
                  }}
                  packSize={form.watch("pack_size") != null ? String(form.watch("pack_size")) : ""}
                  onPackSizeChange={(v) => form.setValue("pack_size", v === "" ? undefined : Math.floor(Number(v)), { shouldDirty: true })}
                  looseUnit={form.watch("loose_unit") ?? ""}
                  onLooseUnitChange={(v) => form.setValue("loose_unit", v, { shouldDirty: true })}
                  loosePrice={form.watch("loose_price") != null ? String(form.watch("loose_price")) : ""}
                  onLoosePriceChange={(v) => form.setValue("loose_price", v === "" ? null : Number(v), { shouldDirty: true })}
                  packLabel={unitLabel(form.watch("unit")).toLowerCase()}
                  salePrice={Number(form.watch("price") || 0)}
                  cost={Number(form.watch("cost") || 0)}
                  inputClassName={medicineEditControlClass}
                  labelClassName={medicineEditLabelClass}
                />
                <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/6 p-4">
                  <PaidSummary
                    received={Number(medicineToEdit.received_quantity ?? medicineToEdit.quantity) + (Number(form.watch("quantity") || 0) - Number(medicineToEdit.quantity))}
                    cost={Number(form.watch("cost") || 0)}
                    paid={Number(form.watch("paid_amount") ?? 0)}
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
          <CardContent className="space-y-5 p-5 sm:p-6">
            <SectionTitle
              icon={Pill}
              tint="emerald"
              title="Medicine inventory"
              subtitle="Search, filter and act on stock and expiry"
              right={
                <ExportMenu
                  pdf={false}
                  build={() => {
                    const list = exportMedicines ?? medicines;
                    return {
                      fileName: "medicines",
                      title: "Medicine inventory",
                      subtitle: `${list.length} stock line${list.length === 1 ? "" : "s"}`,
                      sections: [
                        {
                          name: "Medicines",
                          columns: [
                            { header: "Medicine" },
                            { header: "Category" },
                            { header: "Supplier" },
                            { header: "Batch" },
                            { header: "In stock", kind: "number" },
                            { header: "Unit" },
                            { header: "Pack size", kind: "number" },
                            { header: "Loose stock", kind: "number" },
                            { header: "Received", kind: "number" },
                            { header: "Cost price", kind: "money" },
                            { header: "Sale price", kind: "money" },
                            { header: "Total cost", kind: "money" },
                            { header: "Paid", kind: "money" },
                            { header: "Credit owed", kind: "money" },
                            { header: "Expiry" },
                          ],
                          rows: list.map((m) => [
                            m.name,
                            m.category ?? "",
                            m.supplier_name ?? "",
                            m.batch_number ?? "",
                            Number(m.quantity || 0),
                            unitLabel(m.unit),
                            Number(m.pack_size ?? 1),
                            Number(m.loose_stock ?? 0),
                            Number(m.received_quantity ?? m.quantity ?? 0),
                            Number(m.cost || 0),
                            Number(m.price || 0),
                            Number(m.total_cost ?? 0),
                            Number(m.paid_amount ?? 0),
                            Number(m.credit_amount ?? 0),
                            String(m.expiry_date ?? "").slice(0, 10),
                          ]),
                        },
                      ],
                    };
                  }}
                />
              }
            />
            <ListToolbar
              search={medicineSearch}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search medicines, category, supplier…"
              extra={
                <DateFilterPicker
                  value={medicineCreatedDate}
                  onChange={onCreatedDateChange}
                  placeholder="Filter by created date"
                  allowClear
                />
              }
            />

            {selectedItems.length ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-apex-orange/25 bg-apex-orange/8 px-3 py-2.5">
                <p className="mr-auto text-sm font-semibold text-white/85">
                  {selectedItems.length} selected
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setLossDialog({ items: selectedItems })}
                >
                  <PackageX className="mr-1.5 h-4 w-4 text-amber-300" />
                  Damaged / Wasted
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-white/65"
                  onClick={() => setSelected({})}
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            ) : null}

            <div className={cn(workspaceInnerPanelClass, "overflow-x-auto")}>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allPageSelected ? true : pageSelectedCount ? "indeterminate" : false}
                        disabled={!medicines.length}
                        onCheckedChange={(checked) => togglePage(checked === true)}
                        aria-label="Select all medicines on this page"
                      />
                    </TableHead>
                    {["Medicine", "Category", "Supplier", "Stock", "Payment", "Price", "Expiry", "Actions"].map((h) => (
                      <TableHead key={h} className={tableHeadClass}>
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.length ? (
                    medicines.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border-white/8"
                        data-state={selected[String(item.id)] ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={Boolean(selected[String(item.id)])}
                            onCheckedChange={(checked) => toggleOne(item, checked === true)}
                            aria-label={`Select ${item.name}`}
                          />
                        </TableCell>
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
                          <Chip seed={item.category || "other"}>
                            {DRUG_CATEGORIES.find((c) => c.value === item.category)?.name ??
                              item.category ??
                              "Uncategorized"}
                          </Chip>
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
                                  <Badge variant="destructive" className="font-bold tracking-[0.18em]">
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
                                  className={stockLevel === "ok" ? "font-bold" : "font-bold tracking-[0.18em]"}
                                >
                                  {stockLevel === "critical" ? "CRITICAL" : stockLevel === "low" ? "LOW" : "OK"}
                                </Badge>
                                <p className="text-xs font-semibold text-white/70">{isSplittable(item) ? stockText(item) : quantityWithUnit(item.quantity, item.unit)}</p>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {item.payment_status === "credit" ? (
                            <div className="space-y-1">
                              <Chip className="border-rose-300/45 bg-rose-400/15 text-rose-200">
                                <Wallet className="size-3" />
                                On credit
                              </Chip>
                              <p className="text-xs font-semibold tabular-nums text-rose-200">
                                {formatCurrency(Number(item.credit_amount ?? 0))} due
                              </p>
                            </div>
                          ) : (
                            <Chip className="border-emerald-300/45 bg-emerald-400/15 text-emerald-200">
                              <BadgeCheck className="size-3" />
                              Fully paid
                            </Chip>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-xl border border-emerald-300/40 bg-[linear-gradient(135deg,rgba(52,211,153,0.22),rgba(34,211,238,0.18))] px-3 py-1 font-display text-sm font-bold tabular-nums text-white">
                            {formatCurrency(item.price)}
                          </span>
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
                                  className={expiryLevel === "ok" ? "font-bold" : "font-bold tracking-[0.18em]"}
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
                             
                            onClick={() => onEdit(item)}
                            aria-label={`Edit ${item.name}`}
                            title={`Edit ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            disabled={Number(item.quantity) <= 0}
                            onClick={() => setLossDialog({ items: [item] })}
                            aria-label={`Register ${item.name} as damaged or wasted`}
                            title="Damaged / Wasted"
                          >
                            <PackageX className="h-4 w-4 text-amber-300" />
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
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="p-4">
                        <EmptyState
                          icon={Pill}
                          tint="emerald"
                          title="No medicines found"
                          description="Try another search or add stock above."
                        />
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
                Columns: name, category, price, cost, quantity, batch_number, expiry_date, description, supplier_name, supplier_phone, supplier_email. Missing suppliers are created for you.
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

      <StockLossDialog
        open={lossDialog !== null}
        medicines={lossDialog?.items ?? []}
        onClose={() => setLossDialog(null)}
        onSuccess={async () => {
          setSelected({});
          await onRefresh();
        }}
      />
    </div>
  );
}
