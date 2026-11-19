"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  WorkspaceModuleHeader,
  workspaceInnerPanelClass,
  workspacePanelClass,
} from "@/components/manager/workspace";
import { EmptyState } from "@/components/manager/kit";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  managerDecidePendingSale,
  type ApprovalRequiredMedicineData,
  type MedicineData,
  type PendingSaleData,
  type PendingSaleLineData,
  type QuantitySaleRuleData,
} from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type LineEdit = {
  manager_unit_price: string;
  qty_threshold: string;
  qty_final: string;
};

type AttachmentDraft = {
  id: string;
  parent_line_id: number;
  medicine_id: string;
  medicine_name: string;
  qty_threshold: string;
  qty_final: string;
  manager_unit_price: string;
};

function buildLineEdits(sale: PendingSaleData): Record<number, LineEdit> {
  const edits: Record<number, LineEdit> = {};
  for (const line of sale.lines) {
    edits[line.id] = {
      manager_unit_price:
        line.manager_unit_price != null ? String(line.manager_unit_price) : "",
      qty_threshold:
        line.trigger === "needs_approval"
          ? String(line.qty_threshold ?? line.original_quantity)
          : line.qty_threshold != null
            ? String(line.qty_threshold)
            : "",
      qty_final:
        line.trigger === "needs_approval"
          ? String(line.qty_final ?? line.original_quantity)
          : line.qty_final != null
            ? String(line.qty_final)
            : "",
    };
  }
  return edits;
}

