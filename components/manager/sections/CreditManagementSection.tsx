"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { BadgeCheck, Banknote, HandCoins, History, Hourglass, PackageCheck, Pencil, Pill, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { AddLineBar, Chip, EmptyState, FieldLabel, LineNumber, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { ExportMenu } from "@/components/manager/ExportMenu";
import { WorkspacePanel, WorkspaceSectionHeader } from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MultiCombobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCreditPayment, payMedicineCredit, updateCreditPayment, type CreditPaymentData, type MedicineData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { creditDue, paidAmount, toNumber, totalCost } from "@/lib/inventory";
import { cn } from "@/lib/utils";

type PayLine = {
  id: string;
  medicineIds: string[];
  fullyPaid: boolean;
  amount: string;
};

const newLine = (): PayLine => ({ id: crypto.randomUUID(), medicineIds: [], fullyPaid: false, amount: "" });
const money = (n: number) => Math.round(n * 100) / 100;

export function CreditManagementSection({
  medicines,
  payments,
  onRefresh,
}: {
  medicines: MedicineData[];
  payments: CreditPaymentData[];
  onRefresh: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<PayLine[]>(() => [newLine()]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CreditPaymentData | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editFull, setEditFull] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const medicineById = useMemo(() => new Map(medicines.map((m) => [String(m.id), m])), [medicines]);
  // The most this payment can be: what is still owed plus what this payment already covers.
  const editCeiling = editing
    ? money(creditDue(medicineById.get(String(editing.medicine_id)) ?? ({} as MedicineData)) + toNumber(editing.amount))
    : 0;

  const openEdit = (payment: CreditPaymentData) => {
    setEditing(payment);
    setEditAmount(String(toNumber(payment.amount)));
    setEditFull(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const amount = editFull ? editCeiling : money(toNumber(editAmount));
    if (!(amount > 0)) return toast.error("Enter an amount greater than 0");
    if (amount > editCeiling + 0.001) return toast.error(`The most this payment can be is ${formatCurrency(editCeiling)}`);
    const result = await updateCreditPayment(editing.id, amount, setSavingEdit);
    if (result) {
      setEditing(null);
      await onRefresh();
    }
  };

  const removePayment = async (payment: CreditPaymentData) => {
    if (await deleteCreditPayment(payment.id)) await onRefresh();
  };

  // Oldest credit first, so the next thing to pay is always on top.
  const creditItems = useMemo(
    () =>
      medicines
        .filter((m) => creditDue(m) > 0.01)
        .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
    [medicines],
  );
  const byId = useMemo(() => new Map(creditItems.map((m) => [String(m.id), m])), [creditItems]);

  const totalDue = creditItems.reduce((s, m) => s + creditDue(m), 0);
  const partial = creditItems.filter((m) => paidAmount(m) > 0.01).length;
  const totalPaidOnCredit = creditItems.reduce((s, m) => s + paidAmount(m), 0);

  const update = (id: string, patch: Partial<PayLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const itemsOf = (line: PayLine) =>
    line.medicineIds
      .map((id) => byId.get(id))
      .filter((m): m is MedicineData => Boolean(m))
      .sort((x, y) => (x.created_at ?? "").localeCompare(y.created_at ?? ""));

  // Everything still owed on the items picked for this line.
  const dueOf = (line: PayLine) => money(itemsOf(line).reduce((sum, m) => sum + creditDue(m), 0));
  // Fully paid locks the amount to whatever is still owed.
  const amountOf = (line: PayLine) => (line.fullyPaid ? dueOf(line) : money(toNumber(line.amount)));

  // One amount for several items is shared out oldest credit first, each capped at what it owes.
  const allocate = (line: PayLine) => {
    let left = amountOf(line);
    const out: { medicine_id: string; amount: number }[] = [];
    for (const m of itemsOf(line)) {
      if (left <= 0.004) break;
      const take = money(Math.min(left, creditDue(m)));
      if (take > 0) out.push({ medicine_id: String(m.id), amount: take });
      left = money(left - take);
    }
    return out;
  };

  const optionsFor = (line: PayLine) =>
    creditItems
      .filter((m) => line.medicineIds.includes(String(m.id)) || !lines.some((l) => l.medicineIds.includes(String(m.id))))
      .map((m) => ({
        value: String(m.id),
        label: `${m.name}${m.batch_number ? ` · ${m.batch_number}` : ""}`,
        hint: `${m.supplier_name ? `${m.supplier_name} · ` : ""}owes ${formatCurrency(creditDue(m))}`,
        keywords: `${m.supplier_name ?? ""} ${m.batch_number ?? ""}`,
      }));

  const lineProblem = (line: PayLine): string | null => {
    if (!line.medicineIds.length) return null;
    const due = dueOf(line);
    const amount = amountOf(line);
    if (!line.fullyPaid && line.amount !== "" && amount > due + 0.001) return `Cannot be more than ${formatCurrency(due)}`;
    return null;
  };

  const submit = async () => {
    for (const [i, line] of lines.entries()) {
      const prefix = `Line ${i + 1}`;
      if (!line.medicineIds.length) return toast.error(`${prefix}: choose at least one credit item`);
      const amount = amountOf(line);
      if (!(amount > 0)) return toast.error(`${prefix}: enter an amount greater than 0`);
      if (amount > dueOf(line) + 0.001) return toast.error(`${prefix}: amount is more than the remaining credit`);
    }
    const result = await payMedicineCredit(lines.flatMap(allocate), setSaving);
    if (result) {
      setLines([newLine()]);
      await onRefresh();
    }
  };

  const payTotal = lines.reduce((s, l) => s + (l.medicineIds.length ? amountOf(l) : 0), 0);

  return (
    <div className="space-y-5">
      <WorkspacePanel>
        <WorkspaceSectionHeader
          title="Credit management"
          description="Pay supplier credit in full or in part. Everything updates instantly."
          action={
            <ExportMenu
              build={() => {
                const day = (value?: string | null) => String(value ?? "").slice(0, 10);
                return {
                  fileName: "credit-statement",
                  title: "Supplier credit statement",
                  subtitle: "Credit still owed, and the payments made against it",
                  summary: [
                    ["Total credit owed", totalDue],
                    ["Items on credit", creditItems.length],
                    ["Partly paid items", partial],
                    ["Paid so far on credit items", totalPaidOnCredit],
                  ],
                  sections: [
                    {
                      name: "Credit items",
                      heading: "Items on credit (oldest first)",
                      columns: [
                        { header: "Medicine" },
                        { header: "Supplier" },
                        { header: "Batch" },
                        { header: "Since" },
                        { header: "Total cost", kind: "money" },
                        { header: "Paid", kind: "money" },
                        { header: "Owed", kind: "money" },
                      ],
                      rows: creditItems.map((m) => [m.name, m.supplier_name ?? "", m.batch_number ?? "", day(m.created_at), totalCost(m), paidAmount(m), creditDue(m)]),
                      totals: ["Total", "", "", "", "", totalPaidOnCredit, totalDue],
                    },
                    {
                      name: "Payment history",
                      heading: "Payment history",
                      columns: [
                        { header: "Date" },
                        { header: "Medicine" },
                        { header: "Supplier" },
                        { header: "Recorded by" },
                        { header: "Amount paid", kind: "money" },
                        { header: "Status now" },
                      ],
                      rows: payments.map((pay) => [
                        day(pay.created_at),
                        pay.medicine_name,
                        pay.supplier_name ?? "",
                        pay.recorded_by ?? "",
                        toNumber(pay.amount),
                        toNumber(pay.credit_amount) > 0.01 ? `Owes ${money(toNumber(pay.credit_amount)).toFixed(2)}` : "Fully paid",
                      ]),
                      totals: ["Total", "", "", "", payments.reduce((sum, pay) => sum + toNumber(pay.amount), 0), ""],
                    },
                  ],
                };
              }}
            />
          }
        />
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          {[
            { label: "Total credit owed", value: formatCurrency(totalDue), hint: `${creditItems.length} credit item${creditItems.length === 1 ? "" : "s"}`, icon: HandCoins, tint: "tint-rose" },
            { label: "Partly paid", value: String(partial), hint: "Items with a payment already made", icon: Hourglass, tint: "tint-amber" },
            { label: "Paid so far", value: formatCurrency(totalPaidOnCredit), hint: "On items still on credit", icon: Banknote, tint: "tint-emerald" },
            { label: "This payment", value: formatCurrency(payTotal), hint: `${lines.reduce((n, l) => n + l.medicineIds.length, 0)} item${lines.reduce((n, l) => n + l.medicineIds.length, 0) === 1 ? "" : "s"} selected`, icon: Wallet, tint: "tint-violet" },
          ].map((k) => (
            <div key={k.label} className={cn("workspace-inner-surface flex items-center gap-3 p-4", k.tint)}>
              <span className="tint-icon flex size-11 shrink-0 items-center justify-center rounded-xl">
                <k.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="tint-text text-[0.62rem] font-bold uppercase tracking-[0.14em]">{k.label}</p>
                <p className="truncate font-display text-xl font-bold tabular-nums text-white">{k.value}</p>
                <p className="truncate text-xs text-white/60">{k.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel className="space-y-5 p-5 sm:p-6">
        <SectionTitle
          icon={BadgeCheck}
          tint="emerald"
          title="Record a payment"
          subtitle="Choose the credit items and how much to pay"
        />

        {creditItems.length === 0 ? (
          <EmptyState icon={PackageCheck} tint="emerald" title="No credit to pay" description="Every line is fully paid. New credit items will appear here." />
        ) : (
          <>
            <div className="space-y-3">
              {lines.map((line, index) => {
                const picked = itemsOf(line);
                const m = picked.length ? picked : null;
                const due = dueOf(line);
                const amount = amountOf(line);
                const problem = lineProblem(line);
                const remaining = m ? Math.max(0, money(due - amount)) : null;
                return (
                  <div key={line.id} className="workspace-inner-surface grid items-center gap-4 p-4 lg:grid-cols-[2.5rem_minmax(0,1.6fr)_auto_minmax(0,1fr)_2.5rem]">
                    <LineNumber index={index} />

                    <div>
                      <FieldLabel icon={Pill} tone="violet">Credit item</FieldLabel>
                      <MultiCombobox
                        values={line.medicineIds}
                        onChange={(values) => update(line.id, { medicineIds: values, fullyPaid: false, amount: "" })}
                        options={optionsFor(line)}
                        placeholder="Select one or more credit items…"
                        searchPlaceholder="Search credit items…"
                      />
                      {m ? (
                        <p className="mt-1.5 text-xs text-white/60">
                          {m.length === 1
                            ? `Total ${formatCurrency(totalCost(m[0]))} · paid ${formatCurrency(paidAmount(m[0]))} · `
                            : `${m.length} items · `}
                          <span className="font-bold text-rose-200">owes {formatCurrency(due)}</span>
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <FieldLabel icon={BadgeCheck} tone="emerald">Fully paid</FieldLabel>
                      <label className="flex h-11 items-center gap-2.5">
                        <Switch
                          checked={line.fullyPaid}
                          disabled={!m}
                          onCheckedChange={(checked) =>
                            update(line.id, { fullyPaid: checked, amount: checked ? due.toFixed(2) : "" })
                          }
                        />
                        <span className={cn("text-xs font-bold", line.fullyPaid ? "text-emerald-200" : "text-white/55")}>
                          {line.fullyPaid ? "On" : "Off"}
                        </span>
                      </label>
                    </div>

                    <div>
                      <FieldLabel icon={Banknote} tone="pink">Amount paid</FieldLabel>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={due || undefined}
                        step="0.01"
                        value={line.fullyPaid ? due.toFixed(2) : line.amount}
                        readOnly={line.fullyPaid}
                        disabled={!m}
                        onChange={(e) => update(line.id, { amount: e.target.value })}
                        placeholder={m ? `Up to ${due.toFixed(2)}` : "Choose items first"}
                        className={cn("h-11", line.fullyPaid && "cursor-not-allowed opacity-80", problem && "border-rose-400/70")}
                      />
                      {problem ? (
                        <p className="mt-1 text-xs font-bold text-rose-300">{problem}</p>
                      ) : m && amount > 0 ? (
                        <p className="mt-1 text-xs text-white/60">
                          {remaining && remaining > 0.01 ? `Still owed after: ${formatCurrency(remaining)}` : <span className="font-bold text-emerald-200">Will be fully paid</span>}
                          {m && m.length > 1 ? " · shared across the items, oldest first" : ""}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 text-white/60 hover:text-rose-200"
                      disabled={lines.length === 1}
                      onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                      aria-label="Remove line"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <AddLineBar label="Add another credit item" onClick={() => setLines((prev) => [...prev, newLine()])} />

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
              <p className="min-w-0 flex-1 basis-64 text-sm text-white/60">
                Turning <span className="font-bold text-white/80">Fully paid</span> on fills the amount with what is still owed. Otherwise enter any amount up to the remaining credit.
              </p>
              <Button type="button" size="lg" className="ml-auto min-w-48" disabled={saving} onClick={() => void submit()}>
                <BadgeCheck className="mr-1.5 size-4" />
                {saving ? "Saving…" : "Mark as Paid"}
              </Button>
            </div>
          </>
        )}
      </WorkspacePanel>

      <WorkspacePanel className="space-y-4 p-5 sm:p-6">
        <SectionTitle icon={HandCoins} tint="pink" title="Items on credit" subtitle="Oldest first — what is still owed to suppliers" />
        {creditItems.length ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={tableHeadClass}>Medicine</TableHead>
                  <TableHead className={tableHeadClass}>Supplier</TableHead>
                  <TableHead className={cn(tableHeadClass, "text-right")}>Total</TableHead>
                  <TableHead className={cn(tableHeadClass, "text-right")}>Paid</TableHead>
                  <TableHead className={cn(tableHeadClass, "text-right")}>Owed</TableHead>
                  <TableHead className={tableHeadClass}>Progress</TableHead>
                  <TableHead className={tableHeadClass}>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditItems.map((m) => {
                  const total = totalCost(m);
                  const pct = total > 0 ? Math.min(100, (paidAmount(m) / total) * 100) : 0;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-white">
                        {m.name}
                        {m.batch_number ? <span className="ml-2 text-xs text-white/50">{m.batch_number}</span> : null}
                      </TableCell>
                      <TableCell>{m.supplier_name ? <Chip seed={m.supplier_name}>{m.supplier_name}</Chip> : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(total)}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-200">{formatCurrency(paidAmount(m))}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-rose-200">{formatCurrency(creditDue(m))}</TableCell>
                      <TableCell className="min-w-32">
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22d3ee)]" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-[0.65rem] text-white/55">{pct.toFixed(0)}% paid</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-white/60">
                        {m.created_at ? format(parseISO(m.created_at), "PP") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={PackageCheck} tint="emerald" title="All paid up" description="Nothing is owed to suppliers right now." />
        )}
      </WorkspacePanel>
      <WorkspacePanel className="space-y-4 p-5 sm:p-6">
        <SectionTitle
          icon={History}
          tint="violet"
          title="Payment history"
          subtitle="Edit a payment and totals follow; delete it to restore the credit"
        />
        {payments.length ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={tableHeadClass}>Date</TableHead>
                  <TableHead className={tableHeadClass}>Medicine</TableHead>
                  <TableHead className={tableHeadClass}>Supplier</TableHead>
                  <TableHead className={cn(tableHeadClass, "text-right")}>Amount paid</TableHead>
                  <TableHead className={tableHeadClass}>Status now</TableHead>
                  <TableHead className={cn(tableHeadClass, "text-right")}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((pay) => {
                  const owed = toNumber(pay.credit_amount);
                  return (
                    <TableRow key={pay.id}>
                      <TableCell className="whitespace-nowrap text-xs text-white/70">{format(parseISO(pay.created_at), "PP p")}</TableCell>
                      <TableCell className="font-semibold text-white">
                        {pay.medicine_name}
                        {pay.batch_number ? <span className="ml-2 text-xs text-white/50">{pay.batch_number}</span> : null}
                      </TableCell>
                      <TableCell>{pay.supplier_name ? <Chip seed={pay.supplier_name}>{pay.supplier_name}</Chip> : "—"}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-emerald-200">{formatCurrency(toNumber(pay.amount))}</TableCell>
                      <TableCell>
                        {owed > 0.01 ? (
                          <Chip className="border-rose-300/45 bg-rose-400/15 text-rose-100">Owes {formatCurrency(owed)}</Chip>
                        ) : (
                          <Chip className="border-emerald-300/45 bg-emerald-400/15 text-emerald-100">Fully paid</Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" size="icon-sm" variant="outline" onClick={() => openEdit(pay)} title="Edit payment" aria-label="Edit payment">
                            <Pencil className="size-4" />
                          </Button>
                          <ConfirmDeleteButton
                            iconOnly
                            ariaLabel="Delete payment"
                            title="Delete this payment?"
                            description={`${formatCurrency(toNumber(pay.amount))} paid on ${pay.medicine_name} will be removed and the credit restored.`}
                            onConfirm={() => removePayment(pay)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState icon={History} tint="violet" title="No payments yet" description="Payments you record above will be listed here." />
        )}
      </WorkspacePanel>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && !savingEdit && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4" /> Edit payment
            </DialogTitle>
            <DialogDescription>
              {editing ? `${editing.medicine_name} — the most this payment can be is ${formatCurrency(editCeiling)}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <FieldLabel icon={BadgeCheck} tone="emerald">Fully paid</FieldLabel>
              <label className="flex h-11 items-center gap-2.5">
                <Switch
                  checked={editFull}
                  onCheckedChange={(checked) => {
                    setEditFull(checked);
                    if (checked) setEditAmount(editCeiling.toFixed(2));
                  }}
                />
                <span className={cn("text-xs font-bold", editFull ? "text-emerald-200" : "text-white/55")}>{editFull ? "On" : "Off"}</span>
              </label>
            </div>
            <div>
              <FieldLabel icon={Banknote} tone="pink">Amount paid</FieldLabel>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={editCeiling || undefined}
                step="0.01"
                value={editFull ? editCeiling.toFixed(2) : editAmount}
                readOnly={editFull}
                onChange={(e) => setEditAmount(e.target.value)}
                className={cn("h-11", editFull && "cursor-not-allowed opacity-80")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={savingEdit} onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="button" disabled={savingEdit} onClick={() => void saveEdit()}>{savingEdit ? "Saving…" : "Save payment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
