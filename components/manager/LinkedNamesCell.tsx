"use client";

import { ChevronRight, Pill } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type LinkedNamesCellProps = {
  items: string[];
  /** Singular noun, e.g. "medicine" */
  itemLabel?: string;
  emptyLabel?: string;
  className?: string;
};

const VISIBLE_ITEM_COUNT = 4;
/** Matches one list row: py-2 + single-line text-sm */
const LIST_ROW_HEIGHT_REM = 2.5;

function buildSummary(count: number, itemLabel: string) {
  const plural = count === 1 ? itemLabel : `${itemLabel}s`;
  if (count === 1) {
    return `Provides 1 ${itemLabel}`;
  }
  return `Provides ${count} ${plural}`;
}

export function LinkedNamesCell({
  items,
  itemLabel = "item",
  emptyLabel = "No items supplied yet",
  className,
}: LinkedNamesCellProps) {
  if (!items.length) {
    return <span className="text-sm text-white/45">{emptyLabel}</span>;
  }

  const plural = items.length === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex max-w-48 flex-col items-start gap-0.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition",
            "hover:border-white/10 hover:bg-white/5",
            className,
          )}
        >
          <span className="text-sm font-medium text-white/85">{buildSummary(items.length, itemLabel)}</span>
          <span className="inline-flex items-center gap-0.5 text-[0.68rem] font-semibold text-apex-orange-light/75 transition group-hover:text-apex-orange-light">
            View {plural}
            <ChevronRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 border-white/12 bg-[#0a1628] p-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)]"
      >
        <div className="border-b border-white/10 px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-apex-orange/25 bg-apex-orange/10">
              <Pill className="h-4 w-4 text-apex-orange-light" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{buildSummary(items.length, itemLabel)}</p>
              <p className="text-[0.68rem] text-white/45">Full list of linked {plural}</p>
            </div>
          </div>
        </div>

        <div className="p-2">
          <div className="relative">
            <ul
              className="overflow-y-auto overscroll-contain pr-1"
              style={{ maxHeight: `${VISIBLE_ITEM_COUNT * LIST_ROW_HEIGHT_REM}rem` }}
            >
              {items.map((name, index) => (
                <li
                  key={`${name}-${index}`}
                  className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm text-white/85 odd:bg-white/3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[0.62rem] font-bold text-white/40">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate leading-snug" title={name}>
                    {name}
                  </span>
                </li>
              ))}
            </ul>

            {items.length > VISIBLE_ITEM_COUNT ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-[linear-gradient(180deg,transparent,rgba(10,22,40,0.98))]" />
            ) : null}
          </div>

          {items.length > VISIBLE_ITEM_COUNT ? (
            <p className="mt-2 border-t border-white/8 pt-2 text-center text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/35">
              Scroll for {items.length - VISIBLE_ITEM_COUNT} more
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
