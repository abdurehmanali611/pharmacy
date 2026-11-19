"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import {
  Layers,
  LayoutGrid,
  Package,
  Pill,
  Search,
  ShieldAlert,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { AddLineBar, LineNumber, tableHeadClass } from "@/components/manager/kit";
import {
  WorkspaceModuleHeader,
  workspaceInnerPanelClass,
  workspacePanelClass,
} from "@/components/manager/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, MultiCombobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DRUG_CATEGORIES } from "@/constants";
import {
  createBulkApprovalRequired,
  createBulkQuantitySaleRules,
  deleteApprovalRequiredMedicine,
  deleteQuantitySaleRule,
  type ApprovalRequiredMedicineData,
  type MedicineData,
  type QuantitySaleRuleData,
} from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type RuleLine = {
  id: string;
  medicine_ids: string[];
  threshold: string;
  final: string;
};

const emptyLine = (): RuleLine => ({
  id: Math.random().toString(36).slice(2, 9),
  medicine_ids: [],
  threshold: "",
  final: "",
});

function categoryLabel(value?: string) {
  return DRUG_CATEGORIES.find((item) => item.value === value)?.name ?? "Uncategorized";
}

function getStockTone(quantity: number) {
  if (quantity <= 5) return "destructive" as const;
  if (quantity <= 20) return "secondary" as const;
  return "outline" as const;
}

function isExpired(medicine: MedicineData, today: string) {
  return Boolean(medicine.expiry_date && medicine.expiry_date.slice(0, 10) < today);
}

