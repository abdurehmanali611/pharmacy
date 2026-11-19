"use client";

import { useState } from "react";
import { Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import { PhoneInput } from "@/components/phone-input";
import { AddLineBar, LineNumber } from "@/components/manager/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBatchSuppliers, type createSupplier } from "@/lib/actions";

const LINE_TINTS = ["violet", "cyan", "pink", "emerald", "amber", "sky"] as const;

type SupplierLine = {
  id: string;
  supplier_name: string;
  supplier_phone: string;
  supplier_email: string;
};

const createEmptyLine = (): SupplierLine => ({
  id: Math.random().toString(36).substring(2, 9),
  supplier_name: "",
  supplier_phone: "",
  supplier_email: "",
});

const fieldLabelClass = "text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200";
const fieldControlClass = "h-10 border-white/10 bg-white/[0.04] text-sm";
const phoneFieldClass =
  "h-10 [&_input]:h-10 [&_input]:rounded-e-lg [&_input]:border-white/10 [&_input]:bg-white/[0.04] [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-white/35 [&_button]:h-10 [&_button]:rounded-s-lg [&_button]:border-white/10 [&_button]:bg-white/[0.04] [&_button]:text-white";

export function BatchSupplierDialog({
  onSuccess,
}: {
  onSuccess: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<SupplierLine[]>(() => [createEmptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));
  };

  const updateLine = (id: string, field: keyof SupplierLine, value: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  };

  const handleSubmit = async () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.supplier_name.trim()) {
        toast.error(`Line #${i + 1}: Supplier name is required`);
        return;
      }
      if (!line.supplier_phone.trim()) {
        toast.error(`Line #${i + 1} (${line.supplier_name}): Supplier phone is required`);
        return;
      }
    }

    const payload: createSupplier[] = lines.map((line) => ({
      supplier_name: line.supplier_name.trim(),
      supplier_phone: line.supplier_phone.trim(),
      supplier_email: line.supplier_email.trim() || undefined,
    }));

    try {
      await createBatchSuppliers(payload, setSubmitting);
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
            <span className="tint-icon tint-teal flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <Users2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">Supplier intake</h2>
              <p className="text-sm text-white/60">
                Register multiple suppliers and distributors simultaneously using Add Line.
              </p>
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
                  <span className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white/85"><LineNumber index={index} />Vendor Line</span>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className={fieldLabelClass}>Supplier Name *</label>
                    <Input
                      placeholder="e.g. MedTech Pharmaceuticals"
                      value={line.supplier_name}
                      onChange={(e) => updateLine(line.id, "supplier_name", e.target.value)}
                      className={fieldControlClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={fieldLabelClass}>Phone *</label>
                    <PhoneInput
                      defaultCountry="ET"
                      international
                      placeholder="e.g. +251 91 234 5678"
                      value={line.supplier_phone}
                      onChange={(value) => updateLine(line.id, "supplier_phone", value ?? "")}
                      className={phoneFieldClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={fieldLabelClass}>Email (Optional)</label>
                    <Input
                      type="email"
                      placeholder="orders@medtech.com"
                      value={line.supplier_email}
                      onChange={(e) => updateLine(line.id, "supplier_email", e.target.value)}
                      className={fieldControlClass}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <AddLineBar label="Add another line" onClick={addLine} />
        </div>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row">
          <p className="text-xs text-white/70">
            Total vendors: <span className="font-bold text-white">{lines.length}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="min-w-52 gap-2"
            >
              {submitting ? "Registering..." : `Register All ${lines.length} Vendors`}
            </Button>
          </div>
        </footer>
    </section>
  );
}
