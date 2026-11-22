"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock3,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  WorkspaceModuleHeader,
  WorkspaceStat,
  workspaceInnerPanelClass,
  workspacePanelClass,
} from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  pharmacistConfirmPendingSale,
  type PendingSaleData,
  type PendingSaleLineData,
} from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function flattenLines(sale: PendingSaleData): PendingSaleLineData[] {
  const rows: PendingSaleLineData[] = [];
  for (const line of sale.lines) {
    rows.push(line);
    for (const attachment of line.attachments || []) {
      rows.push(attachment);
    }
  }
  return rows;
}

function bandLabel(threshold: number | null, final: number | null) {
  if (threshold == null) return "—";
  if (final == null) return `≥ ${threshold}`;
  return `${threshold} – ${final}`;
}

function buildQtyMap(sale: PendingSaleData): Record<number, string> {
  const next: Record<number, string> = {};
  for (const line of flattenLines(sale)) {
    const needsBand =
      line.is_attachment || line.trigger === "needs_approval" || line.qty_threshold != null;
    next[line.id] = String(
      needsBand
        ? (line.pharmacist_quantity ?? line.qty_threshold ?? line.original_quantity)
        : line.original_quantity,
    );
  }
  return next;
}

function statusMeta(status: PendingSaleData["status"]) {
  if (status === "awaiting_manager") {
    return {
      label: "Pending manager approval",
      className: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    };
  }
  if (status === "awaiting_pharmacist") {
    return {
      label: "Ready for your confirm",
      className: "border-teal-400/25 bg-teal-400/10 text-teal-200",
    };
  }
  return {
    label: "Manager rejected",
    className: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  };
}

