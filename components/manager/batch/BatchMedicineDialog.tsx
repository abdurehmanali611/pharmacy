"use client";

import { useState } from "react";
import { Trash2, Layers, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { CloudinaryImageUploader } from "@/components/customFormField";
import { AddLineBar, LineNumber } from "@/components/manager/kit";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DRUG_CATEGORIES } from "@/constants";
import { createBatchMedicines, type addMedicine, type SupplierData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";

const LINE_TINTS = ["violet", "cyan", "pink", "emerald", "amber", "sky"] as const;

type MedicineLine = {
  id: string;
  name: string;
  category: string;
  supplier_id: string;
  price: string;
  cost: string;
  quantity: string;
  paid_amount: string;
  paid_touched: boolean;
  batch_number: string;
  expiry_date: string;
  description: string;
  image_url: string;
};

const createEmptyLine = (): MedicineLine => ({
  id: Math.random().toString(36).substring(2, 9),
  name: "",
  category: "tablet",
  supplier_id: "",
  price: "",
  cost: "",
  quantity: "",
  paid_amount: "",
  paid_touched: false,
  batch_number: "",
  expiry_date: "",
  description: "",
  image_url: "",
});

export function BatchMedicineDialog({
  suppliers,
  onSuccess,
}: {
  suppliers: SupplierData[];
  onSuccess: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<MedicineLine[]>(() => [createEmptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));
  };

  const updateLine = (id: string, field: keyof MedicineLine, value: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  };

  // Paid amount follows quantity x cost until the manager edits it; anything lower means credit.
  const lineTotal = (line: MedicineLine) => (Number(line.cost) || 0) * (Number(line.quantity) || 0);
  const linePaid = (line: MedicineLine) =>
    line.paid_touched ? Number(line.paid_amount) || 0 : lineTotal(line);
  const totalCredit = lines.reduce((sum, line) => sum + Math.max(0, lineTotal(line) - linePaid(line)), 0);

  const updatePaid = (id: string, value: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, paid_amount: value, paid_touched: true } : line)),
    );
  };

  const totalUnits = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  const totalCost = lines.reduce(
    (sum, line) => sum + (Number(line.cost) || 0) * (Number(line.quantity) || 0),
    0,
  );

  const handleSubmit = async () => {
    // Validate each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.name.trim()) {
        toast.error(`Line #${i + 1}: Medicine name is required`);
        return;
      }
      if (!line.supplier_id) {
        toast.error(`Line #${i + 1} (${line.name || "Item"}): Please select a supplier`);
        return;
      }
      if (!line.price || Number(line.price) <= 0) {
        toast.error(`Line #${i + 1} (${line.name}): Valid sale price is required`);
        return;
      }
      if (!line.quantity || Number(line.quantity) <= 0) {
        toast.error(`Line #${i + 1} (${line.name}): Valid quantity is required`);
        return;
      }
      if (!line.batch_number.trim()) {
        toast.error(`Line #${i + 1} (${line.name}): Batch number is required`);
        return;
      }
      if (linePaid(line) < 0 || linePaid(line) - lineTotal(line) > 0.005) {
        toast.error(`Line #${i + 1} (${line.name}): Paid amount cannot be more than the total cost`);
        return;
      }
    }

    const payload: addMedicine[] = lines.map((line) => ({
      name: line.name.trim(),
      category: line.category,
      supplier_id: line.supplier_id,
      price: Number(line.price),
      cost: Number(line.cost) || 0,
      quantity: Number(line.quantity),
      paid_amount: Math.round(linePaid(line) * 100) / 100,
      batch_number: line.batch_number.trim(),
      expiry_date: line.expiry_date || null,
      description: line.description.trim() || "Batch registered medicine",
      image_url: line.image_url.trim(),
    }));

    try {
      await createBatchMedicines(payload, setSubmitting);
      await onSuccess();
      setLines([createEmptyLine()]);
    } catch {
      // Handled in action
    }
  };

  return (
    <section className="workspace-panel-surface overflow-hidden p-5 text-white sm:p-6">
        <header className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="tint-icon tint-emerald flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">Medicine intake</h2>
              <p className="text-sm text-white/60">Register multiple stock records with individual supplier, pricing, batch and expiry details.</p>
            </div>
          </div>
        </header>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className={`workspace-inner-surface relative p-5 tint-${LINE_TINTS[index % LINE_TINTS.length]}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white/85"><LineNumber index={index} />Line</span>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Medicine Name</label>
                    <Input
                      placeholder="e.g. Paracetamol 500mg"
                      value={line.name}
                      onChange={(e) => updateLine(line.id, "name", e.target.value)}
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Category</label>
                    <Combobox
                      value={line.category}
                      onChange={(val) => updateLine(line.id, "category", val)}
                      options={DRUG_CATEGORIES.map((cat) => ({ label: cat.name, value: cat.value }))}
                      placeholder="Select category"
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Supplier</label>
                    <Combobox
                      value={line.supplier_id}
                      onChange={(val) => updateLine(line.id, "supplier_id", val)}
                      options={suppliers.map((s) => ({ label: s.supplier_name, value: s.id }))}
                      placeholder="Select supplier"
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Batch Number</label>
                    <Input
                      placeholder="e.g. BATCH-2026-X"
                      value={line.batch_number}
                      onChange={(e) => updateLine(line.id, "batch_number", e.target.value)}
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Sale Price (ETB)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={line.price}
                      onChange={(e) => updateLine(line.id, "price", e.target.value)}
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Cost Price (ETB)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={line.cost}
                      onChange={(e) => updateLine(line.id, "cost", e.target.value)}
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Quantity</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, "quantity", e.target.value)}
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Paid Amount (ETB)</label>
                    <Input
                      type="number"
                      min={0}
                      max={lineTotal(line) || undefined}
                      placeholder="0.00"
                      value={line.paid_touched ? line.paid_amount : lineTotal(line) ? String(lineTotal(line)) : ""}
                      onChange={(e) => updatePaid(line.id, e.target.value)}
                      className="h-10 border-white/10 bg-white/4 text-sm"
                    />
                    {lineTotal(line) > 0 ? (
                      linePaid(line) - lineTotal(line) > 0.005 ? (
                        <p className="text-[11px] font-bold text-rose-300">Cannot exceed {formatCurrency(lineTotal(line))}</p>
                      ) : lineTotal(line) - linePaid(line) > 0.005 ? (
                        <p className="text-[11px] font-bold text-rose-200">
                          On credit · {formatCurrency(lineTotal(line) - linePaid(line))} due
                        </p>
                      ) : (
                        <p className="text-[11px] font-bold text-emerald-300">Fully paid</p>
                      )
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Expiry Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full justify-between border-white/10 bg-white/4 px-3 text-sm font-normal text-white/85 hover:bg-white/5"
                        >
                          <span>
                            {line.expiry_date
                              ? format(parseISO(line.expiry_date), "PPP")
                              : "Pick expiry date"}
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
                          selected={line.expiry_date ? parseISO(line.expiry_date) : undefined}
                          onSelect={(date) =>
                            updateLine(line.id, "expiry_date", date ? format(date, "yyyy-MM-dd") : "")
                          }
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-white/70">Description</label>
                    <Textarea
                      value={line.description}
                      onChange={(e) => updateLine(line.id, "description", e.target.value)}
                      placeholder="Enter a description for this medicine..."
                      className="h-54 min-h-54 resize-none border-white/10 bg-white/4 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-white/70">Medicine image</label>
                    <CloudinaryImageUploader
                      id={`medicine-image-${line.id}`}
                      value={line.image_url}
                      placeholder="Upload or take a medicine photo"
                      disabled={submitting}
                      onChange={(url) => updateLine(line.id, "image_url", url)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <AddLineBar label="Add another line" onClick={addLine} />
        </div>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row">
          <div className="flex items-center gap-4 text-xs text-white/70">
            <div>
              Lines: <span className="font-bold text-white">{lines.length}</span>
            </div>
            <div>
              Units: <span className="font-bold text-white">{totalUnits}</span>
            </div>
            <div>
              Estimated Cost: <span className="font-bold text-apex-orange-light">{formatCurrency(totalCost)}</span>
              {totalCredit > 0.005 ? (
                <span className="ml-3 font-bold text-rose-200">Credit due: {formatCurrency(totalCredit)}</span>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="min-w-52 gap-2"
            >
              {submitting ? "Registering..." : `Register All ${lines.length} Lines`}
            </Button>
          </div>
        </footer>
    </section>
  );
}
