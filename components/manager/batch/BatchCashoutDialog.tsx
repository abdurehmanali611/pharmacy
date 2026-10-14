"use client";

import { useState } from "react";
import { Banknote, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { workspaceInnerPanelClass, workspacePanelClass } from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createBatchCashouts, type createCashout } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type CashoutLine = {
  id: string;
  amount: string;
  reason: string;
};

const createEmptyLine = (): CashoutLine => ({
  id: Math.random().toString(36).substring(2, 9),
  amount: "",
  reason: "",
});

const fieldLabelClass = "text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/55";
const fieldControlClass =
  "h-12 rounded-xl border-white/12 bg-[#0b1726]/85 text-sm text-white shadow-inner shadow-black/10 placeholder:text-white/30 focus-visible:border-apex-orange/60 focus-visible:ring-apex-orange/20";

export function BatchCashoutDialog({
  onSuccess,
}: {
  onSuccess: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<CashoutLine[]>(() => [createEmptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));
  };

  const updateLine = (id: string, field: keyof CashoutLine, value: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
    );
  };

  const grandTotal = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  const handleSubmit = async () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.amount || Number(line.amount) <= 0) {
        toast.error(`Line #${i + 1}: Valid cashout amount is required`);
        return;
      }
      if (!line.reason.trim()) {
        toast.error(`Line #${i + 1}: Reason for expense is required`);
        return;
      }
    }

    const payload: createCashout[] = lines.map((line) => ({
      amount: Number(line.amount),
      reason: line.reason.trim(),
    }));

    try {
      await createBatchCashouts(payload, setSubmitting);
      await onSuccess();
      setLines([createEmptyLine()]);
    } catch {
      // Handled in action
    }
  };

  return (
    <section className={cn(workspacePanelClass, "text-white")}>
      <header className="flex flex-col gap-5 border-b border-apex-orange/12 bg-[linear-gradient(105deg,rgba(232,149,30,0.1),transparent_68%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-apex-orange/35 bg-apex-orange/15 text-apex-orange-light shadow-[0_0_24px_-10px_rgba(232,149,30,0.8)]">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-apex-orange-light/80">
              Cash movement
            </p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-white">
              Cashout intake
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-white/55 sm:text-sm">
              Record and review cash disbursements before adding them to your ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1726]/70 px-4 py-3 sm:min-w-56">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-apex-orange/12 text-apex-orange-light">
            <Banknote className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/45">
              Intake total · {lines.length} {lines.length === 1 ? "line" : "lines"}
            </p>
            <p className="mt-0.5 truncate font-display text-lg font-bold text-apex-orange-light">
              {formatCurrency(grandTotal)}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4 sm:p-6">
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className={cn(
                workspaceInnerPanelClass,
                "p-4 transition-colors hover:border-apex-orange/30 sm:p-5",
              )}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-apex-orange/20 bg-apex-orange/10 text-apex-orange-light">
                    <span className="font-display text-sm font-bold">{String(index + 1).padStart(2, "0")}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white/90">
                      Cashout line {index + 1}
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      Enter the amount and its business reason
                    </p>
                  </div>
                </div>
                {lines.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => removeLine(line.id)}
                    className="shrink-0 border-red-400/20 bg-red-500/4 text-red-300 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
                    title="Remove line"
                    aria-label={`Remove cashout line ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
                <div className="space-y-2">
                  <label className={fieldLabelClass} htmlFor={`cashout-amount-${line.id}`}>
                    Amount <span className="text-apex-orange-light">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-white/8 px-3 text-xs font-bold text-white/45">
                      ETB
                    </span>
                    <Input
                      id={`cashout-amount-${line.id}`}
                      type="number"
                      placeholder="0.00"
                      value={line.amount}
                      onChange={(e) => updateLine(line.id, "amount", e.target.value)}
                      className={cn(fieldControlClass, "pl-14 font-display text-base font-semibold tabular-nums")}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className={fieldLabelClass} htmlFor={`cashout-reason-${line.id}`}>
                    Reason / description <span className="text-apex-orange-light">*</span>
                  </label>
                  <div className="rounded-2xl border border-white/8 bg-[#0b1726]/45 p-2 transition-colors focus-within:border-apex-orange/35 focus-within:bg-[#0b1726]/70">
                    <Textarea
                      id={`cashout-reason-${line.id}`}
                      placeholder="Describe why this cash was withdrawn and what it was used for..."
                      value={line.reason}
                      onChange={(e) => updateLine(line.id, "reason", e.target.value)}
                      rows={4}
                      className="min-h-32 resize-y rounded-xl border-transparent bg-white/[0.035] px-4 py-3.5 text-sm leading-6 text-white shadow-none placeholder:text-white/35 focus-visible:border-apex-orange/45 focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-apex-orange/15"
                    />
                    <p className="px-2 pt-2 text-[11px] leading-4 text-white/40">
                      Add enough detail to make this expense easy to identify later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addLine}
          className="h-12 w-full gap-2 rounded-xl border-dashed border-apex-orange/30 bg-apex-orange/[0.035] text-sm font-semibold text-apex-orange-light hover:border-apex-orange/55 hover:bg-apex-orange/10"
        >
          <Plus className="size-4" />
          Add another cashout
        </Button>
      </div>

      <footer className="flex flex-col gap-4 border-t border-white/8 bg-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-white/60">
            <Banknote className="size-4" />
          </span>
          <div>
            <p className="text-xs font-medium text-white/50">Total to record</p>
            <p className="font-display text-lg font-bold text-white">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
        <Button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="h-11 w-full gap-2 rounded-xl bg-apex-orange px-5 font-bold text-white shadow-[0_8px_24px_-12px_rgba(232,149,30,0.8)] transition hover:bg-apex-orange-light sm:w-auto"
        >
          <Wallet className="size-4" />
          {submitting
            ? "Recording..."
            : `Record ${lines.length} ${lines.length === 1 ? "cashout" : "cashouts"}`}
        </Button>
      </footer>
    </section>
  );
}