export function PharmacistApprovalsSection({
  pendingSales,
  loading,
  onRefresh,
}: {
  pendingSales: PendingSaleData[];
  loading: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  const inbox = useMemo(
    () =>
      pendingSales.filter(
        (sale) =>
          sale.status === "awaiting_manager" ||
          sale.status === "awaiting_pharmacist" ||
          sale.status === "rejected",
      ),
    [pendingSales],
  );

  const awaitingManagerCount = inbox.filter((s) => s.status === "awaiting_manager").length;
  const needsPharmacistCount = inbox.filter((s) => s.status === "awaiting_pharmacist").length;

  const [openSaleId, setOpenSaleId] = useState<number | null>(null);
  const [qtyByLine, setQtyByLine] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (sale: PendingSaleData, open: boolean) => {
    if (open) {
      setOpenSaleId(sale.id);
      setQtyByLine(buildQtyMap(sale));
      return;
    }
    if (openSaleId === sale.id) setOpenSaleId(null);
  };

  const accept = async (sale: PendingSaleData) => {
    if (sale.status === "rejected") {
      toast.error("Manager rejected this sale. Dismiss it or start a new sale.");
      return;
    }

    const lines = flattenLines(sale);
    const payloadLines: { id: number; quantity: number }[] = [];

    for (const line of lines) {
      const raw = qtyByLine[line.id];
      const quantity = Number(raw);
      const needsBand =
        line.is_attachment || line.trigger === "needs_approval" || line.qty_threshold != null;

      if (needsBand) {
        if (!quantity || quantity < 1) {
          toast.error(`${line.medicine_name}: enter a quantity in the band`);
          return;
        }
        if (line.qty_threshold != null) {
          if (quantity < line.qty_threshold) {
            toast.error(`${line.medicine_name}: quantity below threshold`);
            return;
          }
          if (line.qty_final != null && quantity > line.qty_final) {
            toast.error(`${line.medicine_name}: quantity above final`);
            return;
          }
        }
      }

      payloadLines.push({
        id: line.id,
        quantity: quantity || line.original_quantity,
      });
    }

    const result = await pharmacistConfirmPendingSale(
      sale.id,
      { action: "accept", lines: payloadLines },
      setSubmitting,
    );
    if (result) {
      setOpenSaleId(null);
      await onRefresh();
    }
  };

  const rejectOrDismiss = async (sale: PendingSaleData) => {
    const result = await pharmacistConfirmPendingSale(
      sale.id,
      { action: "reject" },
      setSubmitting,
    );
    if (result) {
      setOpenSaleId(null);
      await onRefresh();
    }
  };

  return (
    <div className="space-y-5">
      <section className={cn(workspacePanelClass)}>
        <WorkspaceModuleHeader
          kicker="Pharmacist · Approvals"
          title="Sale approvals"
          description="Expand a held sale to follow its review, confirm changes or dismiss."
        />
        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <WorkspaceStat
            label="Pending manager"
            value={String(awaitingManagerCount)}
            icon={Clock3}
            tone="text-sky-200"
          />
          <WorkspaceStat
            label="Needs your action"
            value={String(needsPharmacistCount)}
            icon={BellRing}
            tone="text-amber-200"
          />
          <WorkspaceStat label="In inbox" value={String(inbox.length)} />
        </div>

        {!inbox.length ? (
          <div className="border-t border-white/10 px-6 py-10 text-center text-white/60">
            No pending or manager-held sales right now.
          </div>
        ) : (
          <div className="space-y-3 border-t border-white/10 p-4 sm:p-5">
            {inbox.map((sale) => {
              const open = openSaleId === sale.id;
              const meta = statusMeta(sale.status);
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
                      open && "border-apex-orange/35",
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
                            {format(parseISO(sale.created_at), "PPp")} ·{" "}
                            {flattenLines(sale).length} item
                            {flattenLines(sale).length === 1 ? "" : "s"}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
                              meta.className,
                            )}
                          >
                            {meta.label}
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
                      {sale.status === "awaiting_manager" ? (
                        <p className="mb-3 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm text-sky-50">
                          Awaiting manager approval — this may take a moment. Refresh after they respond.
                        </p>
                      ) : sale.status === "rejected" ? (
                        <p className="mb-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                          Manager rejected:{" "}
                          {sale.manager_reject_reason || "No reason provided."}
                        </p>
                      ) : (
                        <p className="mb-3 text-sm text-white/60">
                          Confirm quantities within the manager's bands. Accept completes the sale; reject cancels it.
                        </p>
                      )}

                      <div className="space-y-3">
                        {sale.lines.map((line) => {
                          const needsInput =
                            sale.status === "awaiting_pharmacist" &&
                            (line.trigger === "needs_approval" || line.qty_threshold != null);
                          const attachments = line.attachments || [];
                          return (
                            <div
                              key={line.id}
                              className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-white">{line.medicine_name}</p>
                                  <p className="text-xs text-white/55">
                                    Original qty {line.original_quantity}{line.sale_unit === "loose" && line.unit_name ? ` ${line.unit_name}` : ""} ·{" "}
                                    {formatCurrency(line.effective_price)} / unit
                                    {line.qty_threshold != null
                                      ? ` · Band ${bandLabel(line.qty_threshold, line.qty_final)}`
                                      : ""}
                                  </p>
                                </div>
                                {needsInput ? (
                                  <div className="w-28">
                                    <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/50">
                                      Qty
                                    </p>
                                    <Input
                                      type="number"
                                      min={line.qty_threshold ?? 1}
                                      max={line.qty_final ?? undefined}
                                      value={qtyByLine[line.id] ?? ""}
                                      onChange={(e) =>
                                        setQtyByLine((prev) => ({
                                          ...prev,
                                          [line.id]: e.target.value,
                                        }))
                                      }
                                      className="h-10 border-white/14 bg-[#120f3a] text-white"
                                    />
                                  </div>
                                ) : null}
                              </div>

                              {attachments.length ? (
                                <div className="space-y-2 border-l-2 border-teal-400/35 pl-3">
                                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-teal-200/80">
                                    Attached with {line.medicine_name}
                                  </p>
                                  {attachments.map((attachment) => {
                                    const attachmentNeedsInput =
                                      sale.status === "awaiting_pharmacist";
                                    return (
                                      <div
                                        key={attachment.id}
                                        className="rounded-lg border border-dashed border-teal-400/25 bg-teal-400/5 p-3"
                                      >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div>
                                            <p className="text-xs font-semibold text-teal-100/90">
                                              Attachment · goes with {line.medicine_name}
                                            </p>
                                            <p className="mt-0.5 font-medium text-white">
                                              {attachment.medicine_name}
                                            </p>
                                            <p className="text-xs text-white/55">
                                              {formatCurrency(attachment.effective_price)} / unit
                                              {attachment.qty_threshold != null
                                                ? ` · Band ${bandLabel(
                                                    attachment.qty_threshold,
                                                    attachment.qty_final,
                                                  )}`
                                                : ""}
                                            </p>
                                          </div>
                                          {attachmentNeedsInput ? (
                                            <div className="w-28">
                                              <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/50">
                                                Qty
                                              </p>
                                              <Input
                                                type="number"
                                                min={attachment.qty_threshold ?? 1}
                                                max={attachment.qty_final ?? undefined}
                                                value={qtyByLine[attachment.id] ?? ""}
                                                onChange={(e) =>
                                                  setQtyByLine((prev) => ({
                                                    ...prev,
                                                    [attachment.id]: e.target.value,
                                                  }))
                                                }
                                                className="h-10 border-white/14 bg-[#120f3a] text-white"
                                              />
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {sale.status === "awaiting_manager" ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="border-white/15 bg-white/5 text-white"
                            disabled={loading}
                            onClick={() => void onRefresh()}
                          >
                            <RefreshCw className="mr-1.5 h-4 w-4" />
                            Refresh status
                          </Button>
                        ) : null}
                        {sale.status === "awaiting_pharmacist" ? (
                          <Button
                            type="button"
                            className="bg-teal-500 text-[#041018] hover:bg-teal-400"
                            disabled={submitting || loading}
                            onClick={() => void accept(sale)}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Accept & settle sale
                          </Button>
                        ) : null}
                        {sale.status !== "awaiting_manager" ? (
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={submitting || loading}
                            onClick={() => void rejectOrDismiss(sale)}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" />
                            {sale.status === "rejected" ? "Dismiss" : "Customer declined"}
                          </Button>
                        ) : null}
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
