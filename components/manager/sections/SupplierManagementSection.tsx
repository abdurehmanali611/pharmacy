"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Mail, Pencil, Phone, Truck } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Chip, EmptyState, InitialsAvatar, ListToolbar, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import { ExportMenu } from "@/components/manager/ExportMenu";
import { SupplierMedicinesHoverDetail } from "@/components/manager/SupplierMedicinesHoverDetail";
import { BatchSupplierDialog } from "@/components/manager/batch/BatchSupplierDialog";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
} from "@/components/manager/workspace";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addSupplier } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { InvoiceData, MedicineData, SupplierData } from "@/lib/actions";

const SUPPLIER_PAGE_SIZE = 4;
const supplierEditControlClass =
  "h-11 rounded-lg border-white/14 bg-[#120f3a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";
const supplierEditLabelClass = "text-xs font-semibold text-white/65";

export function SupplierManagementSection({
  form,
  loading,
  supplierToEdit,
  suppliers,
  medicines,
  invoices,
  onSubmit,
  onRefresh,
  onCancelEdit,
  onEdit,
  onDelete,
}: {
  form: UseFormReturn<z.infer<typeof addSupplier>>;
  loading: boolean;
  supplierToEdit: SupplierData | null;
  suppliers: SupplierData[];
  medicines: MedicineData[];
  invoices: InvoiceData[];
  onSubmit: (data: z.infer<typeof addSupplier>) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onCancelEdit: () => void;
  onEdit: (supplier: SupplierData) => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredSuppliers = suppliers.filter((supplier) => {
    const hasMedicines = medicines.some((m) => m.supplier_name === supplier.supplier_name);
    const hasInvoices = invoices.some((i) => i.supplier_name === supplier.supplier_name);
    if (filter === "medicines" && !hasMedicines) return false;
    if (filter === "invoices" && !hasInvoices) return false;
    if (filter === "unlinked" && (hasMedicines || hasInvoices)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [supplier.supplier_name, supplier.supplier_phone, supplier.supplier_email]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q));
  });
  const { items: pagedSuppliers, safePage, totalCount } = paginateItems(filteredSuppliers, page, SUPPLIER_PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="flex flex-col gap-6">
      {supplierToEdit ? (
        <Dialog open onOpenChange={(open) => { if (!open) onCancelEdit(); }}>
          <DialogContent className="max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto p-0 text-white sm:max-w-3xl">
            <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14">
              <div className="flex items-center gap-3">
                <span className="tint-icon tint-teal flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Truck className="size-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-bold text-white">Edit supplier</DialogTitle>
                  <DialogDescription className="mt-0.5 text-sm text-white/60">Update the supplier profile and contact details.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form className="grid gap-5 p-5 sm:p-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-3 md:grid-cols-[1.45fr_0.95fr]">
                <CustomFormField
                  name="supplier_name"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Supplier name"
                  placeholder="Enter supplier name"
                  labelClassName={supplierEditLabelClass}
                  inputClassName={supplierEditControlClass}
                />
                <CustomFormField
                  name="supplier_phone"
                  control={form.control}
                  fieldType={formFieldTypes.PHONE_INPUT}
                  label="Supplier phone"
                  placeholder="Enter supplier phone"
                  labelClassName={supplierEditLabelClass}
                  inputClassName={supplierEditControlClass}
                />
              </div>
              <CustomFormField
                name="supplier_email"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Supplier email"
                placeholder="Enter supplier email"
                type="email"
                labelClassName={supplierEditLabelClass}
                inputClassName={supplierEditControlClass}
              />
              <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
                <Button type="button" variant="outline" className="border-white/14 bg-white/5" onClick={onCancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Update supplier"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : (
        <BatchSupplierDialog onSuccess={onRefresh} />
      )}

      <Card className={cn(workspacePanelClass, "overflow-hidden p-0")}>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionTitle
            icon={Truck}
            tint="teal"
            title="Supplier records"
            subtitle={`Showing ${filteredSuppliers.length} of ${suppliers.length} · each supplier shows linked medicines and invoices`}
            right={
              <ExportMenu
                pdf={false}
                build={() => ({
                  fileName: "suppliers",
                  title: "Suppliers",
                  subtitle: `${filteredSuppliers.length} supplier${filteredSuppliers.length === 1 ? "" : "s"} in the current view`,
                  sections: [
                    {
                      name: "Suppliers",
                      columns: [
                        { header: "Supplier" },
                        { header: "Phone" },
                        { header: "Email" },
                        { header: "Medicines", kind: "number" },
                        { header: "Invoices", kind: "number" },
                        { header: "Unpaid invoices", kind: "money" },
                      ],
                      rows: filteredSuppliers.map((sup) => {
                        const theirInvoices = invoices.filter((i) => i.supplier_name === sup.supplier_name);
                        return [
                          sup.supplier_name,
                          sup.supplier_phone,
                          sup.supplier_email,
                          medicines.filter((m) => m.supplier_name === sup.supplier_name).length,
                          theirInvoices.length,
                          theirInvoices.filter((i) => i.invoice_status === "unpaid").reduce((sum, i) => sum + Number(i.invoice_amount || 0), 0),
                        ];
                      }),
                    },
                  ],
                })}
              />
            }
          />
          <ListToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search supplier, phone or email…"
            filterValue={filter}
            onFilterChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
            filterPlaceholder="Filter suppliers…"
            filterOptions={[
              { value: "all", label: "All suppliers" },
              { value: "medicines", label: "With medicines" },
              { value: "invoices", label: "With invoices" },
              { value: "unlinked", label: "No linked records" },
            ]}
          />
          <div className={cn(workspaceInnerPanelClass, "overflow-x-auto")}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {["Supplier", "Contact", "Medicines", "Invoices", "Actions"].map((header) => (
                  <TableHead key={header} className={tableHeadClass}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSuppliers.length ? (
                pagedSuppliers.map((supplier) => {
                  const supplierMedicines = medicines.filter((medicine) => medicine.supplier_name === supplier.supplier_name);
                  const supplierInvoices = invoices.filter((invoice) => invoice.supplier_name === supplier.supplier_name);

                  return (
                    <TableRow key={supplier.id} className="border-white/8">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={supplier.supplier_name} />
                          <p className="truncate font-bold text-white">{supplier.supplier_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-white/90">
                            <Phone className="size-3.5 text-cyan-300" />
                            {supplier.supplier_phone || "No phone"}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-white/55">
                            <Mail className="size-3.5 text-pink-300" />
                            {supplier.supplier_email || "No email"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SupplierMedicinesHoverDetail
                          supplier={supplier}
                          medicines={supplierMedicines}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip seed={supplierInvoices.length ? "invoice" : "none"} className={supplierInvoices.length ? "" : "border-white/20 bg-white/8 text-white/60"}>
                          {supplierInvoices.length} {supplierInvoices.length === 1 ? "invoice" : "invoices"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => onEdit(supplier)}
                            aria-label={`Edit ${supplier.supplier_name}`}
                            title={`Edit ${supplier.supplier_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDeleteButton
                            title="Delete supplier?"
                            description={`Delete ${supplier.supplier_name}. Medicines already linked to it may lose that supplier reference later if you rework records.`}
                            onConfirm={() => onDelete(supplier.id)}
                            iconOnly
                            ariaLabel={`Delete ${supplier.supplier_name}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-4">
                    <EmptyState
                      icon={Truck}
                      tint="teal"
                      title={suppliers.length ? "No suppliers match" : "No suppliers added yet"}
                      description={suppliers.length ? "Try another search or filter." : "Add your first supplier above to see it here."}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {totalCount > 0 ? (
            <TablePagination
              page={safePage}
              pageSize={SUPPLIER_PAGE_SIZE}
              totalCount={totalCount}
              onPageChange={setPage}
              itemLabel="suppliers"
            />
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
}
