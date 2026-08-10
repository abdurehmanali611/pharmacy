"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthFrame } from "@/components/chrome/AuthFrame";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  APEX_SOLUTION_CBE_ACCOUNT,
  PAYMENT_CHANNEL_META,
  PAYMENT_CHANNELS,
} from "@/constants/payments";
import { getBillingMe, Logout, submitTenantPayment } from "@/lib/actions";

const schema = z.object({
  payment_channel: z.string().min(1, "Choose a payment channel"),
  transaction_ref: z.string().min(4, "Transfer ID must be at least 4 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function PaymentVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [billing, setBilling] = useState<any>(null);
  const [paymentKind, setPaymentKind] = useState<string>("setup");
  const [pending, setPending] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_channel: PAYMENT_CHANNELS[0],
      transaction_ref: "",
    },
  });

  const channel = form.watch("payment_channel") as keyof typeof PAYMENT_CHANNEL_META;
  const meta = PAYMENT_CHANNEL_META[channel] || PAYMENT_CHANNEL_META.Telebirr;

  const amount = useMemo(() => {
    if (!billing) return 0;
    return paymentKind === "quarterly"
      ? Number(billing.quarterly_fee_etb || 0)
      : Number(billing.setup_fee_etb || 0);
  }, [billing, paymentKind]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("Role") || "").toLowerCase();
    const mode = localStorage.getItem("access_mode");
    if (!token) {
      router.replace("/Login");
      return;
    }
    if (role !== "manager") {
      toast.error("Only managers can complete payment verification.");
      router.replace("/Login");
      return;
    }
    if (mode && mode !== "payment_portal") {
      router.replace("/Manager");
      return;
    }

    void getBillingMe()
      .then((data) => {
        setBilling(data.billing);
        setPaymentKind(data.payment_kind || localStorage.getItem("payment_kind") || "setup");
        setPending(data.pending_submission);
        if (data.access_mode === "full") {
          localStorage.setItem("access_mode", "full");
          router.replace("/Manager");
        }
      })
      .catch((err: any) => {
        toast.error(err?.response?.data?.detail || "Failed to load billing");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result = await submitTenantPayment({
        payment_kind: paymentKind,
        payment_channel: values.payment_channel,
        transaction_ref: values.transaction_ref.trim(),
      });
      setPending(result.submission);
      setBilling(result.billing);
      toast.success(result.detail || "Payment submitted for Apex approval");
      form.reset({
        payment_channel: values.payment_channel,
        transaction_ref: "",
      });
      if (paymentKind === "setup") {
        toast.message("You will regain access once Apex approves the setup payment.");
        await Logout();
        router.replace("/Login");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Billing"
      title="Payment verification"
      description="Transfer the required fee to Apex Solution, then submit your transfer ID for approval."
      sideLabel="Apex Billing"
      sideTitle="Unlock your Medicare workspace."
      sideCopy={`Send payment to CBE ${APEX_SOLUTION_CBE_ACCOUNT}. Setup and quarterly renewals are reviewed by Apex before full access is restored.`}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading billing…</p>
      ) : (
        <div className="space-y-5">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardDescription className="capitalize">{paymentKind} fee</CardDescription>
              <CardTitle className="text-3xl">{amount.toLocaleString()} ETB</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Deposit to Apex Solution CBE account:</p>
              <Badge variant="outline" className="font-mono text-sm">
                {APEX_SOLUTION_CBE_ACCOUNT}
              </Badge>
              {pending ? (
                <p>
                  Pending submission: <span className="font-mono">{pending.transaction_ref}</span> (
                  {pending.status})
                </p>
              ) : null}
            </CardContent>
          </Card>

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
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit transfer ID"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await Logout();
                router.replace("/Login");
              }}
            >
              Sign out
            </Button>
          </form>
        </div>
      )}
    </AuthFrame>
  );
}
