"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  APEX_SOLUTION_CBE_ACCOUNT,
  PAYMENT_CHANNEL_META,
  PAYMENT_CHANNELS,
} from "@/constants/payments";
import { submitTenantPayment } from "@/lib/actions";
import { tenantPayment } from "@/lib/validations";

type PaymentKind = "setup" | "quarterly";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentKind: PaymentKind;
  amountETB: number;
  pendingMessage?: string | null;
  onSubmitted?: () => void;
};

export function PaymentSubmitDialog({
  open,
  onOpenChange,
  paymentKind,
  amountETB,
  pendingMessage,
  onSubmitted,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof tenantPayment>>({
    resolver: zodResolver(tenantPayment),
    defaultValues: {
      payment_channel: PAYMENT_CHANNELS[0],
      transaction_ref: "",
    },
  });

  const channel = form.watch("payment_channel") as keyof typeof PAYMENT_CHANNEL_META;
  const meta = PAYMENT_CHANNEL_META[channel] || PAYMENT_CHANNEL_META.Telebirr;

  const title = useMemo(
    () =>
      paymentKind === "setup" ? "Setup fee verification" : "Quarterly subscription payment",
    [paymentKind],
  );

  async function onSubmit(values: z.infer<typeof tenantPayment>) {
    setSubmitting(true);
    try {
      const result = await submitTenantPayment({
        payment_kind: paymentKind,
        payment_channel: values.payment_channel,
        transaction_ref: values.transaction_ref.trim(),
      });
      toast.success(result.detail || "Transfer ID submitted for Apex approval");
      form.reset({
        payment_channel: values.payment_channel,
        transaction_ref: "",
      });
      onOpenChange(false);
      onSubmitted?.();
      if (paymentKind === "setup") {
        localStorage.setItem("access_mode", "denied");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pay Apex Solution, then enter your bank/Telebirr transfer ID for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Apex Solution — CBE account
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-primary">
              {APEX_SOLUTION_CBE_ACCOUNT}
            </p>
            <p className="mt-2 text-sm">
              Amount due:{" "}
              <Badge variant="secondary">{amountETB.toLocaleString()} ETB</Badge>
            </p>
          </div>

          {pendingMessage ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              {pendingMessage}
            </p>
          ) : null}

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <CustomFormField
              control={form.control}
              name="payment_channel"
              fieldType={formFieldTypes.RADIO_BUTTON}
              label="Payment channel"
              options={PAYMENT_CHANNELS.map((item) => ({
                label: PAYMENT_CHANNEL_META[item].shortLabel,
                value: item,
                description: PAYMENT_CHANNEL_META[item].hint,
              }))}
            />
            <CustomFormField
              control={form.control}
              name="transaction_ref"
              fieldType={formFieldTypes.INPUT}
              label={meta.transactionFieldLabel}
              placeholder={meta.transactionPlaceholder}
              description={meta.hint}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit transfer ID"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
