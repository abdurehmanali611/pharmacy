"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FileText, Package, Pencil, Phone, Users2 } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { SupplierMedicinesHoverDetail } from "@/components/manager/SupplierMedicinesHoverDetail";
import { BatchSupplierDialog } from "@/components/manager/batch/BatchSupplierDialog";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
  WorkspaceModuleHeader,
  WorkspaceStat,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addSupplier } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { InvoiceData, MedicineData, SupplierData } from "@/lib/actions";

const SUPPLIER_PAGE_SIZE = 4;
const supplierEditControlClass =
  "h-11 rounded-lg border-white/14 bg-[#111d2a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";
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
  const { items: pagedSuppliers, safePage, totalCount } = paginateItems(suppliers, page, SUPPLIER_PAGE_SIZE);

  const supplierNames = new Set(suppliers.map((supplier) => supplier.supplier_name));
  const linkedMedicines = medicines.filter((medicine) => supplierNames.has(medicine.supplier_name)).length;
  const linkedInvoices = invoices.filter(
    (invoice) => !!invoice.supplier_name && supplierNames.has(invoice.supplier_name),
  ).length;

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <WorkspaceStat label="Total suppliers" value={String(suppliers.length)} icon={Users2} />
        <WorkspaceStat label="On this page" value={String(pagedSuppliers.length)} tone="text-white/85" icon={Phone} />
        <WorkspaceStat
          label="Linked medicines"
          value={String(linkedMedicines)}
          tone={linkedMedicines > 0 ? "text-teal-200" : "text-white/85"}
          icon={Package}
        />
        <WorkspaceStat
          label="Linked invoices"
          value={String(linkedInvoices)}
          tone={linkedInvoices > 0 ? "text-apex-orange-light" : "text-white/85"}
          icon={FileText}
        />
      </div>
      {supplierToEdit ? (
        <Dialog open onOpenChange={(open) => { if (!open) onCancelEdit(); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border border-white/12 bg-[#0b1420] p-0 text-white shadow-xl ring-0 sm:max-w-3xl">
            <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-teal-200">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5v9A2.5 2.5 0 0 1 14.5 19h-5A2.5 2.5 0 0 1 7 16.5v-9Z"/>
                    <path d="M9 9.5h6M9 13h6"/>
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-white/45">Supplier record</p>
                  <DialogTitle className="mt-1 text-lg font-semibold text-white">Edit supplier</DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-white/60">Update the supplier profile and contact details.</DialogDescription>
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
        <WorkspaceModuleHeader
          kicker="Directory"
          title="Supplier records"
          description="Each supplier shows linked medicines and invoices for quick reporting."
        />
        <CardContent className="space-y-4 pt-6">
          <div className={cn(workspaceInnerPanelClass, "overflow-x-auto")}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {["Supplier", "Contact", "Medicines", "Invoices", "Actions"].map((header) => (
                  <TableHead
                    key={header}
                    className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/45"
                  >
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
                    <TableRow key={supplier.id} className="border-white/8 hover:bg-white/4">
                      <TableCell className="font-medium text-white/90">{supplier.supplier_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-white/85">{supplier.supplier_phone}</p>
                          <p className="text-xs text-white/40">{supplier.supplier_email || "No email"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SupplierMedicinesHoverDetail
                          supplier={supplier}
                          medicines={supplierMedicines}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-white/10 bg-white/8 text-white/75">
                          {supplierInvoices.length} {supplierInvoices.length === 1 ? "invoice" : "invoices"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="border-white/12 bg-white/5"
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
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-white/40">
                    No suppliers added yet.
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
