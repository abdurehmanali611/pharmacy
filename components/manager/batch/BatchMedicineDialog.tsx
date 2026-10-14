"use client";

import { useState } from "react";
import { Plus, Trash2, Layers, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { CloudinaryImageUploader } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DRUG_CATEGORIES } from "@/constants";
import { createBatchMedicines, type addMedicine, type SupplierData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";

type MedicineLine = {
  id: string;
  name: string;
  category: string;
  supplier_id: string;
  price: string;
  cost: string;
  quantity: string;
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
    }

    const payload: addMedicine[] = lines.map((line) => ({
      name: line.name.trim(),
      category: line.category,
      supplier_id: line.supplier_id,
      price: Number(line.price),
      cost: Number(line.cost) || 0,
      quantity: Number(line.quantity),
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
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#09111f]/90 p-5 text-white shadow-xl sm:p-6">
        <header className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-apex-orange/30 bg-apex-orange/10 text-apex-orange-light">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Medicine intake</h2>
              <p className="text-xs text-white/60">Register multiple stock records with individual supplier, pricing, batch and expiry details.</p>
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
                    Line #{index + 1}
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
              Lines: <span className="font-bold text-white">{lines.length}</span>
            </div>
            <div>
              Units: <span className="font-bold text-white">{totalUnits}</span>
            </div>
            <div>
              Estimated Cost: <span className="font-bold text-apex-orange-light">{formatCurrency(totalCost)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="gap-2 bg-apex-orange font-semibold text-white hover:bg-apex-orange-light"
            >
              {submitting ? "Registering..." : `Register All ${lines.length} Lines`}
            </Button>
          </div>
        </footer>
    </section>
  );
}
