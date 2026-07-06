"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ConfirmDeleteButton } from "@/components/manager/ConfirmDeleteButton";
import { paginateItems, TablePagination } from "@/components/manager/TablePagination";
import { workspacePanelClass } from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { addCashout } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { CashoutData } from "@/lib/actions";

const CASHOUT_PAGE_SIZE = 3;

export function CashoutManagementSection({
  form,
  loading,
  cashouts,
  cashoutToEdit,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
}: {
  form: UseFormReturn<z.infer<typeof addCashout>>;
  loading: boolean;
  cashouts: CashoutData[];
  cashoutToEdit: CashoutData | null;
  onSubmit: (data: z.infer<typeof addCashout>) => void | Promise<void>;
  onEdit: (cashout: CashoutData) => void;
  onDelete: (id: string) => void | Promise<void>;
  onCancelEdit: () => void;
}) {
  const [page, setPage] = useState(1);
  const { items: pagedCashouts, safePage, totalCount } = paginateItems(cashouts, page, CASHOUT_PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
      <Card className={cn(workspacePanelClass, "p-6")}>
        <CardHeader>
          <CardTitle>{cashoutToEdit ? "Edit cashout" : "Add cashout"}</CardTitle>
          <CardDescription>Record money going out with the reason so it appears in reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <CustomFormField
              name="amount"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Amount"
              placeholder="0.00"
              type="number"
            />
            <CustomFormField
              name="reason"
              control={form.control}
              fieldType={formFieldTypes.TEXTAREA}
              label="Reason"
              placeholder="Why was this cash taken out?"
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : cashoutToEdit ? "Update cashout" : "Add cashout"}
              </Button>
              {cashoutToEdit ? (
                <Button type="button" variant="secondary" onClick={onCancelEdit}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className={cn(workspacePanelClass, "p-6")}>
        <CardHeader>
          <CardTitle>Cashout history</CardTitle>
          <CardDescription>Every cashout is saved per pharmacy with amount and reason.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCashouts.length ? (
                pagedCashouts.map((cashout) => (
                  <TableRow key={cashout.id}>
                    <TableCell className="font-medium">{formatCurrency(cashout.amount)}</TableCell>
                    <TableCell>{cashout.reason}</TableCell>
                    <TableCell>{format(parseISO(cashout.created_at), "PPP p")}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(cashout)}>
                        Edit
                      </Button>
                      <ConfirmDeleteButton
                        title="Delete cashout?"
                        description={`Delete the cashout entry for ${formatCurrency(cashout.amount)}. This action cannot be undone.`}
                        onConfirm={() => onDelete(cashout.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No cashouts added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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
