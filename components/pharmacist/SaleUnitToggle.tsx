"use client";

import { Package, Scissors } from "lucide-react";

import type { MedicineData } from "@/lib/actions";
import { looseName, packName, plural, unitPrice, type SaleUnit } from "@/lib/packSelling";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Pill switch for medicines that can be cut: sell a whole pack (strip, box...) or by the loose unit
 * (tablet...). Shows the price of each so the choice is obvious at a glance.
 */
export function SaleUnitToggle({
  medicine,
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  medicine: MedicineData;
  value: SaleUnit;
  onChange: (unit: SaleUnit) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const options: { unit: SaleUnit; label: string; icon: typeof Package }[] = [
    { unit: "pack", label: packName(medicine), icon: Package },
    { unit: "loose", label: looseName(medicine), icon: Scissors },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={`Sell ${medicine.name} by`}
      className="inline-flex rounded-xl border border-white/12 bg-[#0a0824]/70 p-0.5"
    >
      {options.map(({ unit, label, icon: Icon }) => {
        const active = value === unit;
        return (
          <button
            key={unit}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(unit)}
            className={cn(
              "flex items-center gap-1.5 rounded-[0.65rem] px-2.5 py-1 text-left transition disabled:opacity-60",
              active
                ? "bg-[linear-gradient(135deg,rgba(168,85,247,0.55),rgba(236,72,153,0.4))] text-white shadow-[0_6px_16px_-10px_rgba(168,85,247,0.9)]"
                : "text-white/55 hover:bg-white/8 hover:text-white/85",
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="leading-tight">
              <span className="block text-[0.7rem] font-bold capitalize">{compact ? label : `Per ${label}`}</span>
              {!compact ? (
                <span className="block text-[0.62rem] tabular-nums opacity-80">
                  {formatCurrency(unitPrice(medicine, unit))}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { plural };
