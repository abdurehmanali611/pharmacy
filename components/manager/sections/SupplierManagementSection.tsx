"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addSupplier } from "@/lib/validations";
import type { InvoiceData, MedicineData, SupplierData } from "@/lib/actions";

export function SupplierManagementSection({
  form,
  loading,
  supplierToEdit,
  suppliers,
  medicines,
  invoices,
  onSubmit,
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
  onCancelEdit: () => void;
  onEdit: (supplier: SupplierData) => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>{supplierToEdit ? "Edit supplier" : "Add supplier"}</CardTitle>
          <CardDescription>Create suppliers once, then select them directly from medicine and invoice forms.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <CustomFormField
              name="supplier_name"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Supplier name"
              placeholder="Enter supplier name"
            />
            <CustomFormField
              name="supplier_phone"
              control={form.control}
              fieldType={formFieldTypes.PHONE_INPUT}
              label="Supplier phone"
              placeholder="Enter supplier phone"
            />
            <CustomFormField
              name="supplier_email"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Supplier email"
              placeholder="Enter supplier email"
              type="email"
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : supplierToEdit ? "Update supplier" : "Add supplier"}
              </Button>
              {supplierToEdit ? (
                <Button type="button" variant="secondary" onClick={onCancelEdit}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>Supplier records</CardTitle>
          <CardDescription>Each supplier shows linked medicines and invoices for quick reporting.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Medicines</TableHead>
                <TableHead>Invoices</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length ? (
                suppliers.map((supplier) => {
                  const supplierMedicines = medicines.filter((medicine) => medicine.supplier_name === supplier.supplier_name);
                  const supplierInvoices = invoices.filter((invoice) => invoice.supplier_name === supplier.supplier_name);

                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{supplier.supplier_phone}</p>
                          <p className="text-xs text-muted-foreground">{supplier.supplier_email || "No email"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{supplierMedicines.length} medicine(s)</p>
                          <p className="text-xs text-muted-foreground">
                            {supplierMedicines.slice(0, 3).map((medicine) => medicine.name).join(", ") || "None yet"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{supplierInvoices.length}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(supplier)}>
                          Edit
                        </Button>
                        <ConfirmDeleteButton
                          title="Delete supplier?"
                          description={`Delete ${supplier.supplier_name}. Medicines already linked to it may lose that supplier reference later if you rework records.`}
                          onConfirm={() => onDelete(supplier.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No suppliers added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
