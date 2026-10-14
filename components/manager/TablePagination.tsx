"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    safePage,
    totalCount: items.length,
  };
}

export function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  itemLabel = "items",
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[linear-gradient(120deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <p className="text-sm text-white/60">
        Showing <span className="font-semibold tabular-nums text-white/90">{firstItem}–{lastItem}</span> of{" "}
        <span className="font-semibold tabular-nums text-white/90">{totalCount}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/12 bg-white/5"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="min-w-16 text-center text-xs font-medium tabular-nums text-white/60">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/12 bg-white/5"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
