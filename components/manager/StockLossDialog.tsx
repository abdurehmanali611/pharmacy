"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { registerStockLoss, type MedicineData } from "@/lib/actions";

const COPY = {
  title: "Register damaged / wasted stock",
  verb: "damaged or wasted",
  button: "Register damaged / wasted",
};

export function StockLossDialog({
  open,
  medicines,
  onClose,
  onSuccess,
}: {
  open: boolean;
  medicines: MedicineData[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const copy = COPY;

  // Start each opening with 1 unit per medicine and an empty note.
  useEffect(() => {
    if (!open) return;
    setQuantities(Object.fromEntries(medicines.map((m) => [String(m.id), "1"])));
    setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setQuantity = (id: string, value: string) =>
    setQuantities((prev) => ({ ...prev, [id]: value }));

  const submit = async () => {
    const items: { medicine_id: number; quantity: number }[] = [];
    for (const medicine of medicines) {
      const quantity = Number(quantities[String(medicine.id)]);
      const stock = Number(medicine.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        toast.error(`${medicine.name}: Enter a whole number of at least 1`);
        return;
      }
      if (quantity > stock) {
        toast.error(`${medicine.name}: Only ${stock} in stock`);
        return;
      }
      items.push({ medicine_id: Number(medicine.id), quantity });
    }
    const result = await registerStockLoss({ kind: "damaged_wasted", items, note: note.trim() }, setSaving);
    if (result) {
      onClose();
      await onSuccess();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            Enter how many units of each medicine were {copy.verb}. The amount is deducted from
            inventory right away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {medicines.map((medicine) => {
            const id = String(medicine.id);
            const stock = Number(medicine.quantity);
            const current = Number(quantities[id]) || 0;
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/4 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white/90">{medicine.name}</p>
                  <p className="mt-0.5 truncate text-xs text-white/50">
                    Batch {medicine.batch_number || "—"} · {stock} in stock
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="border-white/12 bg-white/5"
                    aria-label={`Decrease ${medicine.name}`}
                    disabled={saving || current <= 1}
                    onClick={() => setQuantity(id, String(Math.max(1, current - 1)))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={stock}
                    value={quantities[id] ?? ""}
                    disabled={saving}
                    onChange={(e) => setQuantity(id, e.target.value)}
                    aria-label={`${medicine.name} quantity ${copy.verb}`}
                    className="h-8 w-16 border-white/14 bg-[#120f3a] text-center tabular-nums text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="border-white/12 bg-white/5"
                    aria-label={`Increase ${medicine.name}`}
                    disabled={saving || current >= stock}
                    onClick={() => setQuantity(id, String(Math.min(stock, current + 1)))}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          <div>
            <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/50">
              Note (optional)
            </p>
            <Input
              value={note}
              maxLength={500}
              disabled={saving}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Broken in transit, spilled, expired on shelf"
              className="h-10 border-white/14 bg-[#120f3a] text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving || !medicines.length} onClick={() => void submit()}>
            {saving ? "Saving…" : copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
