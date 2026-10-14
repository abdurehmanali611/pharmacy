"use client";

import { useState } from "react";
import { CalendarDays, Plus, Trash2, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { CloudinaryImageUploader } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";
import { createBatchInvoices, type createInvoice, type SupplierData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type InvoiceLine = {
  id: string;
  invoice_number: string;
  supplier_id: string;
  invoice_date: string;
  invoice_amount: string;
  invoice_status: "paid" | "unpaid";
  invoice_type: "purchase" | "sale";
  invoice_payment_method: "Cash" | "Bank" | "Credit" | "Telebirr";
  invoice_image: string;
};

const createEmptyLine = (): InvoiceLine => ({
  id: Math.random().toString(36).substring(2, 9),
  invoice_number: "",
  supplier_id: "",
  invoice_date: new Date().toISOString().slice(0, 10),
  invoice_amount: "",
  invoice_status: "paid",
  invoice_type: "purchase",
  invoice_payment_method: "Cash",
  invoice_image: "",
});

const fieldLabelClass = "text-[11px] font-semibold text-white/70";
const fieldControlClass = "h-10 border-white/10 bg-white/[0.04] text-sm";
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

export function BatchInvoiceDialog({
  suppliers,
  onSuccess,
}: {
  suppliers: SupplierData[];
  onSuccess: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<InvoiceLine[]>(() => [createEmptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));
  };

  const updateLine = (id: string, field: keyof InvoiceLine, value: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  };

  const totalAmount = lines.reduce((sum, line) => sum + (Number(line.invoice_amount) || 0), 0);

  const handleSubmit = async () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.invoice_number.trim()) {
        toast.error(`Line #${i + 1}: Invoice number is required`);
        return;
      }
      if (!line.supplier_id) {
        toast.error(`Line #${i + 1} (${line.invoice_number}): Please select a supplier`);
        return;
      }
      if (!line.invoice_amount || Number(line.invoice_amount) <= 0) {
        toast.error(`Line #${i + 1} (${line.invoice_number}): Valid amount is required`);
        return;
      }
    }

    const payload: createInvoice[] = lines.map((line) => ({
      invoice_number: line.invoice_number.trim(),
      supplier_id: line.supplier_id,
      invoice_date: line.invoice_date || new Date().toISOString().slice(0, 10),
      invoice_amount: Number(line.invoice_amount),
      invoice_status: line.invoice_status,
      invoice_type: line.invoice_type,
      invoice_payment_method: line.invoice_payment_method,
      invoice_image: line.invoice_image.trim(),
    }));

    try {
      await createBatchInvoices(payload, setSubmitting);
      await onSuccess();
      setLines([createEmptyLine()]);
    } catch {
      // Handled in action
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#09111f]/90 p-5 text-white shadow-xl sm:p-6">
        <header className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-apex-orange/30 bg-apex-orange/10 text-apex-orange-light">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Invoice intake</h2>
              <p className="text-xs text-white/60">Record multiple supplier bills or sales invoices with individual dates and payment details.</p>
            </div>
          </div>
        </header>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="relative rounded-xl border border-white/10 bg-white/3 p-4 transition-colors hover:border-white/20 sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80">
                    Invoice #{index + 1}
                  </span>
                  {lines.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeLine(line.id)}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      title="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <label className={fieldLabelClass}>Invoice Number *</label>
                    <Input
                      placeholder="e.g. INV-2026-0042"
                      value={line.invoice_number}
                      onChange={(e) => updateLine(line.id, "invoice_number", e.target.value)}
                      className={fieldControlClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={fieldLabelClass}>Supplier *</label>
                    <Combobox
                      value={line.supplier_id}
                      onChange={(val) => updateLine(line.id, "supplier_id", val)}
                      options={suppliers.map((s) => ({ label: s.supplier_name, value: s.id }))}
                      placeholder="Select supplier"
                      className={fieldControlClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={fieldLabelClass}>Amount (ETB) *</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={line.invoice_amount}
                      onChange={(e) => updateLine(line.id, "invoice_amount", e.target.value)}
                      className={fieldControlClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={fieldLabelClass}>Invoice Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full justify-between border-white/10 bg-white/4 px-3 text-sm font-normal text-white/85 hover:bg-white/8"
                        >
                          <span>
                            {line.invoice_date
                              ? format(parseISO(line.invoice_date), "PPP")
                              : "Pick invoice date"}
                          </span>
                          <CalendarDays className="size-4 text-white/50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-auto rounded-none border-0 bg-none p-0 shadow-none ring-0"
                      >
                        <Calendar
                          mode="single"
                          selected={line.invoice_date ? parseISO(line.invoice_date) : undefined}
                          onSelect={(date) =>
                            updateLine(line.id, "invoice_date", date ? format(date, "yyyy-MM-dd") : "")
                          }
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/8 pt-4 lg:grid-cols-3">
                  <div className="space-y-4 rounded-xl border border-white/8 bg-white/2 p-3">
                    <span className={cn(fieldLabelClass, "block")}>Invoice Type</span>
                    <RadioGroup
                      value={line.invoice_type}
                      onValueChange={(value) => updateLine(line.id, "invoice_type", value)}
                      className="grid-cols-2 gap-2"
                    >
                      {(["purchase", "sale"] as const).map((type) => (
                        <FieldLabel
                          key={type}
                          htmlFor={`${line.id}-type-${type}`}
                          className={cn(
                            radioCardClass,
                            type === "purchase" ? radioToneClass.teal : radioToneClass.orange,
                          )}
                        >
                          <RadioGroupItem value={type} id={`${line.id}-type-${type}`} />
                          <span className={radioLabelClass}>
                            {type === "purchase" ? "Purchase" : "Sale"}
                          </span>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-4 rounded-xl border border-white/8 bg-white/2 p-3">
                    <span className={cn(fieldLabelClass, "block")}>Payment Status</span>
                    <RadioGroup
                      value={line.invoice_status}
                      onValueChange={(value) => updateLine(line.id, "invoice_status", value as "paid" | "unpaid")}
                      className="grid-cols-2 gap-2"
                    >
                      {(["paid", "unpaid"] as const).map((status) => (
                        <FieldLabel
                          key={status}
                          htmlFor={`${line.id}-status-${status}`}
                          className={cn(
                            radioCardClass,
                            status === "paid" ? radioToneClass.emerald : radioToneClass.red,
                          )}
                        >
                          <RadioGroupItem value={status} id={`${line.id}-status-${status}`} />
                          <span className={radioLabelClass}>
                            {status === "paid" ? "Paid" : "Unpaid"}
                          </span>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-4 rounded-xl border border-white/8 bg-white/2 p-3">
                    <span className={cn(fieldLabelClass, "block")}>Payment Method</span>
                    <RadioGroup
                      value={line.invoice_payment_method}
                      onValueChange={(value) =>
                        updateLine(line.id, "invoice_payment_method", value as InvoiceLine["invoice_payment_method"])
                      }
                      className="grid-cols-2 gap-2"
                    >
                      {(["Cash", "Bank", "Credit", "Telebirr"] as const).map((method) => (
                        <FieldLabel
                          key={method}
                          htmlFor={`${line.id}-method-${method}`}
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
                          <RadioGroupItem value={method} id={`${line.id}-method-${method}`} />
                          <span className={radioLabelClass}>{method}</span>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
                <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
                  <label className="text-[11px] font-semibold text-white/70">
                    Invoice image (optional)
                  </label>
                  <CloudinaryImageUploader
                    id={`invoice-image-${line.id}`}
                    value={line.invoice_image}
                    placeholder="Upload or take a photo of the invoice"
                    disabled={submitting}
                    onChange={(url) => updateLine(line.id, "invoice_image", url)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addLine}
            className="w-full gap-2 border-dashed border-white/20 bg-white/2 py-5 text-sm font-semibold text-white/80 hover:border-white/40 hover:bg-white/6 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add line
          </Button>
        </div>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row">
          <div className="flex items-center gap-4 text-xs text-white/70">
            <div>
              Total Invoices: <span className="font-bold text-white">{lines.length}</span>
            </div>
            <div>
              Total Amount: <span className="font-bold text-apex-orange-light">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="gap-2 bg-apex-orange font-semibold text-white hover:bg-apex-orange-light"
            >
              {submitting ? "Registering..." : `Register All ${lines.length} Invoices`}
            </Button>
          </div>
        </footer>
    </section>
  );
}
