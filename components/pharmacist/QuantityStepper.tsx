"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Quantity control with − / + buttons and a number you can type into.
 * Typing is free-form while editing; the value is kept within 1..max when you leave the field.
 */
export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  disabled = false,
  label,
  size = "md",
  className,
}: {
  value: number;
  max: number;
  min?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const upper = Math.max(min, max);
  const [draft, setDraft] = useState(String(value));

  // Follow the value when it changes from outside (buttons, unit switch, reset).
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => Math.min(upper, Math.max(min, Math.round(n)));

  const commit = (raw: string) => {
    const parsed = Number(raw);
    const next = raw.trim() === "" || !Number.isFinite(parsed) ? min : clamp(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const btn = cn(
    "flex shrink-0 items-center justify-center rounded-lg border border-white/14 bg-white/6 text-white/80 transition hover:border-fuchsia-300/50 hover:bg-white/14 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
    size === "sm" ? "size-7" : "size-9",
  );

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        className={btn}
        aria-label={`Decrease ${label}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={`${label} quantity`}
        value={draft}
        disabled={disabled}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 7);
          setDraft(digits);
          // Update live while the number is valid, so totals follow the typing.
          if (digits !== "" && Number(digits) >= min) onChange(clamp(Number(digits)));
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "rounded-lg border border-white/14 bg-[#0a0824]/80 text-center font-semibold tabular-nums text-white outline-none transition focus:border-fuchsia-300/70 focus:ring-2 focus:ring-fuchsia-400/25 disabled:opacity-50",
          size === "sm" ? "h-7 w-12 text-xs" : "h-9 w-16 text-sm",
        )}
      />
      <button
        type="button"
        className={btn}
        aria-label={`Increase ${label}`}
        disabled={disabled || value >= upper}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );
}
