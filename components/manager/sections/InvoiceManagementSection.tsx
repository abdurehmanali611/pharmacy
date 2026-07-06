"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import { Banknote, FileText, Receipt, Wallet } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
  WorkspaceStat,
} from "@/components/manager/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { addInvoice } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { InvoiceData, SupplierData } from "@/lib/actions";

const INVOICE_PAGE_SIZE = 10;

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

function FormSection({
  kicker,
  title,
  children,
  className,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(workspaceInnerPanelClass, "p-4 sm:p-5", className)}>
      <div className="mb-4 border-b border-white/8 pb-3">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-apex-orange-light/80">{kicker}</p>
        <p className="mt-1 text-sm font-semibold text-white/85">{title}</p>
      </div>
      {children}
    </div>
  );
}

function PaymentClassificationFields({
  form,
}: {
  form: UseFormReturn<z.infer<typeof addInvoice>>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CustomFormField
          name="invoice_status"
          control={form.control}
          fieldType={formFieldTypes.SELECT}
          label="Payment status"
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
          label="Invoice type"
          placeholder="Select type"
          options={[
            { label: "Purchase", value: "purchase" },
            { label: "Sale", value: "sale" },
          ]}
        />
      </div>

      <div className="relative pt-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]"
        />
        <div className="mx-auto w-full max-w-xs pt-4 sm:max-w-sm">
          <CustomFormField
            name="invoice_payment_method"
            control={form.control}
            fieldType={formFieldTypes.SELECT}
            label="Payment method"
            placeholder="Select method"
            options={[
              { label: "Cash", value: "Cash" },
              { label: "Bank", value: "Bank" },
              { label: "Credit", value: "Credit" },
            ]}
            className="items-center **:data-[slot=field-label]:text-center"
          />
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const isPaid = status === "paid";
  return (
    <Badge
      variant={isPaid ? "outline" : "destructive"}
      className={cn(
        "font-black uppercase tracking-[0.16em]",
        isPaid && "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      )}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </Badge>
  );
}

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
  const paidInvoices = invoices.filter((invoice) => invoice.invoice_status === "paid");
  const unpaidInvoices = invoices.filter((invoice) => invoice.invoice_status === "unpaid");
  const unpaidTotal = unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.invoice_amount), 0);
  const watchedAmount = form.watch("invoice_amount");
  const watchedStatus = form.watch("invoice_status");
  const previewAmount = Number(watchedAmount) || 0;
  const [page, setPage] = useState(1);
  const { items: pagedInvoices, safePage, totalCount } = paginateItems(invoices, page, INVOICE_PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <WorkspaceStat label="Total invoices" value={String(invoices.length)} icon={FileText} />
        <WorkspaceStat
          label="Paid"
          value={String(paidInvoices.length)}
          tone="text-emerald-300"
          icon={Receipt}
        />
        <WorkspaceStat
          label="Unpaid"
          value={String(unpaidInvoices.length)}
          tone={unpaidInvoices.length > 0 ? "text-amber-200" : "text-white/85"}
          icon={Wallet}
        />
        <WorkspaceStat
          label="Unpaid balance"
          value={formatCurrency(unpaidTotal)}
          tone={unpaidTotal > 0 ? "text-apex-orange-light" : "text-white/85"}
          icon={Banknote}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Card className={cn(workspacePanelClass, "overflow-hidden")}>
          <ModuleHeader
            kicker={invoiceToEdit ? "Edit mode" : "Billing intake"}
            title={invoiceToEdit ? "Update invoice record" : "Register new invoice"}
            description="Capture supplier bills and sales receipts with payment status, method, and supporting document."
          />
          <CardContent className="space-y-4 pt-6">
            <div
              className={cn(
                workspaceInnerPanelClass,
                "flex items-center justify-between gap-4 border-apex-orange/20 bg-apex-orange/6 p-4",
              )}
            >
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/40">Live preview</p>
                <p className="mt-1 font-display text-2xl font-bold text-apex-orange-light">
                  {formatCurrency(previewAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/40">Status</p>
                <div className="mt-1.5">{statusBadge(watchedStatus || "unpaid")}</div>
              </div>
            </div>

            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormSection kicker="Step 1" title="Invoice identity">
                <div className="grid gap-4 md:grid-cols-2">
                  <CustomFormField
                    name="invoice_number"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Invoice number"
                    placeholder="e.g. INV-2026-0042"
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
              </FormSection>

              <FormSection kicker="Step 2" title="Amount & date">
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
              </FormSection>

              <FormSection kicker="Step 3" title="Payment & classification">
                <PaymentClassificationFields form={form} />
              </FormSection>

              <FormSection kicker="Step 4" title="Supporting document">
                <div className="mx-auto w-full max-w-md">
                  <CustomFormField
                    name="invoice_image"
                    control={form.control}
                    fieldType={formFieldTypes.IMAGE_UPLOADER}
                    label="Invoice image"
                    placeholder="Upload invoice scan or receipt photo"
                    className="items-center **:data-[slot=field-label]:text-center"
                  />
                </div>
              </FormSection>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
                <Button type="submit" className="w-full" disabled={loading || !suppliers.length}>
                  {loading ? "Saving..." : invoiceToEdit ? "Update invoice" : "Add invoice"}
                </Button>
                {invoiceToEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/14 bg-white/5"
                    onClick={onCancelEdit}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className={cn(workspacePanelClass, "overflow-hidden")}>
          <ModuleHeader
            kicker="Billing ledger"
            title="Invoice records"
            description="Review supplier and sales invoices with payment status at a glance."
          />
          <CardContent className="space-y-4 pt-6">
            <div className={cn(workspaceInnerPanelClass, "overflow-x-auto")}>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    {["Invoice", "Supplier", "Date", "Amount", "Status", "Actions"].map((header) => (
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
                  {pagedInvoices.length ? (
                    pagedInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-white/8 hover:bg-white/4">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-white/90">{invoice.invoice_number}</p>
                            <p className="text-xs capitalize text-white/40">
                              {invoice.invoice_type} · {invoice.invoice_payment_method}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">{invoice.supplier_name || "No supplier"}</TableCell>
                        <TableCell className="text-white/70">
                          {format(parseISO(invoice.invoice_date), "PPP")}
                        </TableCell>
                        <TableCell className="font-medium text-apex-orange-light">
                          {formatCurrency(invoice.invoice_amount)}
                        </TableCell>
                        <TableCell>{statusBadge(invoice.invoice_status)}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" className="border-white/14 bg-white/5" onClick={() => onEdit(invoice)}>
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
                      <TableCell colSpan={6} className="py-10 text-center text-white/45">
                        No invoices added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalCount > 0 ? (
              <TablePagination
                page={safePage}
                pageSize={INVOICE_PAGE_SIZE}
                totalCount={totalCount}
                onPageChange={setPage}
                itemLabel="invoices"
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
