"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  LayoutGrid,
  Package,
  Pill,
  Percent,
  Plus,
  ReceiptText,
  Scissors,
  Search,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
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
import { hasStock, isSplittable, looseName, maxQuantity, packName, plural, stockText, unitPrice, unitWord, type SaleUnit } from "@/lib/packSelling";
import { SaleUnitToggle } from "@/components/pharmacist/SaleUnitToggle";
import { QuantityStepper } from "@/components/pharmacist/QuantityStepper";
import type { DiscountRuleData, MedicineData } from "@/lib/actions";

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
  | { kind: "batch"; items: { medicine: MedicineData; quantity: number; saleUnit?: SaleUnit }[] };

export type MedicineSaleRuleHint = {
  kind: "needs_approval" | "quantity_band";
  threshold?: number;
  final?: number | null;
  unit?: "pack" | "loose";
};

const NO_CUSTOMER = "__none__";
const NO_DISCOUNT_RULES: DiscountRuleData[] = [];

export function MedicineCatalog({
  medicines,
  selectedCategory,
  onSelectCategory,
  loading,
  onOrder,
  saleRulesByMedicineId = {},
  discountRules = NO_DISCOUNT_RULES,
}: {
  medicines: MedicineData[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  loading: boolean;
  onOrder: (
    items: { medicine: MedicineData; quantity: number; saleUnit?: SaleUnit }[],
    customerName?: string,
  ) => Promise<boolean>;
  saleRulesByMedicineId?: Record<string, MedicineSaleRuleHint>;
  discountRules?: DiscountRuleData[];
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, number>>({});
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"single" | "batch">("single");
  const [orderItems, setOrderItems] = useState<{ medicine: MedicineData; quantity: number; saleUnit?: SaleUnit }[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, SaleUnit>>({});
  const [customerKey, setCustomerKey] = useState(NO_CUSTOMER);
  const [priorityIntent, setPriorityIntent] = useState<PriorityIntent | null>(null);
  const [priorityWarningOpen, setPriorityWarningOpen] = useState(false);
  const [acknowledgedPriority, setAcknowledgedPriority] = useState<Record<string, true>>({});
  const today = format(new Date(), "yyyy-MM-dd");

  const availableMedicines = useMemo(
    () => medicines.filter((medicine) => hasStock(medicine)),
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
          return medicine ? { medicine, quantity, saleUnit: selectedUnits[id] ?? ("pack" as SaleUnit) } : null;
        })
        .filter((entry): entry is { medicine: MedicineData; quantity: number; saleUnit: SaleUnit } => entry !== null),
    [selectedIds, availableMedicines, selectedUnits],
  );

  const totalSelectedQuantity = selectedItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalSelectedAmount = selectedItems.reduce(
    (sum, entry) => sum + entry.quantity * unitPrice(entry.medicine, entry.saleUnit),
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

  const setSelectionQuantity = (medicine: MedicineData, quantity: number) => {
    const medicineId = String(medicine.id);
    const limit = Math.max(1, maxQuantity(medicine, selectedUnits[medicineId] ?? "pack"));
    const next = Math.min(Math.max(1, Math.round(quantity)), limit);
    setSelectedIds((prev) => (prev[medicineId] == null || prev[medicineId] === next ? prev : { ...prev, [medicineId]: next }));
  };

  const setSelectionUnit = (medicine: MedicineData, unit: SaleUnit) => {
    const medicineId = String(medicine.id);
    setSelectedUnits((prev) => ({ ...prev, [medicineId]: unit }));
    // A different unit is a different count: start again from one.
    setSelectedIds((prev) => (prev[medicineId] == null ? prev : { ...prev, [medicineId]: 1 }));
  };

  const clearSelection = () => setSelectedIds({});

  const openOrderDialog = (
    items: { medicine: MedicineData; quantity: number; saleUnit?: SaleUnit }[],
    type: "single" | "batch",
  ) => {
    setOrderItems(items);
    setOrderType(type);
    setCustomerKey(NO_CUSTOMER);
    setOrderDialogOpen(true);
  };

  const setOrderQuantity = (medicineId: string, quantity: number) => {
    setOrderItems((items) =>
      items.map((item) => {
        if (String(item.medicine.id) !== medicineId) return item;
        const limit = Math.max(1, maxQuantity(item.medicine, item.saleUnit ?? "pack"));
        return { ...item, quantity: Math.min(Math.max(1, Math.round(quantity)), limit) };
      }),
    );
  };

  const setOrderUnit = (medicineId: string, unit: SaleUnit) => {
    setOrderItems((items) =>
      items.map((item) => (String(item.medicine.id) === medicineId ? { ...item, saleUnit: unit, quantity: 1 } : item)),
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
      ({ medicine, quantity, saleUnit }) => quantity > maxQuantity(medicine, saleUnit ?? "pack"),
    );
    if (unavailableItem) return;

    const submitted = await onOrder(orderItems, selectedCustomer?.name);
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
    openOrderDialog([{ medicine, quantity: 1, saleUnit: "pack" }], "single");
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

  const customerOptions = useMemo<ComboboxOption[]>(() => {
    const seen = new Map<string, string>();
    for (const rule of discountRules) {
      const key = rule.customer_name.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, rule.customer_name);
    }
    return [
      { value: NO_CUSTOMER, label: "No customer (full price)" },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([key, name]) => ({ value: key, label: name })),
    ];
  }, [discountRules]);

  // Highest percentage per medicine name across all of the selected customer's rules.
  const selectedCustomer = (() => {
    if (customerKey === NO_CUSTOMER) return null;
    const rules = discountRules.filter(
      (rule) => rule.customer_name.trim().toLowerCase() === customerKey,
    );
    if (!rules.length) return null;
    const percentByName = new Map<string, number>();
    let customerName = "";
    for (const rule of rules) {
      customerName = customerName || rule.customer_name;
      const percent = Number(rule.percentage);
      for (const name of rule.medicine_names) {
        const nameKey = name.trim().toLowerCase();
        if (percent > (percentByName.get(nameKey) ?? 0)) percentByName.set(nameKey, percent);
      }
    }
    return { name: customerName, percentByName };
  })();

  const discountedUnitPrice = (medicine: MedicineData, saleUnit: SaleUnit = "pack") => {
    const base = unitPrice(medicine, saleUnit);
    const percent = selectedCustomer?.percentByName.get(medicine.name.trim().toLowerCase());
    if (!percent) return { unit: base, percent: 0 };
    const unit = Math.max(0.01, Math.round(base * (100 - percent)) / 100);
    return { unit, percent };
  };

  const orderTotal = orderItems.reduce(
    (sum, { medicine, quantity, saleUnit }) => sum + quantity * discountedUnitPrice(medicine, saleUnit ?? "pack").unit,
    0,
  );
  const orderListTotal = orderItems.reduce(
    (sum, { medicine, quantity, saleUnit }) => sum + quantity * unitPrice(medicine, saleUnit ?? "pack"),
    0,
  );
  const orderSavings = Math.max(0, orderListTotal - orderTotal);
  const hasInsufficientStock = orderItems.some(
    ({ medicine, quantity, saleUnit }) => quantity > maxQuantity(medicine, saleUnit ?? "pack"),
  );

  const renderMedicineCard = (medicine: MedicineData) => {
    const quantity = Number(medicine.quantity);
    const isSelected = selectedIds[medicine.id] != null;
    const selectedQuantity = selectedIds[medicine.id] ?? 1;
    const cardUnit: SaleUnit = selectedUnits[medicine.id] ?? "pack";
    const splittable = isSplittable(medicine);
    const cardMax = maxQuantity(medicine, cardUnit);
    const lineTotal = selectedQuantity * unitPrice(medicine, cardUnit);
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
    const saleRule = saleRulesByMedicineId[String(medicine.id)];
    const saleRuleLabel = saleRule
      ? saleRule.kind === "needs_approval"
        ? "Manager approval · may take a moment"
        : saleRule.final != null
          ? `Qty ${saleRule.threshold}–${saleRule.final}${saleRule.unit === "loose" ? ` ${plural(looseName(medicine), 2)}` : ""} may need manager`
          : `Qty ≥ ${saleRule.threshold}${saleRule.unit === "loose" ? ` ${plural(looseName(medicine), 2)}` : ""} may need manager`
      : null;

    return (
      <Card
        key={String(medicine.id)}
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(6,5,26,0.42))] transition-colors motion-safe:hover:translate-y-0 hover:border-apex-orange/30 hover:bg-white/6",
          isSelected && "border-apex-orange/40 bg-[linear-gradient(145deg,rgba(168,85,247,0.075),rgba(6,5,26,0.48))] ring-1 ring-apex-orange/20",
          expired && "border-red-400/20 opacity-75",
        )}
      >
        <CardContent className="flex-1 space-y-2.5 p-3">
          <div className="group/medicine-image relative h-24 overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_35%,rgba(168,85,247,0.16),transparent_55%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(6,5,26,0.82))]">
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
                <span className="flex size-10 items-center justify-center rounded-xl border border-apex-orange/20 bg-[#0c0a2a]/65 shadow-[0_12px_35px_-18px_rgba(168,85,247,0.8)]">
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
            <Badge variant={getStockTone(quantity)} className="shrink-0 whitespace-normal text-right leading-tight">
              {splittable ? stockText(medicine) : `${quantity} left`}
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
            {saleRuleLabel ? (
              <Badge
                variant="outline"
                className="max-w-full gap-1 border-sky-300/25 bg-sky-400/10 text-[10px] leading-tight text-sky-100"
                title="Settling this sale may take some time while the manager reviews it."
              >
                <Clock3 className="size-3 shrink-0" />
                {saleRuleLabel}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-baseline justify-between gap-2 pt-1">
            <span className="flex flex-col leading-tight">
              <span className="font-display text-lg font-semibold text-apex-orange-light">
                {formatCurrency(medicine.price)}
                {splittable ? <span className="ml-1 text-[0.65rem] font-medium text-white/45">/ {packName(medicine)}</span> : null}
              </span>
              {splittable ? (
                <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-fuchsia-200/90">
                  <Scissors className="size-3" />
                  {formatCurrency(unitPrice(medicine, "loose"))} / {looseName(medicine)}
                  <span className="font-normal text-white/40">· {medicine.pack_size} per {packName(medicine)}</span>
                </span>
              ) : null}
            </span>
            {isSelected ? (
              <span className="text-xs font-semibold tabular-nums text-apex-orange-light/90">
                {formatCurrency(lineTotal)}
              </span>
            ) : null}
          </div>

          {isSelected && splittable ? (
            <SaleUnitToggle medicine={medicine} value={cardUnit} onChange={(unit) => setSelectionUnit(medicine, unit)} compact />
          ) : null}

          {isSelected ? (
            <div className="flex items-center justify-between rounded-xl border border-apex-orange/15 bg-apex-orange/6 px-2 py-1.5">
              <QuantityStepper
                size="sm"
                label={`${medicine.name} batch`}
                value={selectedQuantity}
                max={cardMax}
                onChange={(n) => setSelectionQuantity(medicine, n)}
              />
              <span className="text-xs font-medium text-white/55">{splittable ? unitWord(medicine, cardUnit, selectedQuantity) : "in batch"}</span>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="items-center justify-between gap-2 border-t border-white/8 bg-[#06051a]/35 p-3">
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-apex-orange/25 bg-apex-orange/10 text-apex-orange-light shadow-[inset_0_1px_0_rgba(233,213,255,0.08)]">
            <Pill className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-apex-orange-light/85">
              Inventory · Order desk
            </p>
            <CardTitle className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Medicine catalog
            </CardTitle>
            <CardDescription className="max-w-2xl leading-relaxed text-white/60">
              Search and filter, then order one medicine or batch several.
            </CardDescription>
          </div>
        </div>
        <Button
          type="button"
          className="h-10 shrink-0 gap-1.5 bg-[linear-gradient(135deg,var(--apex-orange),#7e22ce)] text-white shadow-[0_12px_30px_-18px_rgba(168,85,247,0.75)] hover:brightness-110"
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
              className="h-11 rounded-xl border-white/10 bg-[#06051a]/65 pl-9 text-white placeholder:text-white/45 focus-visible:border-apex-orange/45 focus-visible:ring-apex-orange/20"
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
                  <div className="overflow-hidden rounded-2xl border border-apex-orange/18 bg-[linear-gradient(135deg,rgba(168,85,247,0.07),rgba(13,11,43,0.8)_42%,rgba(6,5,26,0.92))] shadow-[inset_0_1px_0_rgba(233,213,255,0.05)]">
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
        <div className="sticky bottom-3 -mx-1 mt-5 rounded-2xl border border-apex-orange/20 bg-[linear-gradient(110deg,rgba(13,11,43,0.98),rgba(6,5,26,0.98))] px-4 py-3.5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:bottom-4 sm:mx-0 sm:px-5">
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
                className="gap-1.5 bg-[linear-gradient(135deg,var(--apex-orange),#7e22ce)] text-white shadow-[0_12px_30px_-18px_rgba(168,85,247,0.75)] hover:brightness-110"
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
          className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-xl"
          onEscapeKeyDown={(event) => {
            if (loading) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (loading) event.preventDefault();
          }}
        >
          <DialogHeader className="border-b border-white/10 bg-[linear-gradient(100deg,rgba(168,85,247,0.22),rgba(236,72,153,0.1)_55%,transparent)] px-6 py-5 pr-14 text-left">
            <div className="flex items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/35 bg-fuchsia-400/15 text-fuchsia-100 shadow-[0_10px_26px_-14px_rgba(217,70,239,0.9)]">
                {orderType === "batch" ? <ShoppingBag className="size-6" /> : <ReceiptText className="size-6" />}
              </span>
              <div className="min-w-0">
                <DialogTitle className="font-display text-xl font-bold text-white">
                  {orderType === "batch" ? "Confirm batch order" : "Confirm order"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-white/60">
                  {orderItems.length} item{orderItems.length === 1 ? "" : "s"} · check quantities, then record the sale
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-2xl border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(168,85,247,0.06))] p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-200">
                <Percent className="size-3.5" />
                Customer discount · optional
              </p>
              <Combobox
                value={customerKey}
                onChange={setCustomerKey}
                options={customerOptions}
                placeholder="Select a customer…"
                searchPlaceholder="Search customers…"
                emptyText="No saved customers."
                disabled={loading}
              />
              {selectedCustomer ? (
                <p className="mt-2 text-xs text-cyan-100/70">Discounted items show their lower price below.</p>
              ) : null}
            </div>

            <div className="space-y-3">
              {orderItems.map(({ medicine, quantity, saleUnit = "pack" }) => {
                const { unit, percent } = discountedUnitPrice(medicine, saleUnit);
                const limit = maxQuantity(medicine, saleUnit);
                const splittable = isSplittable(medicine);
                const fullPrice = unitPrice(medicine, saleUnit);
                const over = quantity > limit;
                return (
                  <div
                    key={medicine.id}
                    className={cn(
                      "rounded-2xl border bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(6,5,26,0.5))] p-3.5",
                      over ? "border-red-400/45" : "border-white/12",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-[radial-gradient(ellipse_at_50%_35%,rgba(168,85,247,0.2),transparent_60%),#0c0a2a]">
                        {medicine.image_url ? (
                          <Image src={medicine.image_url} alt={medicine.name} fill sizes="56px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-apex-orange-light/70">
                            <Package className="size-6" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-display text-base font-bold text-white">{medicine.name}</p>
                            <p className="mt-0.5 truncate text-xs text-white/50">
                              Batch {medicine.batch_number || "—"}
                              {medicine.expiry_date ? ` · Exp ${format(parseISO(medicine.expiry_date), "MMM d, yyyy")}` : ""}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {percent ? (
                              <p className="text-[0.7rem] tabular-nums text-white/40 line-through">{formatCurrency(quantity * fullPrice)}</p>
                            ) : null}
                            <p className="font-display text-lg font-bold tabular-nums text-apex-orange-light">
                              {formatCurrency(quantity * unit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t border-white/8 pt-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {splittable ? (
                          <SaleUnitToggle medicine={medicine} value={saleUnit} disabled={loading} onChange={(u) => setOrderUnit(String(medicine.id), u)} />
                        ) : null}
                        <QuantityStepper
                          label={medicine.name}
                          value={quantity}
                          max={limit}
                          disabled={loading}
                          onChange={(n) => setOrderQuantity(String(medicine.id), n)}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1.5 text-[0.7rem]">
                        <span className="rounded-full border border-white/12 bg-white/6 px-2 py-0.5 tabular-nums text-white/70">
                          {formatCurrency(unit)} / {splittable && saleUnit === "loose" ? looseName(medicine) : packName(medicine)}
                        </span>
                        <span className="rounded-full border border-white/12 bg-white/6 px-2 py-0.5 tabular-nums text-white/60">
                          {limit} available
                        </span>
                        {percent ? (
                          <span className="rounded-full border border-emerald-400/35 bg-emerald-400/12 px-2 py-0.5 font-bold text-emerald-200">
                            {percent}% off
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {over ? (
                      <p className="mt-2.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
                        Only {limit} {unitWord(medicine, saleUnit, limit)} in stock.
                      </p>
                    ) : splittable && saleUnit === "loose" && quantity > Number(medicine.loose_stock || 0) ? (
                      <p className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-fuchsia-300/20 bg-fuchsia-400/8 px-3 py-1.5 text-xs text-fuchsia-100/85">
                        <Scissors className="size-3.5 shrink-0" />
                        {Number(medicine.loose_stock || 0) > 0
                          ? `Uses the ${medicine.loose_stock} left in the opened ${packName(medicine)}, then opens a new one.`
                          : `Opens a new ${packName(medicine)}.`}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-fuchsia-300/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.1)_60%,rgba(10,8,40,0.6))]">
              {orderSavings > 0.004 ? (
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-sm">
                  <span className="text-white/65">Subtotal</span>
                  <span className="tabular-nums text-white/55 line-through">{formatCurrency(orderListTotal)}</span>
                </div>
              ) : null}
              {orderSavings > 0.004 ? (
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-200">
                    <Percent className="size-3.5" />
                    Customer discount
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-200">− {formatCurrency(orderSavings)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">Total</span>
                <span className="font-display text-3xl font-bold tabular-nums text-white">{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-white/10 bg-[#07061f]/60 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" disabled={loading} onClick={() => setOrderDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="min-w-44 bg-[linear-gradient(120deg,#7439e0,#b82bd0_52%,#ea4466)] text-white shadow-[0_12px_28px_-14px_rgba(184,43,208,0.8)] hover:brightness-110"
              disabled={loading || !orderItems.length || hasInsufficientStock}
              onClick={() => void handleConfirmOrder()}
            >
              {loading ? "Recording…" : orderType === "batch" ? "Confirm batch order" : "Confirm order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
