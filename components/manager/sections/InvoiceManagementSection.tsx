"use client";

import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { addInvoice } from "@/lib/validations";
import type { InvoiceData, SupplierData } from "@/lib/actions";

export function InvoiceManagementSection({
  form,
  loading,
  invoiceToEdit,
  invoices,
  suppliers,
  onSubmit,
  onCancelEdit,
  onEdit,
  onDelete,
}: {
  form: UseFormReturn<z.infer<typeof addInvoice>>;
  loading: boolean;
  invoiceToEdit: InvoiceData | null;
  invoices: InvoiceData[];
  suppliers: SupplierData[];
  onSubmit: (data: z.infer<typeof addInvoice>) => void | Promise<void>;
  onCancelEdit: () => void;
  onEdit: (invoice: InvoiceData) => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
      <Card className="rounded-3xl p-6">
        <CardHeader>
          <CardTitle>{invoiceToEdit ? "Edit invoice" : "Add invoice"}</CardTitle>
          <CardDescription>Track supplier and sales invoices with payment status and supporting image.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <CustomFormField
                name="invoice_number"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Invoice number"
                placeholder="Invoice number"
              />
              <CustomFormField
                name="supplier_id"
                control={form.control}
                fieldType={formFieldTypes.SELECT}
                label="Supplier"
                placeholder="Select supplier"
                options={suppliers.map((supplier) => ({
                  label: supplier.supplier_name,
                  value: supplier.id,
                }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <CustomFormField
                name="invoice_date"
                control={form.control}
                fieldType={formFieldTypes.CALENDAR}
                label="Invoice date"
                placeholder="Pick invoice date"
              />
              <CustomFormField
                name="invoice_amount"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Invoice amount"
                placeholder="0.00"
                type="number"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <CustomFormField
                name="invoice_status"
                control={form.control}
                fieldType={formFieldTypes.SELECT}
                label="Status"
                placeholder="Select status"
                options={[
                  { label: "Paid", value: "paid" },
                  { label: "Unpaid", value: "unpaid" },
                ]}
              />
              <CustomFormField
                name="invoice_type"
                control={form.control}
                fieldType={formFieldTypes.SELECT}
                label="Type"
                placeholder="Select type"
                options={[
                  { label: "Purchase", value: "purchase" },
                  { label: "Sale", value: "sale" },
                ]}
              />
              <CustomFormField
                name="invoice_payment_method"
                control={form.control}
                fieldType={formFieldTypes.SELECT}
                label="Payment method"
                placeholder="Select payment method"
                options={[
                  { label: "Cash", value: "Cash" },
                  { label: "Bank", value: "Bank" },
                  { label: "Credit", value: "Credit" },
                ]}
              />
            </div>
            <CustomFormField
              name="invoice_image"
              control={form.control}
              fieldType={formFieldTypes.IMAGE_UPLOADER}
              label="Invoice image"
              placeholder="Upload invoice image"
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : invoiceToEdit ? "Update invoice" : "Add invoice"}
              </Button>
              {invoiceToEdit ? (
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
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Add, edit, and delete invoices with supplier linkage where needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{invoice.invoice_type} via {invoice.invoice_payment_method}</p>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.supplier_name || "No supplier"}</TableCell>
                    <TableCell>{format(parseISO(invoice.invoice_date), "PPP")}</TableCell>
                    <TableCell>{formatCurrency(invoice.invoice_amount)}</TableCell>
                    <TableCell className="capitalize">{invoice.invoice_status}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(invoice)}>
                        Edit
                      </Button>
                      <ConfirmDeleteButton
                        title="Delete invoice?"
                        description={`Delete invoice ${invoice.invoice_number}. This action cannot be undone.`}
                        onConfirm={() => onDelete(invoice.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No invoices added yet.
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
