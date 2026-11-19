"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus, Search } from "lucide-react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the manager workspace, distilled from the
 * Discount rules page: tinted icon tiles, initials avatars, coloured chips,
 * a search + filter toolbar, friendly empty states and numbered line cards.
 */

export const TINT_NAMES = ["violet", "cyan", "pink", "emerald", "amber", "sky", "fuchsia", "teal"] as const;
export type TintName = (typeof TINT_NAMES)[number];

export const tableHeadClass = "text-[0.65rem] font-bold uppercase tracking-[0.16em]";

export const CHIP_TONES = [
  "border-violet-300/40 bg-violet-400/15 text-violet-100",
  "border-cyan-300/40 bg-cyan-400/15 text-cyan-100",
  "border-pink-300/40 bg-pink-400/15 text-pink-100",
  "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  "border-amber-300/40 bg-amber-400/15 text-amber-100",
  "border-sky-300/40 bg-sky-400/15 text-sky-100",
];

const AVATAR_TONES = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-400 to-blue-500",
  "from-pink-500 to-orange-400",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-rose-500",
  "from-sky-400 to-violet-500",
];

export function hashIndex(value: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash % mod;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function chipTone(seed: string) {
  return CHIP_TONES[hashIndex(seed, CHIP_TONES.length)];
}

/** Gradient initials avatar, colour picked from the name so each row feels distinct. */
export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-sm font-bold text-white shadow-[0_8px_18px_-10px_rgba(168,85,247,0.8)] ring-2 ring-white/15",
        AVATAR_TONES[hashIndex(name, AVATAR_TONES.length)],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Chip({
  children,
  seed,
  className,
  title,
}: {
  children: ReactNode;
  seed?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
        seed ? chipTone(seed) : "border-white/25 bg-white/10 text-white/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Icon tile + title + subtitle, with an optional slot on the right. */
export function SectionTitle({
  icon: Icon,
  tint = "violet",
  title,
  subtitle,
  right,
  className,
}: {
  icon: LucideIcon;
  tint?: TintName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        <span className={cn("tint-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", `tint-${tint}`)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold text-white">{title}</h3>
          {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Search on the left, a filter combobox on the right, both under the title. */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = "Filter…",
  extra,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: ComboboxOption[];
  filterPlaceholder?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-cyan-300" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 pl-9"
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        {extra}
        {filterOptions && onFilterChange && filterValue !== undefined ? (
          <div className="w-full sm:w-60">
            <Combobox
              value={filterValue}
              onChange={onFilterChange}
              options={filterOptions}
              placeholder={filterPlaceholder}
              searchPlaceholder="Search…"
              emptyText="Nothing found."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  tint = "fuchsia",
  title,
  description,
}: {
  icon: LucideIcon;
  tint?: TintName;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-violet-300/35 bg-violet-400/6 px-6 py-12 text-center">
      <span className={cn("tint-icon flex size-14 items-center justify-center rounded-3xl", `tint-${tint}`)}>
        <Icon className="size-7" />
      </span>
      <p className="font-display text-lg font-bold text-white">{title}</p>
      {description ? <p className="max-w-sm text-sm text-white/65">{description}</p> : null}
    </div>
  );
}

/** Dashed full-width "add another" bar. */
export function AddLineBar({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300/45 bg-violet-400/8 py-3 text-sm font-bold text-violet-100 transition hover:border-fuchsia-300/80 hover:bg-fuchsia-400/15 hover:text-white"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

/** Numbered badge used on each batch line card. */
export function LineNumber({ index, tint }: { index: number; tint?: TintName }) {
  return (
    <span
      className={cn(
        "tint-icon flex size-7 items-center justify-center rounded-lg text-sm",
        tint ? `tint-${tint}` : `tint-${TINT_NAMES[index % TINT_NAMES.length]}`,
      )}
    >
      {index + 1}
    </span>
  );
}

/** Small coloured label above a field. */
export function FieldLabel({
  children,
  tone = "violet",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: "violet" | "cyan" | "pink" | "fuchsia" | "amber" | "emerald";
  icon?: LucideIcon;
}) {
  const tones = {
    violet: "text-violet-200",
    cyan: "text-cyan-200",
    pink: "text-pink-200",
    fuchsia: "text-fuchsia-200",
    amber: "text-amber-200",
    emerald: "text-emerald-200",
  } as const;
  return (
    <p className={cn("mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em]", tones[tone])}>
      {Icon ? <Icon className="size-3.5" /> : null}
      {children}
    </p>
  );
}
