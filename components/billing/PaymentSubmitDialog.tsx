"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Logout, submitTenantPayment } from "@/lib/actions";
import { tenantPayment } from "@/lib/validations";

type PaymentKind = "setup" | "quarterly";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentKind: PaymentKind;
  amountETB: number;
  pendingMessage?: string | null;
  onSubmitted?: () => void;
  /** When true, dialog cannot be dismissed until payment is submitted or user signs out. */
  blocking?: boolean;
  infoLines?: string[];
};

export function PaymentSubmitDialog({
  open,
  onOpenChange,
  paymentKind,
  amountETB,
  pendingMessage,
  onSubmitted,
  blocking = false,
  infoLines,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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

  const description = useMemo(() => {
    if (paymentKind === "setup") {
      return "Your free trial has ended (or is ending). Pay the Medicare setup fee to Apex Solution, then enter your transfer ID.";
    }
    return "Your quarterly subscription needs renewal. Pay Apex Solution, then enter your transfer ID for approval.";
  }, [paymentKind]);

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
      if (!blocking) onOpenChange(false);
      onSubmitted?.();
      if (paymentKind === "setup") {
        localStorage.setItem("access_mode", "denied");
      }
    } catch (err: unknown) {
      const detail =
        typeof err === "object" &&
        err &&
        "response" in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail === "string"
          ? (err as { response: { data: { detail: string } } }).response.data.detail
          : "Failed to submit payment";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await Logout();
      router.replace("/Login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (blocking && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        showCloseButton={!blocking}
        onPointerDownOutside={(e) => {
          if (blocking) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (blocking) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            {infoLines?.length ? (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {infoLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {pendingMessage ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              {pendingMessage}
            </p>
          ) : null}

          {blocking ? (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-sm text-amber-100">
              Access is paused until Apex approves this payment. Submit a transfer ID or sign out.
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
            <DialogFooter
              className={
                blocking
                  ? "flex-col gap-2 sm:flex-col sm:space-x-0"
                  : undefined
              }
            >
              {blocking ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={submitting || signingOut}
                  onClick={() => void handleSignOut()}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting || signingOut}
                className={blocking ? "w-full" : undefined}
              >
                {submitting ? "Submitting…" : "Submit transfer ID"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
