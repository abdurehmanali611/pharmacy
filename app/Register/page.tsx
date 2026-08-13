"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { SignupPendingApprovalScreen } from "@/components/billing/SignupPendingApprovalScreen";
import { AuthFrame } from "@/components/chrome/AuthFrame";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import {
  APEX_SOLUTION_CBE_ACCOUNT,
  PAYMENT_CHANNEL_META,
  PAYMENT_CHANNELS,
} from "@/constants/payments";
import { UserCreation, fetchPublicPricing } from "@/lib/actions";
import { registration } from "@/lib/validations";

const RECEIPT_KEY = "medicare_signup_receipt";

type Receipt = {
  username: string;
  pharmacy_name: string;
  pharmacy_tin?: string;
  payment_channel?: string;
  payment_transaction_ref?: string;
  setup_fee_etb?: number;
};

function formatEtb(n: number) {
  return `${Math.round(n).toLocaleString()} ETB`;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [setupFee, setSetupFee] = useState<number | null>(null);
  const [quarterlyFee, setQuarterlyFee] = useState<number | null>(null);
  const [pricingDescription, setPricingDescription] = useState("");
  const [pricingLoading, setPricingLoading] = useState(true);

  const form = useForm<z.infer<typeof registration>>({
    resolver: zodResolver(registration),
    defaultValues: {
      username: "",
      password: "",
      pharmacy_name: "",
      role: "Manager",
      logoUrl: "",
      pharmacy_tin: "",
      payment_channel: PAYMENT_CHANNELS[0],
      payment_transaction_ref: "",
    },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECEIPT_KEY);
      if (raw) setReceipt(JSON.parse(raw) as Receipt);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      setPricingLoading(true);
      try {
        const data = await fetchPublicPricing();
        if (!active) return;
        setSetupFee(Number(data.setup_fee_etb) || 0);
        setQuarterlyFee(Number(data.quarterly_fee_etb) || 0);
        setPricingDescription((data.description || "").trim());
      } catch {
        if (!active) return;
        setSetupFee(15000);
        setQuarterlyFee(5000);
      } finally {
        if (active) setPricingLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: z.infer<typeof registration>) => {
    const result = await UserCreation(data, setLoading);
    if (!result) return;
    const next: Receipt = {
      username: data.username.trim(),
      pharmacy_name: data.pharmacy_name.trim(),
      pharmacy_tin: data.pharmacy_tin.trim(),
      payment_channel: data.payment_channel,
      payment_transaction_ref: data.payment_transaction_ref?.trim() ?? "",
      setup_fee_etb: setupFee ?? undefined,
    };
    localStorage.setItem(RECEIPT_KEY, JSON.stringify(next));
    setReceipt(next);
    form.reset({
      username: "",
      password: "",
      pharmacy_name: "",
      role: "Manager",
      logoUrl: "",
      pharmacy_tin: "",
      payment_channel: PAYMENT_CHANNELS[0],
      payment_transaction_ref: "",
    });
  };

  const setupLabel =
    setupFee == null || pricingLoading ? "…" : formatEtb(setupFee);

  return (
    <AuthFrame
      eyebrow="New pharmacy"
      title="Register your pharmacy"
      description="Create a manager account, pay the Medicare setup fee to Apex Solution, and submit your transfer ID for approval."
      sideLabel="Get started"
      sideTitle="Self-serve onboarding with Apex approval."
      sideCopy={`Transfer the setup fee to CBE ${APEX_SOLUTION_CBE_ACCOUNT}, then enter the transaction ID. After Apex approves, you can sign in to Medicare.`}
    >
      {receipt ? (
        <SignupPendingApprovalScreen
          username={receipt.username}
          pharmacyName={receipt.pharmacy_name}
          pharmacyTin={receipt.pharmacy_tin}
          paymentChannel={receipt.payment_channel}
          paymentTransactionRef={receipt.payment_transaction_ref}
          setupFeeEtb={receipt.setup_fee_etb}
        />
      ) : (
        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-5 md:grid-cols-2">
            <CustomFormField
              name="pharmacy_name"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Pharmacy Name"
              placeholder="Enter pharmacy name"
            />
            <CustomFormField
              name="pharmacy_tin"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Pharmacy TIN"
              placeholder="Enter pharmacy TIN"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <CustomFormField
              name="username"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Manager Username"
              placeholder="Enter username"
            />
            <CustomFormField
              name="password"
              control={form.control}
              fieldType={formFieldTypes.INPUT}
              label="Password"
              placeholder="Enter password"
              type="password"
            />
          </div>
          <CustomFormField
            name="logoUrl"
            control={form.control}
            fieldType={formFieldTypes.IMAGE_UPLOADER}
            label="Pharmacy Logo"
          />

          <div className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Apex Solution — CBE account
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-primary">
                {APEX_SOLUTION_CBE_ACCOUNT}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pay the setup fee ({setupLabel}), then enter your Telebirr/CBE
                transfer ID.
              </p>
              {pricingDescription ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {pricingDescription}
                </p>
              ) : null}
              {quarterlyFee != null && !pricingLoading ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  After setup approval, quarterly subscription is{" "}
                  <span className="font-medium text-foreground/90">
                    {formatEtb(quarterlyFee)}
                  </span>
                  .
                </p>
              ) : null}
            </div>
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
              name="payment_transaction_ref"
              fieldType={formFieldTypes.INPUT}
              label="Transfer / transaction ID"
              placeholder="Enter the transfer ID from your receipt"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting…" : `Register · pay ${setupLabel}`}
          </Button>
          <p className="text-center text-sm text-white/50">
            Already registered?{" "}
            <Link
              href="/Login"
              className="text-white/75 underline-offset-4 transition hover:text-white hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
