"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, Minus, Package, Pill, Plus, Search, ShoppingBag, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DRUG_CATEGORIES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MedicineData } from "@/lib/actions";

function getStockTone(quantity: number) {
  if (quantity <= 5) return "destructive";
  if (quantity <= 20) return "secondary";
  return "outline";
}

function categoryLabel(value?: string) {
  return DRUG_CATEGORIES.find((item) => item.value === value)?.name ?? "Uncategorized";
}

function isExpired(medicine: MedicineData, today: string) {
  return Boolean(medicine.expiry_date && medicine.expiry_date.slice(0, 10) < today);
}

function compareExpiry(left: MedicineData, right: MedicineData) {
  const leftExpiry = left.expiry_date?.slice(0, 10);
  const rightExpiry = right.expiry_date?.slice(0, 10);
  if (!leftExpiry && !rightExpiry) return left.id.localeCompare(right.id);
  if (!leftExpiry) return 1;
  if (!rightExpiry) return -1;
  return leftExpiry.localeCompare(rightExpiry) || left.id.localeCompare(right.id);
}

function medicineGroupKey(medicine: MedicineData) {
  return JSON.stringify([medicineNameKey(medicine.name), medicine.category ?? "other"]);
}

function medicineNameKey(name: string) {
  return name.trim().toLowerCase();
}

type PriorityIntent =
  | { kind: "select"; medicine: MedicineData }
  | { kind: "single"; medicine: MedicineData }
  | { kind: "batch"; items: { medicine: MedicineData; quantity: number }[] };

