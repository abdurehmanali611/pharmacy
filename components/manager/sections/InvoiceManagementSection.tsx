"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Banknote, FileText, Pencil, Receipt, Wallet } from "lucide-react";
import Image from "next/image";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import { BatchInvoiceDialog } from "@/components/manager/batch/BatchInvoiceDialog";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
  WorkspaceModuleHeader,
  WorkspaceStat,
} from "@/components/manager/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { addInvoice } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { InvoiceData, SupplierData } from "@/lib/actions";

const INVOICE_PAGE_SIZE = 10;

const radioCardClass =
  "flex min-h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-[#e8951e]/12 bg-white/[0.035] px-3 py-2 text-center transition has-[[data-state=checked]]:ring-2";
const radioLabelClass = "flex items-center justify-center text-center text-xs font-bold";

const radioToneClass = {
  teal: "has-[[data-state=checked]]:border-teal-400 has-[[data-state=checked]]:bg-teal-400/15 has-[[data-state=checked]]:ring-teal-400/45",
  orange:
    "has-[[data-state=checked]]:border-apex-orange has-[[data-state=checked]]:bg-apex-orange/15 has-[[data-state=checked]]:ring-apex-orange/45",
  emerald:
    "has-[[data-state=checked]]:border-emerald-400 has-[[data-state=checked]]:bg-emerald-400/15 has-[[data-state=checked]]:ring-emerald-400/45",
  red: "has-[[data-state=checked]]:border-red-400 has-[[data-state=checked]]:bg-red-400/15 has-[[data-state=checked]]:ring-red-400/45",
  blue: "has-[[data-state=checked]]:border-sky-400 has-[[data-state=checked]]:bg-sky-400/15 has-[[data-state=checked]]:ring-sky-400/45",
  amber:
    "has-[[data-state=checked]]:border-amber-400 has-[[data-state=checked]]:bg-amber-400/15 has-[[data-state=checked]]:ring-amber-400/45",
  purple:
    "has-[[data-state=checked]]:border-purple-400 has-[[data-state=checked]]:bg-purple-400/15 has-[[data-state=checked]]:ring-purple-400/45",
} as const;

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
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="space-y-4 rounded-xl border border-white/8 bg-white/2 p-3.5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-apex-orange-light/80">
          Invoice type
        </p>
        <Controller
          name="invoice_type"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid-cols-2 gap-2"
            >
              <FieldLabel
                htmlFor="invoice-type-purchase"
                className={cn(radioCardClass, radioToneClass.teal)}
              >
                <RadioGroupItem value="purchase" id="invoice-type-purchase" />
                <span className={radioLabelClass}>Purchase</span>
              </FieldLabel>
              <FieldLabel
                htmlFor="invoice-type-sale"
                className={cn(radioCardClass, radioToneClass.orange)}
              >
                <RadioGroupItem value="sale" id="invoice-type-sale" />
                <span className={radioLabelClass}>Sale</span>
              </FieldLabel>
            </RadioGroup>
          )}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-white/8 bg-white/2 p-3.5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-apex-orange-light/80">
          Payment status
        </p>
        <Controller
          name="invoice_status"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid-cols-2 gap-2"
            >
              <FieldLabel
                htmlFor="invoice-status-paid"
                className={cn(radioCardClass, radioToneClass.emerald)}
              >
                <RadioGroupItem value="paid" id="invoice-status-paid" />
                <span className={radioLabelClass}>Paid</span>
              </FieldLabel>
              <FieldLabel
                htmlFor="invoice-status-unpaid"
                className={cn(radioCardClass, radioToneClass.red)}
              >
                <RadioGroupItem value="unpaid" id="invoice-status-unpaid" />
                <span className={radioLabelClass}>Unpaid</span>
              </FieldLabel>
            </RadioGroup>
          )}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-white/8 bg-white/2 p-3.5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-apex-orange-light/80">
          Payment method
        </p>
        <Controller
          name="invoice_payment_method"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid-cols-2 gap-2"
            >
              {(["Cash", "Bank", "Credit", "Telebirr"] as const).map((method) => (
                <FieldLabel
                  key={method}
                  htmlFor={`invoice-method-${method}`}
                  className={cn(
                    radioCardClass,
                    method === "Cash"
                      ? radioToneClass.emerald
                      : method === "Bank"
                        ? radioToneClass.blue
                        : method === "Credit"
                          ? radioToneClass.amber
                          : radioToneClass.purple,
                  )}
                >
                  <RadioGroupItem value={method} id={`invoice-method-${method}`} />
                  <span className={radioLabelClass}>{method}</span>
                </FieldLabel>
              ))}
            </RadioGroup>
          )}
        />
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
  onRefresh,
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
  onRefresh: () => void | Promise<void>;
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
        {invoiceToEdit ? (
          <Dialog open onOpenChange={(open) => { if (!open) onCancelEdit(); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border border-white/12 bg-[#0b1420] p-0 text-white shadow-xl ring-0 sm:max-w-5xl">
              <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-apex-orange-light">
                    <Receipt className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white/45">Invoice record</p>
                    <DialogTitle className="mt-1 text-lg font-semibold text-white">Edit invoice</DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-white/60">Update the invoice details, payment state, and supporting information.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className={cn(workspaceInnerPanelClass, "mx-5 mt-5 flex items-center justify-between gap-4 bg-apex-orange/8 p-4") }>
                <div>
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/40">Live preview</p>
                  <p className="mt-1 font-display text-2xl font-bold text-apex-orange-light">{formatCurrency(previewAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/40">Status</p>
                  <div className="mt-1.5">{statusBadge(watchedStatus || "unpaid")}</div>
                </div>
              </div>

              <form className="grid gap-5 p-5 sm:p-6" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-3 md:grid-cols-3">
                  <CustomFormField
                    name="invoice_number"
                    control={form.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Invoice number"
                    placeholder="e.g. INV-2026-0042"
                    labelClassName="text-xs font-semibold text-white/65"
                    inputClassName="h-11 rounded-lg border-white/14 bg-[#111d2a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20"
                  />
                  <div className="space-y-2">
                    <label htmlFor="invoice-supplier" className="text-xs font-semibold text-white/65">Supplier</label>
                    <Controller
                      name="supplier_id"
                      control={form.control}
                      render={({ field }) => (
                        <Combobox
                          id="invoice-supplier"
                          value={field.value}
                          onChange={field.onChange}
                          options={suppliers.map((supplier) => ({
                            label: supplier.supplier_name,
                            value: supplier.id,
                          }))}
                          placeholder={suppliers.length ? "Select supplier" : "Add suppliers first"}
                          searchPlaceholder="Search suppliers..."
                          disabled={!suppliers.length}
                          className="h-11 rounded-lg border-white/14 bg-[#111d2a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20"
                        />
                      )}
                    />
                    {form.formState.errors.supplier_id ? (
                      <p className="text-sm text-destructive">{form.formState.errors.supplier_id.message}</p>
                    ) : null}
                  </div>
                  <CustomFormField
                    name="invoice_date"
                    control={form.control}
                    fieldType={formFieldTypes.CALENDAR}
                    label="Invoice date"
                    placeholder="Pick invoice date"
                    labelClassName="text-xs font-semibold text-white/65"
                    inputClassName="h-11 w-full justify-between rounded-lg border-white/14 bg-[#111d2a] px-3 text-white shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20"
                  />
                </div>

                <CustomFormField
                  name="invoice_amount"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Invoice amount"
                  placeholder="0.00"
                  type="number"
                  labelClassName="text-xs font-semibold text-white/65"
                  inputClassName="h-11 rounded-lg border-white/14 bg-[#111d2a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20"
                />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-apex-orange-light/80">
                      Payment & classification
                    </p>
                    <span className="h-px flex-1 bg-linear-to-r from-white/12 to-transparent" />
                  </div>
                  <PaymentClassificationFields form={form} />
                </div>

                <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/65">Document</p>
                    <CustomFormField
                      name="invoice_image"
                      control={form.control}
                      fieldType={formFieldTypes.IMAGE_UPLOADER}
                      label="Invoice image"
                      placeholder="Upload invoice scan or receipt photo"
                      className="items-center **:data-[slot=field-label]:text-center"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full rounded-xl border border-white/10 bg-white/3 p-4 text-sm text-white/70">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Summary</p>
                      <p className="mt-2 font-medium text-white/85">{form.watch("invoice_number") || "Untitled invoice"}</p>
                      <p className="mt-2 text-xs text-white/60">{suppliers.find((supplier) => supplier.id === form.watch("supplier_id"))?.supplier_name || "No supplier selected"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
                  <Button type="button" variant="outline" className="border-white/14 bg-white/5" onClick={onCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !suppliers.length}>
                    {loading ? "Saving..." : "Update invoice"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <BatchInvoiceDialog suppliers={suppliers} onSuccess={onRefresh} />
        )}

        <Card className={cn(workspacePanelClass, "overflow-hidden")}>
          <WorkspaceModuleHeader
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
                          <div className="flex items-center gap-3">
                            {invoice.invoice_image ? (
                              <Image
                                src={invoice.invoice_image}
                                alt={`Invoice ${invoice.invoice_number}`}
                                width={44}
                                height={44}
                                className="size-11 shrink-0 rounded-lg border border-white/10 object-cover"
                              />
                            ) : (
                              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/35">
                                <Receipt className="h-4 w-4" />
                              </span>
                            )}
                            <div className="space-y-1">
                              <p className="font-medium text-white/90">{invoice.invoice_number}</p>
                              <p className="text-xs capitalize text-white/40">
                                {invoice.invoice_type} · {invoice.invoice_payment_method}
                              </p>
                            </div>
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              className="border-white/12 bg-white/5"
                              onClick={() => onEdit(invoice)}
                              aria-label={`Edit invoice ${invoice.invoice_number}`}
                              title={`Edit invoice ${invoice.invoice_number}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <ConfirmDeleteButton
                              title="Delete invoice?"
                              description={`Delete invoice ${invoice.invoice_number}. This action cannot be undone.`}
                              onConfirm={() => onDelete(invoice.id)}
                              iconOnly
                              ariaLabel={`Delete invoice ${invoice.invoice_number}`}
                            />
                          </div>
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
