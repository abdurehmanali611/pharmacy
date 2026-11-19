"use client";

import { useMemo, useState } from "react";
import {
  BadgePercent,
  Briefcase,
  HeartPulse,
  Pencil,
  Pill,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import {
  WorkspaceModuleHeader,
  workspaceInnerPanelClass,
  workspacePanelClass,
} from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Combobox, MultiCombobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createBulkDiscountRules,
  deleteDiscountRule,
  updateDiscountRule,
  type DiscountRole,
  type DiscountRuleData,
  type DiscountRulePayload,
  type MedicineData,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

type DiscountLine = {
  id: string;
  customer_name: string;
  role: DiscountRole;
  specific_role: string;
  medicine_ids: string[];
  percentage: string;
};

type Option = { value: string; label: string };

const newLineId = () => Math.random().toString(36).slice(2, 9);

const emptyLine = (): DiscountLine => ({
  id: newLineId(),
  customer_name: "",
  role: "health_professional",
  specific_role: "",
  medicine_ids: [],
  percentage: "",
});

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "health_professional", label: "Health professional" },
  { value: "other", label: "Other" },
];

const QUICK_PERCENTAGES = [5, 10, 15, 20, 25, 30, 50];

const labelClass = "mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em]";
const fieldClass = "h-11 pl-10 text-[0.95rem]";

/** Rotating accent per item so chips read as a colourful set, never a grey wall. */
const CHIP_TONES = [
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

function hashIndex(value: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash % mod;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

function RoleBadge({ role, specific }: { role: DiscountRole; specific: string }) {
  const hp = role === "health_professional";
  return (
    <div className="space-y-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
          hp
            ? "border-emerald-300/45 bg-emerald-400/15 text-emerald-200 shadow-[0_0_16px_-8px_rgba(52,211,153,0.9)]"
            : "border-amber-300/45 bg-amber-400/15 text-amber-200 shadow-[0_0_16px_-8px_rgba(251,191,36,0.9)]",
        )}
      >
        {hp ? <HeartPulse className="size-3" /> : <Briefcase className="size-3" />}
        {hp ? "Health professional" : "Other"}
      </span>
      {specific ? <p className="text-xs font-medium text-white/65">{specific}</p> : null}
    </div>
  );
}

function PercentPill({ value }: { value: number }) {
  return (
    <div className="w-20 space-y-1">
      <span className="inline-flex items-baseline gap-0.5 rounded-lg border border-fuchsia-300/40 bg-[linear-gradient(135deg,rgba(168,85,247,0.3),rgba(244,114,182,0.24))] px-2 py-0.5 font-display text-sm font-bold tabular-nums text-white">
        {value}
        <span className="text-[10px] font-semibold text-fuchsia-100">% off</span>
      </span>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#a855f7,#f472b6)]"
          style={{ width: `${Math.min(100, Math.max(4, value))}%` }}
        />
      </div>
    </div>
  );
}

