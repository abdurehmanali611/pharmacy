"use client";

import { useState } from "react";
import { Plus, Trash2, Users2 } from "lucide-react";
import { toast } from "sonner";

import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBatchSuppliers, type createSupplier } from "@/lib/actions";

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

const fieldLabelClass = "text-[11px] font-semibold text-white/70";
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
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#09111f]/90 p-5 text-white shadow-xl sm:p-6">
        <header className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-apex-orange/30 bg-apex-orange/10 text-apex-orange-light">
              <Users2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Supplier intake</h2>
              <p className="text-xs text-white/60">
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
                className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/80">
                    Vendor Line #{index + 1}
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

          <Button
            type="button"
            variant="outline"
            onClick={addLine}
            className="w-full gap-2 border-dashed border-white/20 bg-white/[0.02] py-5 text-sm font-semibold text-white/80 hover:border-white/40 hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add line
          </Button>
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
              className="gap-2 bg-apex-orange font-semibold text-white hover:bg-apex-orange-light"
            >
              {submitting ? "Registering..." : `Register All ${lines.length} Vendors`}
            </Button>
          </div>
        </footer>
    </section>
  );
}
