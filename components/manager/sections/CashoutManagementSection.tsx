"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import { Banknote, CalendarClock, Pencil, Receipt } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { EmptyState, ListToolbar, SectionTitle, tableHeadClass } from "@/components/manager/kit";
import { ExportMenu } from "@/components/manager/ExportMenu";
import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import { BatchCashoutDialog } from "@/components/manager/batch/BatchCashoutDialog";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
} from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { addCashout } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { CashoutData } from "@/lib/actions";

const CASHOUT_PAGE_SIZE = 3;
const cashoutEditControlClass =
  "h-11 rounded-lg border-white/14 bg-[#120f3a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";
const cashoutEditLabelClass = "text-xs font-semibold text-white/65";

export function CashoutManagementSection({
  form,
  loading,
  cashouts,
  cashoutToEdit,
  onSubmit,
  onRefresh,
  onEdit,
  onDelete,
  onCancelEdit,
}: {
  form: UseFormReturn<z.infer<typeof addCashout>>;
  loading: boolean;
  cashouts: CashoutData[];
  cashoutToEdit: CashoutData | null;
  onSubmit: (data: z.infer<typeof addCashout>) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onEdit: (cashout: CashoutData) => void;
  onDelete: (id: string) => void | Promise<void>;
  onCancelEdit: () => void;
}) {
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const filteredCashouts = cashouts.filter((cashout) => {
    const createdDate = cashout.created_at.slice(0, 10);
    if (fromDate && createdDate < fromDate) return false;
    if (toDate && createdDate > toDate) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${cashout.reason} ${cashout.amount}`.toLowerCase().includes(q);
  });
  const { items: pagedCashouts, safePage, totalCount } = paginateItems(filteredCashouts, page, CASHOUT_PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="flex flex-col gap-6">
      {cashoutToEdit ? (
        <Dialog open onOpenChange={(open) => { if (!open) onCancelEdit(); }}>
          <DialogContent className="max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto p-0 text-white sm:max-w-2xl">
            <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14">
              <div className="flex items-center gap-3">
                <span className="tint-icon tint-pink flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Banknote className="size-5" />
                </span>
                <div>
                  <DialogTitle className="font-display text-xl font-bold text-white">Edit cashout</DialogTitle>
                  <DialogDescription className="mt-0.5 text-sm text-white/60">Adjust the cash movement and the reason attached to it.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form className="grid gap-5 p-5 sm:p-6" onSubmit={form.handleSubmit(onSubmit)}>
              <CustomFormField
                name="amount"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Amount"
                placeholder="0.00"
                type="number"
                labelClassName={cashoutEditLabelClass}
                inputClassName={cashoutEditControlClass}
              />
              <CustomFormField
                name="reason"
                control={form.control}
                fieldType={formFieldTypes.TEXTAREA}
                label="Reason"
                placeholder="Why was this cash taken out?"
                labelClassName={cashoutEditLabelClass}
                inputClassName="min-h-[8rem] rounded-lg border-white/14 bg-[#120f3a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20"
              />
              <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
                <Button type="button" variant="outline" className="border-white/14 bg-white/5" onClick={onCancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Update cashout"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : (
        <BatchCashoutDialog onSuccess={onRefresh} />
      )}

      <Card className={cn(workspacePanelClass, "overflow-hidden p-0")}>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionTitle
            icon={Receipt}
            tint="pink"
            title="Cashout history"
            subtitle={`Showing ${filteredCashouts.length} of ${cashouts.length} · every cashout is saved per pharmacy with amount and reason`}
            right={
              <ExportMenu
                build={() => {
                  const total = filteredCashouts.reduce((sum, i) => sum + Number(i.amount || 0), 0);
                  return {
                    fileName: "cashouts",
                    title: "Cashouts",
                    subtitle: `${filteredCashouts.length} cashout${filteredCashouts.length === 1 ? "" : "s"} in the current view`,
                    summary: [
                      ["Cashouts", filteredCashouts.length],
                      ["Total cashed out", total],
                    ],
                    sections: [
                      {
                        name: "Cashouts",
                        heading: "Cashout history",
                        columns: [{ header: "Date" }, { header: "Reason" }, { header: "Amount", kind: "money" }],
                        rows: filteredCashouts.map((i) => [String(i.created_at ?? "").slice(0, 10), i.reason, Number(i.amount || 0)]),
                        totals: ["Total", "", total],
                      },
                    ],
                  };
                }}
              />
            }
          />
          <ListToolbar
            search={search}
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            searchPlaceholder="Search reason or amount…"
            extra={
              <>
                <DateFilterPicker
                  value={fromDate}
                  onChange={(value) => { setFromDate(value); setPage(1); }}
                  placeholder="From date"
                />
                <DateFilterPicker
                  value={toDate}
                  onChange={(value) => { setToDate(value); setPage(1); }}
                  placeholder="To date"
                />
                {(fromDate || toDate) ? (
                  <Button type="button" variant="ghost" onClick={() => { setFromDate(""); setToDate(""); setPage(1); }}>
                    Clear dates
                  </Button>
                ) : null}
              </>
            }
          />
          <div className={cn(workspaceInnerPanelClass, "overflow-x-auto")}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {["Amount", "Reason", "Date", "Actions"].map((header) => (
                  <TableHead key={header} className={tableHeadClass}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCashouts.length ? (
                pagedCashouts.map((cashout) => (
                  <TableRow key={cashout.id} className="border-white/8">
                    <TableCell>
                      <span className="inline-flex items-center gap-2 rounded-xl border border-pink-300/40 bg-[linear-gradient(135deg,rgba(244,114,182,0.26),rgba(168,85,247,0.2))] px-3 py-1.5 font-display text-sm font-bold tabular-nums text-white">
                        <Banknote className="size-4 text-pink-200" />
                        {formatCurrency(cashout.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md text-white/85">{cashout.reason}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-white/75">
                        <CalendarClock className="size-3.5 text-cyan-300" />
                        {format(parseISO(cashout.created_at), "PPP p")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => onEdit(cashout)}
                          aria-label={`Edit cashout of ${formatCurrency(cashout.amount)}`}
                          title={`Edit cashout of ${formatCurrency(cashout.amount)}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDeleteButton
                          title="Delete cashout?"
                          description={`Delete the cashout entry for ${formatCurrency(cashout.amount)}. This action cannot be undone.`}
                          onConfirm={() => onDelete(cashout.id)}
                          iconOnly
                          ariaLabel={`Delete cashout of ${formatCurrency(cashout.amount)}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="p-4">
                    <EmptyState
                      icon={Receipt}
                      tint="pink"
                      title={cashouts.length ? "No cashouts match" : "No cashouts added yet"}
                      description={cashouts.length ? "Try another search or date range." : "Record a cashout above to see it here."}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {totalCount > 0 ? (
            <TablePagination
              page={safePage}
              pageSize={CASHOUT_PAGE_SIZE}
              totalCount={totalCount}
              onPageChange={setPage}
              itemLabel="cashouts"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