function DiscountLineFields({
  line,
  medicineOptions,
  onChange,
}: {
  line: DiscountLine;
  medicineOptions: Option[];
  onChange: (patch: Partial<DiscountLine>) => void;
}) {
  const optionByValue = useMemo(
    () => new Map(medicineOptions.map((option) => [option.value, option.label])),
    [medicineOptions],
  );
  const percentage = Number(line.percentage);
  const summary =
    line.customer_name.trim() && line.medicine_ids.length && percentage > 0
      ? `${line.customer_name.trim()} gets ${percentage}% off ${line.medicine_ids.length} item${line.medicine_ids.length === 1 ? "" : "s"}.`
      : null;

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className={cn(labelClass, "text-violet-200")}>
            <UserRound className="size-3.5" />
            Customer name
          </p>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-violet-300" />
            <Input
              value={line.customer_name}
              onChange={(e) => onChange({ customer_name: e.target.value })}
              placeholder="e.g. Dr. Abebe Kebede"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <p className={cn(labelClass, "text-cyan-200")}>
            <Users className="size-3.5" />
            Role
          </p>
          <RadioGroup
            value={line.role}
            onValueChange={(value) => onChange({ role: value as DiscountRole })}
            className="grid grid-cols-2 gap-2"
          >
            {(
              [
                { value: "health_professional", label: "Health professional", icon: HeartPulse, tone: "emerald" },
                { value: "other", label: "Other", icon: Briefcase, tone: "amber" },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold transition",
                  "border-white/15 bg-white/5 text-white/70 hover:border-white/35 hover:text-white",
                  option.tone === "emerald"
                    ? "has-aria-checked:border-emerald-300/70 has-aria-checked:bg-emerald-400/20 has-aria-checked:text-emerald-100 has-aria-checked:shadow-[0_0_26px_-10px_rgba(52,211,153,1)]"
                    : "has-aria-checked:border-amber-300/70 has-aria-checked:bg-amber-400/20 has-aria-checked:text-amber-100 has-aria-checked:shadow-[0_0_26px_-10px_rgba(251,191,36,1)]",
                )}
              >
                <RadioGroupItem value={option.value} className="sr-only" />
                <option.icon className="size-4" />
                <span className="text-[13px] leading-tight">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div>
        <p className={cn(labelClass, "text-fuchsia-200")}>
          <Sparkles className="size-3.5" />
          Specific role{line.role === "other" ? "" : " (optional)"}
        </p>
        <div className="relative">
          <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-fuchsia-300" />
          <Input
            value={line.specific_role}
            onChange={(e) => onChange({ specific_role: e.target.value })}
            placeholder={
              line.role === "other"
                ? "e.g. Clinic owner, NGO buyer"
                : "e.g. Pharmacist, Nurse, Doctor"
            }
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-2.5">
          <p className={cn(labelClass, "mb-0 text-pink-200")}>
            <Pill className="size-3.5" />
            Items with discount
            {line.medicine_ids.length ? (
              <span className="ml-auto rounded-full bg-pink-400/25 px-2 py-0.5 text-[10px] font-bold text-pink-100">
                {line.medicine_ids.length} selected
              </span>
            ) : null}
          </p>
          <MultiCombobox
            values={line.medicine_ids}
            onChange={(values) => onChange({ medicine_ids: values })}
            options={medicineOptions}
            placeholder="Select one or more items…"
            searchPlaceholder="Search items…"
          />
          {line.medicine_ids.length ? (
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {line.medicine_ids.map((id, i) => (
                <span
                  key={id}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-2.5 pr-1 text-[11px] font-bold",
                    CHIP_TONES[i % CHIP_TONES.length],
                  )}
                >
                  <span className="min-w-0 truncate">{optionByValue.get(id) ?? id}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${optionByValue.get(id) ?? id}`}
                    className="shrink-0 rounded-full p-0.5 hover:bg-white/20"
                    onClick={() => onChange({ medicine_ids: line.medicine_ids.filter((v) => v !== id) })}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className={cn(labelClass, "text-amber-200")}>
            <BadgePercent className="size-3.5" />
            Discount
          </p>
          <div className="relative">
            <Input
              type="number"
              min={0.01}
              max={100}
              step="0.01"
              value={line.percentage}
              onChange={(e) => onChange({ percentage: e.target.value })}
              placeholder="10"
              className="h-11 pr-12 text-lg font-bold tabular-nums"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md bg-fuchsia-400/25 px-1.5 py-0.5 text-sm font-bold text-fuchsia-100">
              %
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_PERCENTAGES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ percentage: String(preset) })}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition",
                  percentage === preset
                    ? "border-fuchsia-300/80 bg-fuchsia-400/30 text-white shadow-[0_0_18px_-6px_rgba(232,121,249,1)]"
                    : "border-white/15 bg-white/5 text-white/65 hover:border-fuchsia-300/50 hover:text-white",
                )}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {summary ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100">
          <Sparkles className="size-3.5 shrink-0 text-emerald-300" />
          {summary}
        </p>
      ) : null}
    </div>
  );
}

export function DiscountRulesSection({
  medicines,
  discountRules,
  loading,
  onRefresh,
}: {
  medicines: MedicineData[];
  discountRules: DiscountRuleData[];
  loading: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<DiscountLine[]>(() => [emptyLine()]);
  const [editingRule, setEditingRule] = useState<DiscountRuleData | null>(null);
  const [editLine, setEditLine] = useState<DiscountLine>(() => emptyLine());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | DiscountRole>("all");

  // Batches of the same medicine share a name; discounts match by name, so list each name once.
  const medicineOptions = useMemo(() => {
    const byName = new Map<string, MedicineData>();
    for (const medicine of medicines) {
      const key = medicine.name.trim().toLowerCase();
      if (!byName.has(key)) byName.set(key, medicine);
    }
    return [...byName.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((medicine) => ({ value: String(medicine.id), label: medicine.name }));
  }, [medicines]);

  // A saved rule may point at a different batch id than the option shown for that medicine name.
  const idToOptionValue = useMemo(() => {
    const optionByName = new Map(
      medicineOptions.map((option) => [option.label.trim().toLowerCase(), option.value]),
    );
    const map = new Map<string, string>();
    for (const medicine of medicines) {
      const value = optionByName.get(medicine.name.trim().toLowerCase());
      if (value) map.set(String(medicine.id), value);
    }
    return map;
  }, [medicines, medicineOptions]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return discountRules.filter((rule) => {
      if (roleFilter !== "all" && rule.role !== roleFilter) return false;
      if (!q) return true;
      return [rule.customer_name, rule.specific_role, ...rule.medicine_names]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [discountRules, search, roleFilter]);

  const updateLine = (id: string, patch: Partial<DiscountLine>) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };

  const resetForm = () => setLines([emptyLine()]);

  const startEdit = (rule: DiscountRuleData) => {
    const optionValues = [
      ...new Set(
        rule.medicine_ids
          .map((id) => idToOptionValue.get(String(id)))
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    setEditingRule(rule);
    setEditLine({
      id: newLineId(),
      customer_name: rule.customer_name,
      role: rule.role,
      specific_role: rule.specific_role,
      medicine_ids: optionValues,
      percentage: String(Number(rule.percentage)),
    });
  };

  const buildPayload = (lines: DiscountLine[]): DiscountRulePayload[] | null => {
    const payload: DiscountRulePayload[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prefix = lines.length > 1 ? `Line #${i + 1}` : "Rule";
      if (!line.customer_name.trim()) {
        toast.error(`${prefix}: Enter the customer name`);
        return null;
      }
      if (line.role === "other" && !line.specific_role.trim()) {
        toast.error(`${prefix}: Enter the specific role`);
        return null;
      }
      if (!line.medicine_ids.length) {
        toast.error(`${prefix}: Select at least one item`);
        return null;
      }
      const percentage = Number(line.percentage);
      if (!percentage || percentage <= 0 || percentage > 100) {
        toast.error(`${prefix}: Percentage must be between 0 and 100`);
        return null;
      }
      payload.push({
        customer_name: line.customer_name.trim(),
        role: line.role,
        specific_role: line.specific_role.trim(),
        medicine_ids: line.medicine_ids.map(Number),
        percentage,
      });
    }
    return payload;
  };

  const saveEdit = async () => {
    if (!editingRule) return;
    const payload = buildPayload([editLine]);
    if (!payload) return;
    const result = await updateDiscountRule(editingRule.id, payload[0], setSaving);
    if (result) {
      setEditingRule(null);
      await onRefresh();
    }
  };

  const save = async () => {
    const payload = buildPayload(lines);
    if (!payload) return;

    const result = await createBulkDiscountRules(payload, setSaving);
    if (result) {
      resetForm();
      await onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      <section className={cn(workspacePanelClass)}>
        <WorkspaceModuleHeader
          kicker="Manager · Controls"
          title="Discount rules"
          description="Give named customers a percentage off selected items. Pharmacists pick the customer when recording a sale, and the discount comes off the sales price."
        />
      </section>

      <section className={cn(workspacePanelClass, "p-5 sm:p-6")}>
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-start gap-3">
            <span className="tint-icon tint-fuchsia flex h-11 w-11 items-center justify-center rounded-2xl">
              <BadgePercent className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-white">New discount rules</h3>
              <p className="mt-0.5 max-w-2xl text-sm text-white/65">
                One line per customer and item set. A customer can have several lines; if an item is on more than one, the higher percentage applies.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-bold text-white/80">
            {lines.length} line{lines.length === 1 ? "" : "s"} ready
          </span>
        </header>

        <div className="space-y-4">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className={cn(
                workspaceInnerPanelClass,
                "space-y-5 p-5",
                ["tint-violet", "tint-cyan", "tint-pink", "tint-emerald", "tint-amber"][index % 5],
              )}
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white/85">
                  <span className="tint-icon flex size-7 items-center justify-center rounded-lg text-sm tracking-normal">
                    {index + 1}
                  </span>
                  Discount line
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/60 hover:bg-rose-500/20 hover:text-rose-200"
                  disabled={lines.length === 1}
                  aria-label={`Remove line ${index + 1}`}
                  onClick={() =>
                    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== line.id) : prev))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <DiscountLineFields
                line={line}
                medicineOptions={medicineOptions}
                onChange={(patch) => updateLine(line.id, patch)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300/45 bg-violet-400/8 py-3 text-sm font-bold text-violet-100 transition hover:border-fuchsia-300/80 hover:bg-fuchsia-400/15 hover:text-white hover:shadow-[0_0_30px_-12px_rgba(232,121,249,1)]"
        >
          <Plus className="h-4 w-4" />
          Add another line
        </button>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p className="text-sm text-white/60">
            Saved rules appear in the pharmacist’s customer list straight away.
          </p>
          <Button
            type="button"
            size="lg"
            className="min-w-52"
            disabled={saving || loading}
            onClick={() => void save()}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {saving ? "Saving…" : `Save ${lines.length > 1 ? `${lines.length} discount rules` : "discount rule"}`}
          </Button>
        </div>
      </section>

      <section className={cn(workspacePanelClass, "p-5 sm:p-6")}>
        <header className="mb-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="tint-icon tint-cyan flex h-11 w-11 items-center justify-center rounded-2xl">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-white">Saved discount rules</h3>
              <p className="text-sm text-white/60">
                Showing {filteredRules.length} of {discountRules.length}
              </p>
            </div>
          </div>

          {discountRules.length ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-cyan-300" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, role or item…"
                  className="h-10 pl-9"
                />
              </div>
              <div className="w-full sm:w-60">
                <Combobox
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value as "all" | DiscountRole)}
                  options={ROLE_FILTER_OPTIONS}
                  placeholder="Filter by role…"
                  searchPlaceholder="Search roles…"
                  emptyText="No role found."
                />
              </div>
            </div>
          ) : null}
        </header>

        {discountRules.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-violet-300/35 bg-violet-400/6 px-6 py-14 text-center">
            <span className="tint-icon tint-fuchsia flex size-16 items-center justify-center rounded-3xl">
              <BadgePercent className="size-8" />
            </span>
            <p className="font-display text-lg font-bold text-white">No discount rules yet</p>
            <p className="max-w-sm text-sm text-white/65">
              Add a customer, pick the items and set a percentage above. They will show up here, ready to edit or remove.
            </p>
          </div>
        ) : filteredRules.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/4 p-8 text-center text-sm text-white/65">
            No rules match your search.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-violet-300/25">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-[0.65rem] font-bold uppercase tracking-[0.16em]">Customer</TableHead>
                  <TableHead className="text-[0.65rem] font-bold uppercase tracking-[0.16em]">Role</TableHead>
                  <TableHead className="text-[0.65rem] font-bold uppercase tracking-[0.16em]">Items</TableHead>
                  <TableHead className="text-[0.65rem] font-bold uppercase tracking-[0.16em]">Discount</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => {
                  const names = [...new Set(rule.medicine_names)];
                  const shown = names.slice(0, 3);
                  const extra = names.length - shown.length;
                  return (
                    <TableRow key={rule.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(168,85,247,0.9)] ring-2 ring-white/20",
                              AVATAR_TONES[hashIndex(rule.customer_name, AVATAR_TONES.length)],
                            )}
                          >
                            {initials(rule.customer_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{rule.customer_name}</p>
                            <p className="text-xs text-white/50">
                              Added {new Date(rule.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={rule.role} specific={rule.specific_role} />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {shown.map((name, i) => (
                            <span
                              key={name}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                                CHIP_TONES[(hashIndex(name, CHIP_TONES.length) + i) % CHIP_TONES.length],
                              )}
                            >
                              {name}
                            </span>
                          ))}
                          {extra > 0 ? (
                            <span
                              title={names.slice(3).join(", ")}
                              className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80"
                            >
                              +{extra} more
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PercentPill value={Number(rule.percentage)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Edit discount for ${rule.customer_name}`}
                            title="Edit"
                            onClick={() => startEdit(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDeleteButton
                            title="Remove discount rule?"
                            description={`Remove ${rule.customer_name}'s ${Number(rule.percentage)}% discount on ${names.join(", ")}.`}
                            onConfirm={async () => {
                              const ok = await deleteDiscountRule(rule.id);
                              if (ok) await onRefresh();
                            }}
                            iconOnly
                            ariaLabel={`Delete discount for ${rule.customer_name}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog
        open={editingRule !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setEditingRule(null);
        }}
      >
        <DialogContent className="max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 font-display text-xl font-bold">
              <span className="tint-icon tint-fuchsia flex size-9 items-center justify-center rounded-xl">
                <Pencil className="size-4" />
              </span>
              Edit discount rule
            </DialogTitle>
            <DialogDescription>
              Change the customer, role, items or percentage, then save.
            </DialogDescription>
          </DialogHeader>
          <DiscountLineFields
            line={editLine}
            medicineOptions={medicineOptions}
            onChange={(patch) => setEditLine((prev) => ({ ...prev, ...patch }))}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setEditingRule(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void saveEdit()}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
