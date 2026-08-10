"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  APEX_SOLUTION_CBE_ACCOUNT,
  PAYMENT_CHANNEL_META,
  PAYMENT_CHANNELS,
} from "@/constants/payments";
import {
  fetchSignupRegistrationStatus,
  resubmitSignupSetupPayment,
} from "@/lib/actions";

const resubmitSchema = z.object({
  password: z.string().min(2, "Password is required"),
  payment_channel: z.string().min(1, "Select a payment channel"),
  transaction_ref: z.string().min(4, "Transfer ID must be at least 4 characters"),
});

type ResubmitValues = z.infer<typeof resubmitSchema>;

export function SignupPendingApprovalScreen({
  username,
  pharmacyName,
}: {
  username: string;
  pharmacyName: string;
}) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "not_found">(
    "pending",
  );
  const [reason, setReason] = useState("");
  const [fee, setFee] = useState(15000);
  const [loading, setLoading] = useState(false);

  const form = useForm<ResubmitValues>({
    resolver: zodResolver(resubmitSchema),
    defaultValues: {
      password: "",
      payment_channel: PAYMENT_CHANNELS[0],
      transaction_ref: "",
    },
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchSignupRegistrationStatus(username);
        if (!active) return;
        if (data.status === "approved") {
          localStorage.removeItem("medicare_signup_receipt");
        }
        setStatus(data.status);
        setReason(data.rejection_reason || "");
        if (data.setup_fee_etb) setFee(data.setup_fee_etb);
      } catch {
        // keep polling
      }
    };
    void load();
    const id = window.setInterval(load, 20000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [username]);

  async function onResubmit(values: ResubmitValues) {
    setLoading(true);
    try {
      await resubmitSignupSetupPayment({
        username,
        password: values.password,
        payment_channel: values.payment_channel,
        transaction_ref: values.transaction_ref.trim(),
      });
      setStatus("pending");
      toast.success("Setup payment resubmitted for Apex approval");
      form.reset({
        password: "",
        payment_channel: values.payment_channel,
        transaction_ref: "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to resubmit payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardDescription>Registration status</CardDescription>
        <CardTitle>{pharmacyName || "Your pharmacy"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge className="capitalize">{status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Apex reviews setup payments against CBE account{" "}
          <span className="font-mono text-foreground">{APEX_SOLUTION_CBE_ACCOUNT}</span>. Typical
          wait is about 30 minutes.
        </p>
        <p className="text-sm">
          Setup fee: <strong>{fee.toLocaleString()} ETB</strong>
        </p>

        {status === "approved" ? (
          <Button asChild className="w-full">
            <Link href="/Login">Setup approved — sign in</Link>
          </Button>
        ) : null}

        {status === "pending" ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Waiting for Apex approval. This page refreshes automatically.
          </p>
        ) : null}

        {status === "rejected" ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
              Rejected{reason ? `: ${reason}` : "."} Submit a new transfer ID below.
            </p>
            <form className="space-y-4" onSubmit={form.handleSubmit(onResubmit)}>
              <CustomFormField
                control={form.control}
                name="password"
                fieldType={formFieldTypes.INPUT}
                type="password"
                label="Confirm password"
              />
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
                label="New transfer ID"
                placeholder="Transaction / transfer reference"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resubmitting…" : "Resubmit transfer ID"}
              </Button>
            </form>
          </div>
        ) : null}

        {status !== "approved" ? (
          <Button asChild variant="ghost" className="w-full">
            <Link href="/Login">Back to sign in</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