export function SalesRulesSection({
  medicines,
  quantityRules,
  approvalRequired,
  loading,
  onRefresh,
}: {
  medicines: MedicineData[];
  quantityRules: QuantitySaleRuleData[];
  approvalRequired: ApprovalRequiredMedicineData[];
  loading: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<RuleLine[]>(() => [emptyLine()]);
  const [savingRules, setSavingRules] = useState(false);
  const [savingApproval, setSavingApproval] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const today = format(new Date(), "yyyy-MM-dd");

  const usedQuantityIds = useMemo(() => {
    const saved = new Set(quantityRules.map((r) => String(r.medicine_id)));
    const approval = new Set(approvalRequired.map((r) => String(r.medicine_id)));
    return { saved, approval };
  }, [quantityRules, approvalRequired]);

  const approvalMedicineIds = useMemo(
    () => new Set(approvalRequired.map((r) => String(r.medicine_id))),
    [approvalRequired],
  );

  const medicineOptionsForLine = (lineId: string) => {
    const selectedElsewhere = new Set(
      lines
        .filter((l) => l.id !== lineId)
        .flatMap((l) => l.medicine_ids),
    );
    return medicines
      .filter((m) => {
        const id = String(m.id);
        if (usedQuantityIds.saved.has(id)) return false;
        if (usedQuantityIds.approval.has(id)) return false;
        if (selectedElsewhere.has(id)) return false;
        return true;
      })
      .map((m) => ({
        value: String(m.id),
        label: m.name,
        hint: `Stock ${m.quantity}`,
      }));
  };

  const catalogMedicines = useMemo(
    () =>
      medicines.filter((m) => {
        const id = String(m.id);
        return !usedQuantityIds.saved.has(id);
      }),
    [medicines, usedQuantityIds.saved],
  );

  const categoryOptions = useMemo<ComboboxOption[]>(() => {
    const counts = new Map<string, number>();
    for (const medicine of catalogMedicines) {
      const key = medicine.category ?? "other";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [
      {
        value: "all",
        label: "All categories",
        hint: "show everything",
        icon: <LayoutGrid className="h-4 w-4 text-white/50" />,
        count: catalogMedicines.length,
      },
      ...DRUG_CATEGORIES.map((item) => ({
        value: item.value,
        label: item.name,
        keywords: item.value,
        icon: <Pill className="h-4 w-4 text-white/50" />,
        count: counts.get(item.value) ?? 0,
      })),
    ];
  }, [catalogMedicines]);

  const filteredMedicines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalogMedicines.filter((m) => {
      const categoryOk = selectedCategory === "all" || m.category === selectedCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      return [m.name, m.supplier_name, m.batch_number, categoryLabel(m.category)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [catalogMedicines, search, selectedCategory]);

  const updateLine = (id: string, patch: Partial<RuleLine>) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };

  const saveQuantityRules = async () => {
    const payload: { medicine_id: number; threshold: number; final?: number | null }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.medicine_ids.length) {
        toast.error(`Line #${i + 1}: Select at least one medicine`);
        return;
      }
      const threshold = Number(line.threshold);
      if (!threshold || threshold < 1) {
        toast.error(`Line #${i + 1}: Enter a valid threshold`);
        return;
      }
      let final: number | null = null;
      if (line.final.trim()) {
        final = Number(line.final);
        if (!final || final < threshold) {
          toast.error(`Line #${i + 1}: Final must be ≥ threshold`);
          return;
        }
      }
      for (const medicineId of line.medicine_ids) {
        payload.push({
          medicine_id: Number(medicineId),
          threshold,
          final,
        });
      }
    }

    const ids = payload.map((item) => item.medicine_id);
    if (ids.length !== new Set(ids).size) {
      toast.error("A medicine was selected on more than one line");
      return;
    }

    const result = await createBulkQuantitySaleRules(payload, setSavingRules);
    if (result) {
      setLines([emptyLine()]);
      await onRefresh();
    }
  };

  const markNeedsApproval = async () => {
    if (!selectedIds.size) {
      toast.error("Select at least one medicine");
      return;
    }
    const ids = [...selectedIds].map(Number);
    const result = await createBulkApprovalRequired(ids, setSavingApproval);
    if (result) {
      setSelectedIds(new Set());
      await onRefresh();
    }
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <section className={cn(workspacePanelClass)}>
        <WorkspaceModuleHeader
          kicker="Manager · Controls"
          title="Sales rules"
          description="Set quantity bands that count as “many,” and mark items that always need your approval before a sale settles."
        />
      </section>

      <section className={cn(workspacePanelClass, "p-5 sm:p-6")}>
        <header className="mb-4 flex items-start gap-3 border-b border-white/10 pb-4">
          <span className="tint-icon tint-violet flex h-11 w-11 items-center justify-center rounded-2xl">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-xl font-bold text-white">Quantity bands</h3>
            <p className="text-sm text-white/60">
              Pick multiple medicines per line to share the same threshold and optional final.
              Empty final means ≥ threshold. Already-ruled medicines stay unavailable.
            </p>
          </div>
        </header>

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className={cn(
                workspaceInnerPanelClass,
                "grid items-center gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto]",
                ["tint-violet", "tint-cyan", "tint-pink", "tint-emerald", "tint-amber"][index % 5],
              )}
            >
              <div>
                <p className="mb-1.5 flex h-7 items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                  <LineNumber index={index} />
                  Medicines
                </p>
                <MultiCombobox
                  values={line.medicine_ids}
                  onChange={(values) => updateLine(line.id, { medicine_ids: values })}
                  options={medicineOptionsForLine(line.id)}
                  placeholder="Select one or more medicines…"
                  searchPlaceholder="Search medicines…"
                />
              </div>
              <div>
                <p className="mb-1.5 flex h-7 items-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                  Threshold
                </p>
                <Input
                  type="number"
                  min={1}
                  value={line.threshold}
                  onChange={(e) => updateLine(line.id, { threshold: e.target.value })}
                  className="h-11 border-white/14 bg-[#120f3a] text-white"
                />
              </div>
              <div>
                <p className="mb-1.5 flex h-7 items-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                  Final (opt.)
                </p>
                <Input
                  type="number"
                  min={Number(line.threshold) || 1}
                  value={line.final}
                  onChange={(e) => updateLine(line.id, { final: e.target.value })}
                  className="h-11 border-white/14 bg-[#120f3a] text-white"
                  placeholder="≥ thr"
                />
              </div>
              <div className="flex h-11 items-center self-start pt-0 mt-[2.125rem]">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-rose-300"
                  disabled={lines.length === 1}
                  onClick={() =>
                    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== line.id) : prev))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <AddLineBar label="Add another line" onClick={() => setLines((prev) => [...prev, emptyLine()])} />
          <Button
            type="button"
            className="min-w-48"
            disabled={savingRules || loading}
            onClick={() => void saveQuantityRules()}
          >
            Save quantity rules
          </Button>
        </div>

        {quantityRules.length ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className={tableHeadClass}>Medicine</TableHead>
                  <TableHead className={tableHeadClass}>Band</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quantityRules.map((rule) => (
                  <TableRow key={rule.id} className="border-white/10">
                    <TableCell className="font-medium text-white">{rule.medicine_name}</TableCell>
                    <TableCell className="text-white/80">
                      {rule.final == null
                        ? `≥ ${rule.threshold}`
                        : `${rule.threshold} – ${rule.final}`}
                    </TableCell>
                    <TableCell>
                      <ConfirmDeleteButton
                        title="Remove quantity rule?"
                        description={`Remove the band for ${rule.medicine_name}.`}
                        onConfirm={async () => {
                          const ok = await deleteQuantitySaleRule(rule.id);
                          if (ok) await onRefresh();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </section>

      <section className={cn(workspacePanelClass, "p-5 sm:p-6")}>
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-start gap-3">
            <span className="tint-icon tint-amber flex h-11 w-11 items-center justify-center rounded-2xl">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-white">Needs approval</h3>
              <p className="text-sm text-white/60">
                Same catalog layout as the pharmacist desk. Select cards, then mark them for approval.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="bg-amber-500 text-[#0c0a2a] hover:bg-amber-400"
            disabled={!selectedIds.size || savingApproval || loading}
            onClick={() => void markNeedsApproval()}
          >
            Needs Approval ({selectedIds.size})
          </Button>
        </header>

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/2.5 p-3 sm:flex-row sm:items-center sm:p-3.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apex-orange-light/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine, supplier, or batch…"
              className="h-11 rounded-xl border-white/10 bg-[#06051a]/65 pl-9 text-white placeholder:text-white/45 focus-visible:border-apex-orange/45 focus-visible:ring-apex-orange/20"
            />
          </div>
          <div className="sm:w-72">
            <Combobox
              value={selectedCategory}
              onChange={setSelectedCategory}
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
              {catalogMedicines.length === 0
                ? "All catalog medicines already have a quantity band, or inventory is empty."
                : "Try another category or clear your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredMedicines.map((medicine) => {
              const id = String(medicine.id);
              const already = approvalMedicineIds.has(id);
              const isSelected = already || selectedIds.has(id);
              const quantity = Number(medicine.quantity);
              const expired = isExpired(medicine, today);
              const expiryDate = medicine.expiry_date?.slice(0, 10);
              const expiresSoon =
                !expired &&
                expiryDate != null &&
                (parseISO(expiryDate).getTime() - parseISO(today).getTime()) / 86_400_000 <= 30;

              return (
                <Card
                  key={id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(6,5,26,0.42))] transition-colors hover:border-apex-orange/30 hover:bg-white/6",
                    isSelected &&
                      "border-apex-orange/40 bg-[linear-gradient(145deg,rgba(168,85,247,0.075),rgba(6,5,26,0.48))] ring-1 ring-apex-orange/20",
                    already && "opacity-80",
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
                          <span className="flex size-10 items-center justify-center rounded-xl border border-apex-orange/20 bg-[#0c0a2a]/65">
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
                          Expired
                        </Badge>
                      ) : expiryDate ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-white/10 bg-white/[0.035] text-[10px] text-white/60",
                            expiresSoon && "border-amber-300/25 bg-amber-400/10 text-amber-200",
                          )}
                        >
                          {expiresSoon ? "Expires soon" : "Expires"} ·{" "}
                          {format(parseISO(expiryDate), "MMM d, yyyy")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-white/10 bg-white/[0.035] text-[10px] text-white/55"
                        >
                          No expiry date
                        </Badge>
                      )}
                      {already ? (
                        <Badge className="border-amber-400/30 bg-amber-400/10 text-[10px] text-amber-200">
                          Marked
                        </Badge>
                      ) : null}
                    </div>

                    <div className="pt-1">
                      <span className="font-display text-lg font-semibold text-apex-orange-light">
                        {formatCurrency(medicine.price)}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="items-center justify-between gap-2 border-t border-white/8 bg-[#06051a]/35 p-3">
                    <label
                      className={cn(
                        "flex items-center gap-2 text-xs font-medium",
                        already ? "cursor-not-allowed text-white/35" : "cursor-pointer text-white/70",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={already}
                        onCheckedChange={(checked) => toggleSelected(id, checked === true)}
                      />
                      Select
                    </label>
                    {!already ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 border-amber-400/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15"
                        onClick={() => toggleSelected(id, !selectedIds.has(id))}
                      >
                        {selectedIds.has(id) ? "Selected" : "Needs approval"}
                      </Button>
                    ) : (
                      <span className="text-xs text-amber-200/80">Already marked</span>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {approvalRequired.length ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className={tableHeadClass}>Medicine</TableHead>
                  <TableHead className={tableHeadClass}>Stock</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalRequired.map((item) => (
                  <TableRow key={item.id} className="border-white/10">
                    <TableCell className="font-medium text-white">{item.medicine_name}</TableCell>
                    <TableCell className="text-white/80">{item.medicine_quantity}</TableCell>
                    <TableCell>
                      <ConfirmDeleteButton
                        title="Remove needs-approval?"
                        description={`Allow ${item.medicine_name} to sell without automatic hold.`}
                        onConfirm={async () => {
                          const ok = await deleteApprovalRequiredMedicine(item.id);
                          if (ok) await onRefresh();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
