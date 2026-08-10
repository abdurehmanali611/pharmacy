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
import { UserCreation } from "@/lib/actions";
import { registration } from "@/lib/validations";

const RECEIPT_KEY = "medicare_signup_receipt";

type Receipt = { username: string; pharmacy_name: string };

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

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

  const onSubmit = async (data: z.infer<typeof registration>) => {
    const result = await UserCreation(data, setLoading);
    if (!result) return;
    const next = {
      username: data.username.trim(),
      pharmacy_name: data.pharmacy_name.trim(),
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
                Pay the setup fee (15,000 ETB), then enter your Telebirr/CBE transfer ID.
              </p>
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
            {loading ? "Submitting…" : "Register & submit payment"}
          </Button>
          <p className="text-center text-sm text-white/55">
            <Link
              href="/Login"
              className="font-semibold text-apex-orange-light transition hover:text-white"
            >
              Already have an account? Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