export function PendingApprovalsSection({
  pendingSales,
  medicines,
  quantityRules,
  approvalRequired,
  loading,
  onRefresh,
}: {
  pendingSales: PendingSaleData[];
  medicines: MedicineData[];
  quantityRules: QuantitySaleRuleData[];
  approvalRequired: ApprovalRequiredMedicineData[];
  loading: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  const awaiting = useMemo(
    () => pendingSales.filter((sale) => sale.status === "awaiting_manager"),
    [pendingSales],
  );

  const quantityRuleByMedicineId = useMemo(() => {
    const map = new Map<string, QuantitySaleRuleData>();
    for (const rule of quantityRules) {
      map.set(String(rule.medicine_id), rule);
    }
    return map;
  }, [quantityRules]);

  const approvalRequiredIds = useMemo(
    () => new Set(approvalRequired.map((item) => String(item.medicine_id))),
    [approvalRequired],
  );
  const [openSaleId, setOpenSaleId] = useState<number | null>(null);
  const [lineEdits, setLineEdits] = useState<Record<number, LineEdit>>({});
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const medicineOptions = medicines.map((m) => ({
    value: String(m.id),
    label: m.name,
    hint: formatCurrency(m.price),
  }));

  const ensureDraft = (sale: PendingSaleData) => {
    setLineEdits(buildLineEdits(sale));
    setAttachments([]);
    setRejectReason("");
  };

  const handleOpenChange = (sale: PendingSaleData, open: boolean) => {
    if (open) {
      setOpenSaleId(sale.id);
      ensureDraft(sale);
      return;
    }
    if (openSaleId === sale.id) setOpenSaleId(null);
  };

  const updateLineEdit = (lineId: number, patch: Partial<LineEdit>) => {
    setLineEdits((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], ...patch },
    }));
  };

  const addAttachment = (parent: PendingSaleLineData) => {
    setAttachments((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        parent_line_id: parent.id,
        medicine_id: "",
        medicine_name: "",
        qty_threshold: "1",
        qty_final: "",
        manager_unit_price: "",
      },
    ]);
  };

  const buildPayload = (sale: PendingSaleData, action: "approve" | "reject") => {
    if (action === "reject") {
      if (!rejectReason.trim()) {
        toast.error("Enter a reject reason");
        return null;
      }
      return { action, reject_reason: rejectReason.trim() } as const;
    }

    const line_updates: {
      id: number;
      manager_unit_price?: number | null;
      qty_threshold?: number | null;
      qty_final?: number | null;
    }[] = [];

    for (const line of sale.lines) {
      const edit = lineEdits[line.id] || {
        manager_unit_price: "",
        qty_threshold: "",
        qty_final: "",
      };
      const update: {
        id: number;
        manager_unit_price?: number | null;
        qty_threshold?: number | null;
        qty_final?: number | null;
      } = { id: line.id };

      if (edit.manager_unit_price.trim()) {
        update.manager_unit_price = Number(edit.manager_unit_price);
      }

      if (line.trigger === "needs_approval") {
        const threshold = Number(edit.qty_threshold || line.original_quantity);
        if (!threshold || threshold < 1) {
          toast.error(`${line.medicine_name}: threshold must be at least 1`);
          return null;
        }
        const final = edit.qty_final.trim() ? Number(edit.qty_final) : threshold;
        if (!final || final < threshold) {
          toast.error(`${line.medicine_name}: final must be ≥ threshold`);
          return null;
        }
        update.qty_threshold = threshold;
        update.qty_final = final;
      }

      line_updates.push(update);
    }

    const attachmentPayload = [];
    for (const draft of attachments) {
      if (!draft.medicine_name.trim() && !draft.medicine_id) {
        toast.error("Each attachment needs a medicine");
        return null;
      }
      const medicine = medicines.find((m) => String(m.id) === draft.medicine_id);
      const rule1 = draft.medicine_id
        ? quantityRuleByMedicineId.get(draft.medicine_id)
        : undefined;

      if (rule1) {
        if (rule1.final != null && rule1.final < rule1.threshold) {
          toast.error(`${rule1.medicine_name}: saved rule has final < threshold`);
          return null;
        }
        attachmentPayload.push({
          parent_line_id: draft.parent_line_id,
          medicine_id: draft.medicine_id ? Number(draft.medicine_id) : null,
          medicine_name: draft.medicine_name.trim() || medicine?.name || "Attachment",
          qty_threshold: rule1.threshold,
          qty_final: rule1.final,
          manager_unit_price: draft.manager_unit_price.trim()
            ? Number(draft.manager_unit_price)
            : null,
          original_price: medicine ? Number(medicine.price) : 0,
        });
        continue;
      }

      const threshold = Number(draft.qty_threshold);
      if (!threshold || threshold < 1) {
        toast.error("Attachment threshold must be at least 1");
        return null;
      }
      const final = draft.qty_final.trim() ? Number(draft.qty_final) : null;
      if (final != null && final < threshold) {
        toast.error(
          `${draft.medicine_name || medicine?.name || "Attachment"}: final must be ≥ threshold`,
        );
        return null;
      }
      attachmentPayload.push({
        parent_line_id: draft.parent_line_id,
        medicine_id: draft.medicine_id ? Number(draft.medicine_id) : null,
        medicine_name: draft.medicine_name.trim() || medicine?.name || "Attachment",
        qty_threshold: threshold,
        qty_final: final,
        manager_unit_price: draft.manager_unit_price.trim()
          ? Number(draft.manager_unit_price)
          : null,
        original_price: medicine ? Number(medicine.price) : 0,
      });
    }

    return {
      action: "approve" as const,
      line_updates,
      attachments: attachmentPayload,
    };
  };

  const submit = async (sale: PendingSaleData, action: "approve" | "reject") => {
    const payload = buildPayload(sale, action);
    if (!payload) return;
    const result = await managerDecidePendingSale(sale.id, payload, setSubmitting);
    if (result) {
      setOpenSaleId(null);
      setAttachments([]);
      setRejectReason("");
      await onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      <section className={cn(workspacePanelClass)}>
        <WorkspaceModuleHeader
          kicker="Manager · Queue"
          title="Pending approvals"
          description="Held pharmacist sales wait here. Expand a sale to approve as-is, adjust that-sale prices, attach items, or reject with a reason."
        />

        {!awaiting.length ? (
          <div className="border-t border-white/10 p-5 sm:p-6">
            <EmptyState
              icon={ClipboardCheck}
              tint="emerald"
              title="All caught up"
              description="No sales are waiting for manager approval right now."
            />
          </div>
        ) : (
          <div className="space-y-3 border-t border-white/10 p-4 sm:p-5">
            {awaiting.map((sale) => {
              const open = openSaleId === sale.id;
              return (
                <Collapsible
                  key={sale.id}
                  open={open}
                  onOpenChange={(next) => handleOpenChange(sale, next)}
                >
                  <div
                    className={cn(
                      workspaceInnerPanelClass,
                      "overflow-hidden transition",
                      open && "border-fuchsia-300/55 shadow-[0_18px_40px_-26px_rgba(232,121,249,0.5)]",
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-white">Sale #{sale.id}</span>
                          <span className="mt-1 block text-xs text-white/55">
                            {sale.created_by_username || "Pharmacist"} ·{" "}
                            {format(parseISO(sale.created_at), "PPp")} · {sale.lines.length} line
                            {sale.lines.length === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-200">
                            Awaiting you
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-white/50 transition-transform",
                              open && "rotate-180",
                            )}
                          />
                        </span>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="border-t border-white/10 px-4 pb-4 pt-3">
                      <p className="mb-3 text-sm text-white/60">
                        Prices changed here apply only to this sale. Inventory stays untouched until
                        the pharmacist accepts.
                      </p>

                      <div className="space-y-3">
                        {sale.lines.map((line) => {
                          const edit = lineEdits[line.id] || {
                            manager_unit_price: "",
                            qty_threshold: "",
                            qty_final: "",
                          };
                          return (
                            <div
                              key={line.id}
                              className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-white">{line.medicine_name}</p>
                                  <p className="text-xs text-white/55">
                                    Requested qty {line.original_quantity} ·{" "}
                                    {formatCurrency(line.original_price)} / unit
                                    {line.trigger !== "none"
                                      ? ` · ${line.trigger.replace("_", " ")}`
                                      : ""}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="border-white/15 bg-white/5 text-white"
                                  onClick={() => addAttachment(line)}
                                >
                                  <Plus className="mr-1 h-3.5 w-3.5" />
                                  Attach item
                                </Button>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                  <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                                    Sale unit price (opt.)
                                  </p>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={edit.manager_unit_price}
                                    onChange={(e) =>
                                      updateLineEdit(line.id, {
                                        manager_unit_price: e.target.value,
                                      })
                                    }
                                    className="h-10 border-white/14 bg-[#120f3a] text-white"
                                    placeholder={String(line.original_price)}
                                  />
                                </div>
                                {line.trigger === "needs_approval" ? (
                                  <>
                                    <div>
                                      <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                                        Qty threshold
                                      </p>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={edit.qty_threshold}
                                        onChange={(e) =>
                                          updateLineEdit(line.id, {
                                            qty_threshold: e.target.value,
                                          })
                                        }
                                        className="h-10 border-white/14 bg-[#120f3a] text-white"
                                      />
                                    </div>
                                    <div>
                                      <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                                        Qty final (opt.)
                                      </p>
                                      <Input
                                        type="number"
                                        min={Number(edit.qty_threshold) || 1}
                                        value={edit.qty_final}
                                        onChange={(e) =>
                                          updateLineEdit(line.id, { qty_final: e.target.value })
                                        }
                                        className="h-10 border-white/14 bg-[#120f3a] text-white"
                                      />
                                    </div>
                                  </>
                                ) : null}
                              </div>

                              {attachments
                                .filter((a) => a.parent_line_id === line.id)
                                .map((draft) => {
                                    const rule1 = draft.medicine_id
                                      ? quantityRuleByMedicineId.get(draft.medicine_id)
                                      : undefined;
                                    const isRule2 = Boolean(
                                      draft.medicine_id &&
                                        approvalRequiredIds.has(draft.medicine_id),
                                    );
                                    // Rule 1: price only. Rule 2 / other: full customize here.
                                    const freeCustomize = !rule1;
                                    return (
                                  <div
                                    key={draft.id}
                                    className="space-y-3 rounded-lg border border-dashed border-teal-400/25 bg-teal-400/5 p-3"
                                  >
                                    <p className="text-xs font-semibold text-teal-100/90">
                                      Attachment · goes with{" "}
                                      <span className="text-white">{line.medicine_name}</span>
                                    </p>
                                    <div className="flex flex-wrap items-end gap-3">
                                      <div className="w-full max-w-xs">
                                        <Combobox
                                          value={draft.medicine_id}
                                          onChange={(value) => {
                                            const medicine = medicines.find(
                                              (m) => String(m.id) === value,
                                            );
                                            const nextRule = quantityRuleByMedicineId.get(value);
                                            setAttachments((prev) =>
                                              prev.map((a) =>
                                                a.id === draft.id
                                                  ? {
                                                      ...a,
                                                      medicine_id: value,
                                                      medicine_name:
                                                        medicine?.name || a.medicine_name,
                                                      manager_unit_price: medicine
                                                        ? String(medicine.price)
                                                        : a.manager_unit_price,
                                                      // Rule 1 locks band from the saved rule; Rule 2 stays free.
                                                      qty_threshold: nextRule
                                                        ? String(nextRule.threshold)
                                                        : a.qty_threshold || "1",
                                                      qty_final: nextRule
                                                        ? nextRule.final != null
                                                          ? String(nextRule.final)
                                                          : ""
                                                        : a.qty_final,
                                                    }
                                                  : a,
                                              ),
                                            );
                                          }}
                                          options={medicineOptions}
                                          placeholder="Attach medicine…"
                                        />
                                      </div>
                                      {rule1 ? (
                                        <p className="pb-2 text-xs text-teal-100/80">
                                          Rule 1 item · band{" "}
                                          {rule1.final == null
                                            ? `≥ ${rule1.threshold}`
                                            : `${rule1.threshold}–${rule1.final}`}
                                          {" · "}only unit price can be changed
                                        </p>
                                      ) : isRule2 ? (
                                        <p className="pb-2 text-xs text-amber-100/85">
                                          Rule 2 item · free to customize here (threshold, final,
                                          unit price)
                                        </p>
                                      ) : null}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="ml-auto text-white/60"
                                        onClick={() =>
                                          setAttachments((prev) =>
                                            prev.filter((a) => a.id !== draft.id),
                                          )
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    {freeCustomize ? (
                                      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3">
                                        <div>
                                          <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                                            Threshold
                                          </p>
                                          <Input
                                            type="number"
                                            min={1}
                                            value={draft.qty_threshold}
                                            onChange={(e) =>
                                              setAttachments((prev) =>
                                                prev.map((a) =>
                                                  a.id === draft.id
                                                    ? { ...a, qty_threshold: e.target.value }
                                                    : a,
                                                ),
                                              )
                                            }
                                            className="h-10 border-white/14 bg-[#120f3a] text-white"
                                            placeholder="Thr"
                                          />
                                        </div>
                                        <div>
                                          <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                                            Final
                                          </p>
                                          <Input
                                            type="number"
                                            min={Number(draft.qty_threshold) || 1}
                                            value={draft.qty_final}
                                            onChange={(e) =>
                                              setAttachments((prev) =>
                                                prev.map((a) =>
                                                  a.id === draft.id
                                                    ? { ...a, qty_final: e.target.value }
                                                    : a,
                                                ),
                                              )
                                            }
                                            className="h-10 border-white/14 bg-[#120f3a] text-white"
                                            placeholder="Opt."
                                          />
                                        </div>
                                        <div>
                                          <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                                            Unit price
                                          </p>
                                          <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={draft.manager_unit_price}
                                            onChange={(e) =>
                                              setAttachments((prev) =>
                                                prev.map((a) =>
                                                  a.id === draft.id
                                                    ? {
                                                        ...a,
                                                        manager_unit_price: e.target.value,
                                                      }
                                                    : a,
                                                ),
                                              )
                                            }
                                            className="h-10 border-white/14 bg-[#120f3a] text-white"
                                            placeholder="Opt."
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="max-w-[10rem]">
                                        <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                                          Unit price (opt.)
                                        </p>
                                        <Input
                                          type="number"
                                          min={0}
                                          step="0.01"
                                          value={draft.manager_unit_price}
                                          onChange={(e) =>
                                            setAttachments((prev) =>
                                              prev.map((a) =>
                                                a.id === draft.id
                                                  ? {
                                                      ...a,
                                                      manager_unit_price: e.target.value,
                                                    }
                                                  : a,
                                              ),
                                            )
                                          }
                                          className="h-10 border-white/14 bg-[#120f3a] text-white"
                                          placeholder="Opt."
                                        />
                                      </div>
                                    )}
                                  </div>
                                    );
                                })}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-200">
                          Reject reason (required to reject)
                        </p>
                        <Textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="min-h-24 border-white/14 bg-[#120f3a] text-white"
                          placeholder="Explain why this sale cannot proceed…"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="gap-1.5"
                          disabled={submitting || loading}
                          onClick={() => void submit(sale, "approve")}
                        >
                          Approve & send to pharmacist
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={submitting || loading}
                          onClick={() => void submit(sale, "reject")}
                        >
                          Reject with reason
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
