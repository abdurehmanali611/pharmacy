"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Package, Pill, ExternalLink } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MedicineData, SupplierData } from "@/lib/actions";

export function SupplierMedicinesHoverDetail({
  supplier,
  medicines,
}: {
  supplier: SupplierData;
  medicines: MedicineData[];
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const schedulePreviewOpen = () => {
    if (sheetOpen) return;
    clearTimers();
    openTimer.current = setTimeout(() => setPreviewOpen(true), 200);
  };

  const schedulePreviewClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setPreviewOpen(false), 180);
  };

  const openSheet = () => {
    clearTimers();
    setPreviewOpen(false);
    setSheetOpen(true);
  };

  if (!medicines.length) {
    return <span className="text-sm text-white/45">No medicines yet</span>;
  }

  const totalStock = medicines.reduce((sum, med) => sum + Number(med.quantity || 0), 0);
  const previewList = medicines.slice(0, 4);
  const remainingCount = medicines.length - previewList.length;

  return (
    <>
      <Popover
        open={previewOpen && !sheetOpen}
        onOpenChange={(next) => {
          if (!next) setPreviewOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/trigger flex min-w-48 max-w-64 flex-col items-start gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors",
              "hover:border-apex-orange/30 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-apex-orange/40",
              "cursor-pointer",
            )}
            onMouseEnter={schedulePreviewOpen}
            onMouseLeave={schedulePreviewClose}
            onFocus={schedulePreviewOpen}
            onBlur={schedulePreviewClose}
            onClick={(e) => {
              e.stopPropagation();
              openSheet();
            }}
          >
            <div className="flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-apex-orange-light" />
              <span className="text-sm font-semibold text-white/90">
                {medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-white/50 transition group-hover/trigger:text-apex-orange-light">
              <span>{totalStock} in stock</span>
              <ChevronRight className="h-3 w-3 opacity-0 transition group-hover/trigger:translate-x-0.5 group-hover/trigger:opacity-100" />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-[min(22rem,calc(100vw-2rem))] border-white/12 bg-[#081220] p-5 text-white shadow-2xl backdrop-blur-xl"
          onMouseEnter={schedulePreviewOpen}
          onMouseLeave={schedulePreviewClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="text-sm font-bold text-white">{supplier.supplier_name}</p>
                <p className="mt-0.5 text-xs text-white/55">
                  Supplies {medicines.length} catalogue line{medicines.length === 1 ? "" : "s"}
                </p>
              </div>
              <Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-teal-300 text-[10px]">
                {totalStock} units
              </Badge>
            </div>

            <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
              {previewList.map((medicine) => (
                <div
                  key={medicine.id}
                  className="rounded-lg border border-white/8 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13px] font-semibold text-white/90">{medicine.name}</p>
                    <span className="shrink-0 text-[13px] font-bold text-apex-orange-light">
                      {formatCurrency(medicine.price)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-white/55">
                    <span className="capitalize">{medicine.category || "General"}</span>
                    <span>{medicine.quantity} left</span>
                  </div>
                </div>
              ))}
            </div>

            {remainingCount > 0 ? (
              <p className="text-center text-[11px] text-white/50">
                +{remainingCount} more medicine{remainingCount === 1 ? "" : "s"}
              </p>
            ) : null}

            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-1 w-full gap-1.5 border border-white/12 bg-white/10 text-xs font-semibold text-white hover:bg-white/15 cursor-pointer"
              onClick={openSheet}
            >
              <ExternalLink className="h-3.5 w-3.5 text-apex-orange-light" />
              Open full detail
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-[min(100%,36rem)] flex-col gap-0 border-l border-white/12 bg-[#09111f] p-0 text-white shadow-2xl sm:max-w-2xl"
        >
          <SheetHeader className="shrink-0 space-y-1.5 border-b border-white/10 px-6 py-5 pr-14 text-left">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-300">
                <Package className="h-4 w-4" />
              </span>
              <div>
                <SheetTitle className="text-base font-bold text-white">
                  {supplier.supplier_name}
                </SheetTitle>
                <SheetDescription className="text-xs text-white/60">
                  Comprehensive pharmaceutical inventory supplied by this vendor.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="shrink-0 border-b border-white/8 bg-white/[0.02] px-6 py-3">
            <div className="flex items-center justify-between text-xs text-white/70">
              <div className="flex gap-4">
                <span>
                  SKUs: <strong className="text-white">{medicines.length}</strong>
                </span>
                <span>
                  Total Stock: <strong className="text-white">{totalStock}</strong> units
                </span>
              </div>
              <span className="text-[11px] text-white/50">{supplier.supplier_phone}</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
            {medicines.map((medicine, idx) => {
              const qty = Number(medicine.quantity || 0);
              const isUrgent = qty <= 5;
              return (
                <div
                  key={medicine.id || idx}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-base font-bold text-white">{medicine.name}</h4>
                        <Badge
                          variant="outline"
                          className="border-white/12 bg-white/5 text-[10px] text-white/70 capitalize"
                        >
                          {medicine.category || "General"}
                        </Badge>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-white/55">
                        {medicine.description || "No description provided."}
                      </p>
                    </div>

                    {medicine.image_url ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        <Image
                          src={medicine.image_url}
                          alt={medicine.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-white/8 pt-3 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/45">Sale Price</p>
                      <p className="mt-0.5 font-bold text-apex-orange-light">{formatCurrency(medicine.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/45">Cost</p>
                      <p className="mt-0.5 font-medium text-white/80">{formatCurrency(medicine.cost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/45">In Stock</p>
                      <p className={cn("mt-0.5 font-bold", isUrgent ? "text-red-300" : "text-emerald-300")}>
                        {qty} units
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/45">Batch #</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-white/80">
                        {medicine.batch_number || "—"}
                      </p>
                    </div>
                  </div>

                  {medicine.expiry_date ? (
                    <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-white/50">
                      <span>Expiry Date:</span>
                      <span className="font-medium text-white/80">{String(medicine.expiry_date)}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
