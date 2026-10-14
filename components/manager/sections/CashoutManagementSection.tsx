"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import { Banknote, CalendarClock, Coins, Pencil, Receipt } from "lucide-react";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { DateFilterPicker } from "@/components/manager/DateFilterPicker";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import { BatchCashoutDialog } from "@/components/manager/batch/BatchCashoutDialog";
import {
  workspaceInnerPanelClass,
  workspacePanelClass,
  WorkspaceModuleHeader,
  WorkspaceStat,
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
  "h-11 rounded-lg border-white/14 bg-[#111d2a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20";
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
  const filteredCashouts = cashouts.filter((cashout) => {
    const createdDate = cashout.created_at.slice(0, 10);
    return (!fromDate || createdDate >= fromDate) && (!toDate || createdDate <= toDate);
  });
  const { items: pagedCashouts, safePage, totalCount } = paginateItems(filteredCashouts, page, CASHOUT_PAGE_SIZE);

  const totalCashout = cashouts.reduce((sum, cashout) => sum + Number(cashout.amount || 0), 0);
  const filteredTotal = filteredCashouts.reduce((sum, cashout) => sum + Number(cashout.amount || 0), 0);
  const averageCashout = cashouts.length ? totalCashout / cashouts.length : 0;

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <WorkspaceStat label="Total cashouts" value={String(cashouts.length)} icon={Receipt} />
        <WorkspaceStat label="Total withdrawn" value={formatCurrency(totalCashout)} icon={Banknote} />
        <WorkspaceStat
          label="Average cashout"
          value={formatCurrency(averageCashout)}
          tone="text-white/85"
          icon={Coins}
        />
        <WorkspaceStat
          label={fromDate || toDate ? "Filtered total" : "Filtered total"}
          value={formatCurrency(filteredTotal)}
          tone="text-apex-orange-light"
          icon={CalendarClock}
        />
      </div>
      {cashoutToEdit ? (
        <Dialog open onOpenChange={(open) => { if (!open) onCancelEdit(); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border border-white/12 bg-[#0b1420] p-0 text-white shadow-xl ring-0 sm:max-w-2xl">
            <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-red-200">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"/>
                    <path d="M8 10h8M8 14h5"/>
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-white/45">Cashout record</p>
                  <DialogTitle className="mt-1 text-lg font-semibold text-white">Edit cashout</DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-white/60">Adjust the cash movement and the reason attached to it.</DialogDescription>
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
                inputClassName="min-h-[8rem] rounded-lg border-white/14 bg-[#111d2a] text-white placeholder:text-white/35 shadow-none focus-visible:border-teal-400/60 focus-visible:ring-teal-400/20"
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
        <WorkspaceModuleHeader
          kicker="Ledger"
          title="Cashout history"
          description="Every cashout is saved per pharmacy with amount and reason."
        />
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-end">
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
          </div>
          <div className={cn(workspaceInnerPanelClass, "overflow-x-auto")}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {["Amount", "Reason", "Date", "Actions"].map((header) => (
                  <TableHead
                    key={header}
                    className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/45"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCashouts.length ? (
                pagedCashouts.map((cashout) => (
                  <TableRow key={cashout.id} className="border-white/8 hover:bg-white/4">
                    <TableCell className="font-medium text-apex-orange-light">
                      {formatCurrency(cashout.amount)}
                    </TableCell>
                    <TableCell className="text-white/80">{cashout.reason}</TableCell>
                    <TableCell className="text-white/70">{format(parseISO(cashout.created_at), "PPP p")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="border-white/12 bg-white/5"
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
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-white/40">
                    No cashouts added yet.
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