export function MedicineCatalog({
  medicines,
  selectedCategory,
  onSelectCategory,
  loading,
  onOrder,
}: {
  medicines: MedicineData[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  loading: boolean;
  onOrder: (items: { medicine: MedicineData; quantity: number }[]) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, number>>({});
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"single" | "batch">("single");
  const [orderItems, setOrderItems] = useState<{ medicine: MedicineData; quantity: number }[]>([]);
  const [priorityIntent, setPriorityIntent] = useState<PriorityIntent | null>(null);
  const [priorityWarningOpen, setPriorityWarningOpen] = useState(false);
  const [acknowledgedPriority, setAcknowledgedPriority] = useState<Record<string, true>>({});
  const today = format(new Date(), "yyyy-MM-dd");

  const availableMedicines = useMemo(
    () => medicines.filter((medicine) => Number(medicine.quantity) > 0),
    [medicines],
  );

  const categoryOptions = useMemo<ComboboxOption[]>(() => {
    const counts = new Map<string, number>();
    for (const medicine of availableMedicines) {
      const key = medicine.category ?? "other";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      {
        value: "all",
        label: "All categories",
        hint: "show everything",
        icon: <LayoutGrid className="h-4 w-4 text-white/50" />,
        count: availableMedicines.length,
      },
      ...DRUG_CATEGORIES.map((item) => ({
        value: item.value,
        label: item.name,
        keywords: item.value,
        icon: <Pill className="h-4 w-4 text-white/50" />,
        count: counts.get(item.value) ?? 0,
      })),
    ];
  }, [availableMedicines]);

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableMedicines.filter((medicine) => {
      const categoryOk = selectedCategory === "all" || medicine.category === selectedCategory;
      if (!categoryOk) return false;
      if (!query) return true;
      return [medicine.name, medicine.supplier_name, medicine.batch_number, categoryLabel(medicine.category)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query));
    });
  }, [availableMedicines, selectedCategory, search]);

  const allMedicineGroups = useMemo(() => {
    const groups = new Map<string, MedicineData[]>();
    for (const medicine of availableMedicines) {
      const key = medicineGroupKey(medicine);
      const group = groups.get(key) ?? [];
      group.push(medicine);
      groups.set(key, group);
    }
    return Array.from(groups, ([key, entries]) => ({
      key,
      entries: entries.slice().sort(compareExpiry),
    }));
  }, [availableMedicines]);

  const medicineGroups = useMemo(() => {
    const groups = new Map<string, MedicineData[]>();
    for (const medicine of filteredMedicines) {
      const key = medicineGroupKey(medicine);
      const group = groups.get(key) ?? [];
      group.push(medicine);
      groups.set(key, group);
    }
    return Array.from(groups, ([key, entries]) => {
      const allEntries = allMedicineGroups.find((group) => group.key === key)?.entries;
      return {
        key,
        entries: allEntries ?? entries.sort(compareExpiry),
      };
    });
  }, [allMedicineGroups, filteredMedicines]);

  const preferredBatchByName = useMemo(() => {
    const preferred = new Map<string, MedicineData>();
    for (const group of allMedicineGroups) {
      const available = group.entries.filter((medicine) => !isExpired(medicine, today));
      if (available.length) preferred.set(group.key, available[0]);
    }
    return preferred;
  }, [allMedicineGroups, today]);

  const isLaterExpiryBatch = (medicine: MedicineData) => {
    const preferred = preferredBatchByName.get(medicineGroupKey(medicine));
    const preferredExpiry = preferred?.expiry_date?.slice(0, 10);
    const medicineExpiry = medicine.expiry_date?.slice(0, 10);
    return Boolean(
      preferred &&
        preferred.id !== medicine.id &&
        preferredExpiry &&
        (!medicineExpiry || medicineExpiry > preferredExpiry) &&
        !isExpired(medicine, today),
    );
  };

  const priorityKey = (medicine: MedicineData) => {
    const preferred = preferredBatchByName.get(medicineGroupKey(medicine));
    return preferred ? `${preferred.id}:${medicine.id}` : "";
  };

  const hasAcknowledgedPriority = (medicine: MedicineData) => {
    const key = priorityKey(medicine);
    return Boolean(key && acknowledgedPriority[key]);
  };

  const showPriorityWarning = (intent: PriorityIntent) => {
    setPriorityIntent(intent);
    setPriorityWarningOpen(true);
  };

  const selectedItems = useMemo(
    () =>
      Object.entries(selectedIds)
        .map(([id, quantity]) => {
          const medicine = availableMedicines.find((item) => String(item.id) === id);
          return medicine ? { medicine, quantity } : null;
        })
        .filter((entry): entry is { medicine: MedicineData; quantity: number } => entry !== null),
    [selectedIds, availableMedicines],
  );

  const totalSelectedQuantity = selectedItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalSelectedAmount = selectedItems.reduce(
    (sum, entry) => sum + entry.quantity * Number(entry.medicine.price),
    0,
  );

  const toggleSelected = (medicine: MedicineData, checked: boolean) => {
    if (checked && isExpired(medicine, today)) return;
    if (checked && isLaterExpiryBatch(medicine) && !hasAcknowledgedPriority(medicine)) {
      showPriorityWarning({ kind: "select", medicine });
      return;
    }
    const medicineId = String(medicine.id);
    setSelectedIds((prev) => {
      if (checked) {
        return { ...prev, [medicineId]: prev[medicineId] ?? 1 };
      }
      const next = { ...prev };
      delete next[medicineId];
      return next;
    });
  };

  const updateSelectionQuantity = (medicine: MedicineData, delta: number) => {
    const medicineId = String(medicine.id);
    setSelectedIds((prev) => {
      const current = prev[medicineId];
      if (current == null) return prev;
      const next = Math.min(Math.max(1, current + delta), Math.max(1, Number(medicine.quantity)));
      if (next === current) return prev;
      return { ...prev, [medicineId]: next };
    });
  };

  const clearSelection = () => setSelectedIds({});

  const openOrderDialog = (
    items: { medicine: MedicineData; quantity: number }[],
    type: "single" | "batch",
  ) => {
    setOrderItems(items);
    setOrderType(type);
    setOrderDialogOpen(true);
  };

  const adjustOrderQuantity = (medicineId: string, delta: number) => {
    setOrderItems((items) =>
      items.map((item) => {
        if (String(item.medicine.id) !== medicineId) return item;
        const maxQuantity = Number(item.medicine.quantity);
        return {
          ...item,
          quantity: Math.min(Math.max(1, item.quantity + delta), maxQuantity),
        };
      }),
    );
  };

  const handleConfirmOrder = async () => {
    if (!orderItems.length) return;
    if (orderItems.some(({ medicine }) => isExpired(medicine, format(new Date(), "yyyy-MM-dd")))) {
      setOrderDialogOpen(false);
      toast.error("Expired medicines cannot be sold. Refresh the catalog and select non-expired stock.");
      return;
    }
    const unavailableItem = orderItems.find(
      ({ medicine, quantity }) => quantity > Number(medicine.quantity),
    );
    if (unavailableItem) return;

    const submitted = await onOrder(orderItems);
    if (!submitted) return;

    setOrderDialogOpen(false);
    setOrderItems([]);
    if (orderType === "batch") clearSelection();
  };

  const handleBatchOrder = () => {
    if (!selectedItems.length) return;
    const expiredIds = selectedItems
      .filter(({ medicine }) => isExpired(medicine, today))
      .map(({ medicine }) => String(medicine.id));
    if (expiredIds.length) {
      setSelectedIds((previous) => {
        const next = { ...previous };
        for (const id of expiredIds) delete next[id];
        return next;
      });
      toast.error("Expired medicines cannot be added to an order.");
      return;
    }
    const laterExpiryItems = selectedItems.filter(
      ({ medicine }) => isLaterExpiryBatch(medicine) && !hasAcknowledgedPriority(medicine),
    );
    const intent: PriorityIntent = { kind: "batch", items: selectedItems };
    if (laterExpiryItems.length) {
      showPriorityWarning(intent);
      return;
    }
    openOrderDialog(selectedItems, "batch");
  };

  const handleSingleOrder = (medicine: MedicineData) => {
    if (isExpired(medicine, today)) {
      toast.error("Expired medicines cannot be sold.");
      return;
    }
    const intent: PriorityIntent = { kind: "single", medicine };
    if (isLaterExpiryBatch(medicine)) {
      showPriorityWarning(intent);
      return;
    }
    openOrderDialog([{ medicine, quantity: 1 }], "single");
  };

  const continueAfterPriorityWarning = () => {
    const intent = priorityIntent;
    setPriorityWarningOpen(false);
    setPriorityIntent(null);
    if (!intent) return;

    if (intent.kind === "select") {
      const medicineId = String(intent.medicine.id);
      setSelectedIds((previous) => ({ ...previous, [medicineId]: previous[medicineId] ?? 1 }));
      const key = priorityKey(intent.medicine);
      if (key) setAcknowledgedPriority((previous) => ({ ...previous, [key]: true }));
    } else if (intent.kind === "single") {
      openOrderDialog([{ medicine: intent.medicine, quantity: 1 }], "single");
    } else {
      const acknowledged = Object.fromEntries(
        intent.items
          .filter(({ medicine }) => isLaterExpiryBatch(medicine))
          .map(({ medicine }) => [priorityKey(medicine), true] as const),
      );
      setAcknowledgedPriority((previous) => ({ ...previous, ...acknowledged }));
      openOrderDialog(intent.items, "batch");
    }
  };

  const orderTotal = orderItems.reduce(
    (sum, { medicine, quantity }) => sum + quantity * Number(medicine.price),
    0,
  );
  const hasInsufficientStock = orderItems.some(
    ({ medicine, quantity }) => quantity > Number(medicine.quantity),
  );

  const renderMedicineCard = (medicine: MedicineData) => {
    const quantity = Number(medicine.quantity);
    const isSelected = selectedIds[medicine.id] != null;
    const selectedQuantity = selectedIds[medicine.id] ?? 1;
    const lineTotal = selectedQuantity * Number(medicine.price);
    const expired = isExpired(medicine, today);
    const laterExpiry = isLaterExpiryBatch(medicine);
    const preferredBatch = preferredBatchByName.get(medicineGroupKey(medicine));
    const groupSize =
      allMedicineGroups.find((group) => group.key === medicineGroupKey(medicine))?.entries.length ?? 0;
    const isPreferredBatch = Boolean(preferredBatch && preferredBatch.id === medicine.id && groupSize > 1);
    const expiryDate = medicine.expiry_date?.slice(0, 10);
    const expiresSoon =
      !expired &&
      expiryDate != null &&
      (parseISO(expiryDate).getTime() - parseISO(today).getTime()) / 86_400_000 <= 30;

    return (
      <Card
        key={String(medicine.id)}
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(6,14,26,0.42))] transition-colors motion-safe:hover:translate-y-0 hover:border-apex-orange/30 hover:bg-white/6",
          isSelected && "border-apex-orange/40 bg-[linear-gradient(145deg,rgba(232,149,30,0.075),rgba(6,14,26,0.48))] ring-1 ring-apex-orange/20",
          expired && "border-red-400/20 opacity-75",
        )}
      >
        <CardContent className="flex-1 space-y-2.5 p-3">
          <div className="group/medicine-image relative h-24 overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_35%,rgba(232,149,30,0.16),transparent_55%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(6,14,26,0.82))]">
            {medicine.image_url ? (
              <Image
                src={medicine.image_url}
                alt={`${medicine.name} medicine`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover/medicine-image:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-apex-orange-light/70">
                <span className="flex size-10 items-center justify-center rounded-xl border border-apex-orange/20 bg-[#0b1726]/65 shadow-[0_12px_35px_-18px_rgba(232,149,30,0.8)]">
                  <Package className="size-5" />
                </span>
                <span className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-white/40">
                  Medicine
                </span>
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-semibold text-white/90">{medicine.name}</p>
              <span className="inline-flex items-center gap-1 text-xs text-white/60">
                <Pill className="h-3.5 w-3.5" />
                {categoryLabel(medicine.category)}
              </span>
            </div>
            <Badge variant={getStockTone(quantity)} className="shrink-0">
              {quantity} left
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {expired ? (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <TriangleAlert className="size-3" />
                Expired · not for sale
              </Badge>
            ) : expiryDate ? (
              <Badge
                variant="outline"
                className={cn(
                  "border-white/10 bg-white/[0.035] text-[10px] text-white/60",
                  expiresSoon && "border-amber-300/25 bg-amber-400/10 text-amber-200",
                )}
              >
                {isPreferredBatch
                  ? "Sell first"
                  : laterExpiry
                    ? "Later expiry"
                    : expiresSoon
                      ? "Expires soon"
                      : "Expires"}{" "}
                · {format(parseISO(expiryDate), "MMM d, yyyy")}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/10 bg-white/[0.035] text-[10px] text-white/55">
                No expiry date
              </Badge>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-2 pt-1">
            <span className="font-display text-lg font-semibold text-apex-orange-light">
              {formatCurrency(medicine.price)}
            </span>
            {isSelected ? (
              <span className="text-xs font-semibold tabular-nums text-apex-orange-light/90">
                {formatCurrency(lineTotal)}
              </span>
            ) : null}
          </div>

          {isSelected ? (
            <div className="flex items-center justify-between rounded-xl border border-apex-orange/15 bg-apex-orange/6 px-2 py-1.5">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="border-white/10 bg-white/4 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label={`Decrease ${medicine.name} batch quantity`}
                  disabled={selectedQuantity <= 1}
                  onClick={() => updateSelectionQuantity(medicine, -1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums text-white">
                  {selectedQuantity}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="border-white/10 bg-white/4 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label={`Increase ${medicine.name} batch quantity`}
                  disabled={selectedQuantity >= quantity}
                  onClick={() => updateSelectionQuantity(medicine, 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="text-xs font-medium text-white/55">in batch</span>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="items-center justify-between gap-2 border-t border-white/8 bg-[#060e1a]/35 p-3">
          <label
            className={cn(
              "flex items-center gap-2 text-xs font-medium",
              expired ? "cursor-not-allowed text-white/35" : "cursor-pointer text-white/70",
            )}
          >
            <Checkbox
              checked={isSelected}
              disabled={expired}
              onCheckedChange={(checked) => toggleSelected(medicine, checked === true)}
            />
            Batch
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5 border-apex-orange/20 bg-apex-orange/10 text-apex-orange-light hover:border-apex-orange/35 hover:bg-apex-orange/15 hover:text-white"
            disabled={loading || expired}
            onClick={() => handleSingleOrder(medicine)}
          >
            <Plus className="h-3.5 w-3.5" />
            {expired ? "Expired" : "Order now"}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const warningMedicine = priorityIntent
    ? priorityIntent.kind === "batch"
      ? priorityIntent.items.find(({ medicine }) => isLaterExpiryBatch(medicine))?.medicine
      : priorityIntent.medicine
    : undefined;
  const warningPreferredBatch = warningMedicine
    ? preferredBatchByName.get(medicineGroupKey(warningMedicine))
    : undefined;
  const warningBatchCount =
    priorityIntent?.kind === "batch"
      ? priorityIntent.items.filter(
          ({ medicine }) => isLaterExpiryBatch(medicine) && !hasAcknowledgedPriority(medicine),
        ).length
      : 1;

  return (
    <Card className="workspace-panel-surface gap-3 rounded-[1.75rem] border-apex-orange/16 p-4 sm:gap-4 sm:p-6">
      <CardHeader className="flex flex-col gap-4 px-1 pt-1 sm:flex-row sm:items-center sm:justify-between sm:px-0 sm:pt-0">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-apex-orange/25 bg-apex-orange/10 text-apex-orange-light shadow-[inset_0_1px_0_rgba(255,214,160,0.08)]">
            <Pill className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.22em] text-apex-orange-light/85">
              Inventory · Order desk
            </p>
            <CardTitle className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Medicine catalog
            </CardTitle>
            <CardDescription className="max-w-2xl leading-relaxed text-white/60">
              Search and filter the catalog, then order one medicine or select several for a batch.
            </CardDescription>
          </div>
        </div>
        <Button
          type="button"
          className="h-10 shrink-0 gap-1.5 bg-[linear-gradient(135deg,var(--apex-orange),#c9760f)] text-white shadow-[0_12px_30px_-18px_rgba(232,149,30,0.75)] hover:brightness-110"
          disabled={loading || !selectedItems.length}
          onClick={handleBatchOrder}
        >
          <ShoppingBag className="h-4 w-4" />
          {selectedItems.length ? `Order selected (${selectedItems.length})` : "Select items to order"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5 px-1 pb-6 sm:px-0">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/2.5 p-3 sm:flex-row sm:items-center sm:p-3.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apex-orange-light/70" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by medicine, supplier, or batch…"
              className="h-11 rounded-xl border-white/10 bg-[#060e1a]/65 pl-9 text-white placeholder:text-white/45 focus-visible:border-apex-orange/45 focus-visible:ring-apex-orange/20"
            />
          </div>
          <div className="sm:w-72">
            <Combobox
              value={selectedCategory}
              onChange={onSelectCategory}
              options={categoryOptions}
              placeholder="Filter by category…"
              searchPlaceholder="Search category…"
              emptyText="No category found."
            />
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/3 py-16 text-center">
            <Package className="mb-3 h-10 w-10 text-white/25" />
            <p className="font-medium text-white/85">No medicines match</p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/55">
              {availableMedicines.length === 0
                ? "Add stock in the medicine inventory to start selling."
                : "Try another category or clear your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {medicineGroups.map(({ key, entries }) =>
              entries.length > 1 ? (
                <Collapsible key={key} className="col-span-full">
                  <div className="overflow-hidden rounded-2xl border border-apex-orange/18 bg-[linear-gradient(135deg,rgba(232,149,30,0.07),rgba(11,25,46,0.8)_42%,rgba(6,14,26,0.92))] shadow-[inset_0_1px_0_rgba(255,214,160,0.05)]">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="group/collapse flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.035] sm:px-5"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-apex-orange/25 bg-apex-orange/10 text-apex-orange-light">
                            <Pill className="size-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-white/90">{entries[0].name}</span>
                            <span className="mt-1 block text-xs text-apex-orange-light/80">
                              {categoryLabel(entries[0].category)}
                            </span>
                            <span className="mt-1 block text-xs text-white/50">
                              {entries.length} batches · {entries.reduce((sum, item) => sum + Number(item.quantity), 0)} units in stock
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={preferredBatchByName.has(key) ? "secondary" : "destructive"}
                            className={cn(
                              preferredBatchByName.has(key)
                                ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
                                : "border-red-400/20 bg-red-500/10 text-red-200",
                            )}
                          >
                            {preferredBatchByName.has(key)
                              ? "Sell earliest expiry first"
                              : "All batches expired"}
                          </Badge>
                          <ChevronDown className="size-4 text-white/55 transition-transform group-data-[state=open]/collapse:rotate-180" />
                        </span>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-white/8 bg-black/10 p-3 sm:p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                          {entries.map(renderMedicineCard)}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ) : (
                renderMedicineCard(entries[0])
              ),
            )}
          </div>
        )}
      </CardContent>

      {selectedItems.length > 0 ? (
        <div className="sticky bottom-3 -mx-1 mt-5 rounded-2xl border border-apex-orange/20 bg-[linear-gradient(110deg,rgba(11,25,46,0.98),rgba(6,14,26,0.98))] px-4 py-3.5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:bottom-4 sm:mx-0 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apex-orange/12 text-apex-orange-light">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">
                  {selectedItems.length} selected · {totalSelectedQuantity} units
                </p>
                <p className="text-xs text-white/60">Ready for batch order</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-lg font-semibold tabular-nums text-apex-orange-light">
                {formatCurrency(totalSelectedAmount)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/12 bg-white/5"
                disabled={loading}
                onClick={clearSelection}
              >
                Clear
              </Button>
              <Button
                type="button"
                className="gap-1.5 bg-[linear-gradient(135deg,var(--apex-orange),#c9760f)] text-white shadow-[0_12px_30px_-18px_rgba(232,149,30,0.75)] hover:brightness-110"
                disabled={loading}
                onClick={handleBatchOrder}
              >
                <ShoppingBag className="h-4 w-4" />
                Review batch · {selectedItems.length}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AlertDialog
        open={priorityWarningOpen}
        onOpenChange={(open) => {
          setPriorityWarningOpen(open);
          if (!open) setPriorityIntent(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="border border-amber-300/20 bg-amber-400/10 text-amber-200">
              <TriangleAlert />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-white">
              Check the expiry order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/65">
              {priorityIntent?.kind === "batch" ? (
                <>
                  {warningBatchCount} selected {warningBatchCount === 1 ? "batch expires" : "batches expire"} later than another available batch of the same medicine.
                  Sell the earlier-expiring stock first. Do you want to continue with this batch order?
                </>
              ) : warningMedicine && warningPreferredBatch ? (
                <>
                  This batch expires later than{" "}
                  <span className="font-semibold text-white">{warningPreferredBatch.name}</span>
                  {warningPreferredBatch.expiry_date
                    ? ` (${format(parseISO(warningPreferredBatch.expiry_date), "MMM d, yyyy")})`
                    : ""}
                  . Sell the earlier-expiring stock first. Do you want to continue with{" "}
                  <span className="font-semibold text-white">{warningMedicine.name}</span>?
                </>
              ) : (
                "Another batch of this medicine should be sold first. Do you want to continue?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setPriorityIntent(null)}
            >
              Go back
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-apex-orange text-white hover:bg-apex-orange-light"
              onClick={continueAfterPriorityWarning}
            >
              Continue anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={orderDialogOpen}
        onOpenChange={(open) => {
          if (!loading) setOrderDialogOpen(open);
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          onEscapeKeyDown={(event) => {
            if (loading) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (loading) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {orderType === "batch" ? "Confirm batch order" : "Confirm order"}
            </DialogTitle>
            <DialogDescription>
              Review the medicine, quantity, and total before recording this sale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {orderItems.map(({ medicine, quantity }) => (
              <div
                key={medicine.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/4 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white/90">{medicine.name}</p>
                      <p className="mt-1 truncate text-xs text-white/50">
                        Batch {medicine.batch_number || "—"}
                        {medicine.expiry_date
                          ? ` · Expires ${format(parseISO(medicine.expiry_date), "MMM d, yyyy")}`
                          : " · No expiry date"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-white/12 bg-white/5"
                      aria-label={`Decrease ${medicine.name} quantity`}
                      disabled={loading || quantity <= 1}
                      onClick={() => adjustOrderQuantity(String(medicine.id), -1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-white">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="border-white/12 bg-white/5"
                      aria-label={`Increase ${medicine.name} quantity`}
                      disabled={loading || quantity >= Number(medicine.quantity)}
                      onClick={() => adjustOrderQuantity(String(medicine.id), 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-white/45">
                      {quantity} × {formatCurrency(medicine.price)} · {medicine.quantity} available
                    </span>
                  </div>
                  {quantity > Number(medicine.quantity) ? (
                    <p className="mt-1 text-sm font-medium text-red-300">
                      Only {medicine.quantity} in stock.
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 font-semibold tabular-nums text-apex-orange-light">
                  {formatCurrency(quantity * Number(medicine.price))}
                </p>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-white/55">Total</p>
              <p className="font-display text-xl font-semibold tabular-nums text-apex-orange-light">
                {formatCurrency(orderTotal)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOrderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading || !orderItems.length || hasInsufficientStock}
              onClick={() => void handleConfirmOrder()}
            >
              {loading
                ? "Recording…"
                : orderType === "batch"
                  ? "Confirm batch order"
                  : "Confirm order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
