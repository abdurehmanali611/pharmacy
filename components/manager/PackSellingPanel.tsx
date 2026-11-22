"use client";

import { Scissors, Sparkles, TriangleAlert } from "lucide-react";

import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import { LOOSE_UNIT_OPTIONS, plural } from "@/lib/packSelling";
import { cn } from "@/lib/utils";

/**
 * "Sell loose" settings for a medicine: how many loose units (tablets...) one pack (strip...) holds,
 * what the loose unit is called and what it sells for. Presentational: the form that owns it keeps the values.
 */
export function PackSellingPanel({
  enabled,
  onEnabledChange,
  packSize,
  onPackSizeChange,
  looseUnit,
  onLooseUnitChange,
  loosePrice,
  onLoosePriceChange,
  packLabel,
  salePrice,
  cost,
  inputClassName,
  labelClassName,
  disabled = false,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  packSize: string;
  onPackSizeChange: (value: string) => void;
  looseUnit: string;
  onLooseUnitChange: (value: string) => void;
  loosePrice: string;
  onLoosePriceChange: (value: string) => void;
  /** Lower-case name of the pack unit, e.g. "strip". */
  packLabel: string;
  salePrice: number;
  cost: number;
  inputClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
}) {
  const size = Math.max(0, Math.floor(Number(packSize) || 0));
  const unitName = looseUnit || "piece";
  const autoPrice = size > 1 ? Math.round((salePrice / size) * 100) / 100 : 0;
  const chosenPrice = loosePrice !== "" ? Number(loosePrice) : autoPrice;
  const costPerLoose = size > 1 ? cost / size : 0;
  const underCost = size > 1 && cost > 0 && chosenPrice > 0 && chosenPrice < costPerLoose - 0.0001;
  const label = labelClassName ?? "mb-1.5 text-[11px] font-semibold text-white/70";
  const control = inputClassName ?? "h-10 border-white/10 bg-white/4 text-sm";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors",
        enabled
          ? "border-fuchsia-300/35 bg-[linear-gradient(135deg,rgba(168,85,247,0.14),rgba(236,72,153,0.08)_55%,rgba(10,8,40,0.5))]"
          : "border-white/12 bg-white/[0.03]",
      )}
    >
      <label className="flex cursor-pointer items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            enabled ? "border-fuchsia-300/40 bg-fuchsia-400/20 text-fuchsia-100" : "border-white/15 bg-white/8 text-white/55",
          )}
        >
          <Scissors className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-white">Sell loose (cut from a {packLabel})</span>
          <span className="block text-xs leading-snug text-white/60">
            Let the counter sell part of a {packLabel}, such as 1–3 {plural(unitName, 2)} from a full {packLabel}.
          </span>
        </span>
        <Switch checked={enabled} disabled={disabled} onCheckedChange={onEnabledChange} />
      </label>

      {enabled ? (
        <div className="space-y-3 border-t border-white/10 p-4 pt-3.5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className={cn(label, "first-letter:uppercase")}>{`${plural(unitName, 2)} per ${packLabel}`}</p>
              <Input
                type="number"
                min={2}
                step={1}
                inputMode="numeric"
                placeholder="e.g. 10"
                value={packSize}
                disabled={disabled}
                onChange={(e) => onPackSizeChange(e.target.value)}
                className={control}
              />
            </div>
            <div>
              <p className={label}>Loose unit</p>
              <Combobox
                value={looseUnit}
                onChange={onLooseUnitChange}
                options={LOOSE_UNIT_OPTIONS.map((u) => ({ label: u.label, value: u.value }))}
                placeholder="Tablet, capsule…"
                searchPlaceholder="Search units…"
                disabled={disabled}
                className={control}
              />
            </div>
            <div>
              <p className={label}>{`Price per ${unitName}`}</p>
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder={autoPrice > 0 ? `Auto · ${autoPrice.toFixed(2)}` : "Auto"}
                value={loosePrice}
                disabled={disabled}
                onChange={(e) => onLoosePriceChange(e.target.value)}
                className={control}
              />
            </div>
          </div>

          {size > 1 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-300/30 bg-fuchsia-400/12 px-2.5 py-1 font-semibold text-fuchsia-100">
                <Sparkles className="size-3" />
                1 {packLabel} = {size} {plural(unitName, size)}
              </span>
              <span className="rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-white/75">
                Sells at <b className="tabular-nums text-white">{formatCurrency(chosenPrice)}</b> per {unitName}
                {loosePrice === "" ? " (pack price ÷ size)" : ""}
              </span>
              {cost > 0 ? (
                <span className="rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-white/60">
                  Costs <span className="tabular-nums">{formatCurrency(costPerLoose)}</span> per {unitName}
                </span>
              ) : null}
              {underCost ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/40 bg-rose-400/15 px-2.5 py-1 font-semibold text-rose-100">
                  <TriangleAlert className="size-3" />
                  Below cost
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-amber-200/90">Enter how many {plural(unitName, 2)} one {packLabel} holds (2 or more).</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
