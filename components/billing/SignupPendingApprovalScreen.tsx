"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
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
  APEX_WHATSAPP_SUPPORT,
  PAYMENT_CHANNEL_META,
  PAYMENT_CHANNELS,
  SETUP_APPROVAL_WAIT_MINUTES,
} from "@/constants/payments";
import {
  fetchSignupRegistrationStatus,
  resubmitSignupSetupPayment,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

const RECEIPT_KEY = "medicare_signup_receipt";

const resubmitSchema = z.object({
  password: z.string().min(2, "Password is required"),
  payment_channel: z.string().min(1, "Select a payment channel"),
  transaction_ref: z.string().min(4, "Transfer ID must be at least 4 characters"),
});

type ResubmitValues = z.infer<typeof resubmitSchema>;

export type SignupReceipt = {
  username: string;
  pharmacy_name: string;
  pharmacy_tin?: string;
  payment_channel?: string;
  payment_transaction_ref?: string;
  setup_fee_etb?: number;
};

function WhatsAppSupport() {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/4 p-4">
      <p className="text-sm font-medium text-foreground">Need help or faster approval?</p>
      <p className="text-sm text-muted-foreground">
        Message Apex support on WhatsApp with your pharmacy name and payment reference.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {APEX_WHATSAPP_SUPPORT.map((line) => (
          <Button key={line.waMe} asChild variant="outline" className="justify-center gap-2">
            <a href={`https://wa.me/${line.waMe}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 shrink-0" />
              {line.e164}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}

function ReviewSummary({
  pharmacyName,
  username,
  pharmacyTin,
  paymentChannel,
  transactionRef,
  setupFee,
}: {
  pharmacyName: string;
  username: string;
  pharmacyTin?: string;
  paymentChannel?: string;
  transactionRef?: string;
  setupFee?: number;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Registration review
      </p>
      <div className="grid gap-1.5">
        <p>
          <span className="text-muted-foreground">Pharmacy:</span>{" "}
          <span className="font-medium text-foreground">{pharmacyName}</span>
        </p>
        {pharmacyTin ? (
          <p>
            <span className="text-muted-foreground">TIN:</span>{" "}
            <span className="font-mono text-foreground">{pharmacyTin}</span>
          </p>
        ) : null}
        <p>
          <span className="text-muted-foreground">Username:</span>{" "}
          <span className="font-medium text-foreground">{username}</span>
        </p>
        {setupFee != null ? (
          <p>
            <span className="text-muted-foreground">Setup fee:</span>{" "}
            <span className="font-medium text-foreground">
              {setupFee.toLocaleString()} ETB
            </span>
          </p>
        ) : null}
        {paymentChannel || transactionRef ? (
          <p className="font-mono text-xs text-muted-foreground">
            {[paymentChannel, transactionRef].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SignupPendingApprovalScreen({
  username,
  pharmacyName,
  pharmacyTin,
  paymentChannel: initialChannel,
  paymentTransactionRef: initialRef,
  setupFeeEtb,
}: {
  username: string;
  pharmacyName: string;
  pharmacyTin?: string;
  paymentChannel?: string;
  paymentTransactionRef?: string;
  setupFeeEtb?: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "not_found">(
    "pending",
  );
  const [reason, setReason] = useState("");
  const [fee, setFee] = useState(setupFeeEtb ?? 15000);
  const [displayName, setDisplayName] = useState(pharmacyName);
  const [tin, setTin] = useState(pharmacyTin || "");
  const [channel, setChannel] = useState(initialChannel || "");
  const [transactionRef, setTransactionRef] = useState(initialRef || "");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const form = useForm<ResubmitValues>({
    resolver: zodResolver(resubmitSchema),
    defaultValues: {
      password: "",
      payment_channel: initialChannel || PAYMENT_CHANNELS[0],
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
          localStorage.removeItem(RECEIPT_KEY);
        }
        setStatus(data.status);
        setReason(data.rejection_reason || "");
        if (data.setup_fee_etb) setFee(data.setup_fee_etb);
        if (data.pharmacy_name) setDisplayName(data.pharmacy_name);
        if (data.pharmacy_tin) setTin(data.pharmacy_tin);
        if (data.payment_channel) setChannel(data.payment_channel);
        if (data.transaction_ref) setTransactionRef(data.transaction_ref);
      } catch {
        // keep polling
      } finally {
        if (active) setChecking(false);
      }
    };
    void load();
    const id = window.setInterval(load, 20000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [username]);

  useEffect(() => {
    if (status !== "approved") return;
    const id = window.setTimeout(() => {
      router.replace("/Login");
    }, 1800);
    return () => window.clearTimeout(id);
  }, [status, router]);

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
      setChannel(values.payment_channel);
      setTransactionRef(values.transaction_ref.trim());
      toast.success("Setup payment resubmitted for Apex approval");
      form.reset({
        password: "",
        payment_channel: values.payment_channel,
        transaction_ref: "",
      });
    } catch (err: unknown) {
      const detail =
        typeof err === "object" &&
        err &&
        "response" in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail === "string"
          ? (err as { response: { data: { detail: string } } }).response.data.detail
          : "Failed to resubmit payment";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }

  if (checking && status === "pending") {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/8 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <CardTitle>Checking registration…</CardTitle>
          <CardDescription>Looking up setup approval status for {username}.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "approved") {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle>Setup approved</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{displayName}</span> is ready. Redirecting
            you to sign in as <span className="font-medium text-foreground">{username}</span>…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/Login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "rejected") {
    return (
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
            <XCircle className="h-7 w-7" />
          </div>
          <CardTitle>Setup payment rejected</CardTitle>
          <CardDescription>
            Apex could not verify the payment for{" "}
            <span className="font-medium text-foreground">{displayName}</span>. Resubmit a corrected
            transfer ID below — refreshing keeps this status screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm">
            <p className="font-semibold">Reason from Apex</p>
            <p className="mt-1.5 text-muted-foreground">
              {reason || "Your setup payment was rejected. Please resubmit a corrected reference."}
            </p>
          </div>

          <ReviewSummary
            pharmacyName={displayName}
            username={username}
            pharmacyTin={tin}
            setupFee={fee}
          />

          <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Apex CBE account
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-primary">
                {APEX_SOLUTION_CBE_ACCOUNT}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Setup fee: {fee.toLocaleString()} ETB
              </p>
            </div>
            <form className="space-y-4" onSubmit={form.handleSubmit(onResubmit)}>
              <CustomFormField
                control={form.control}
                name="password"
                fieldType={formFieldTypes.INPUT}
                type="password"
                label={`Account password for ${username}`}
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
                {loading ? "Resubmitting…" : "Resubmit setup payment"}
              </Button>
            </form>
          </div>

          <WhatsAppSupport />
          <Button asChild variant="outline" className="w-full">
            <Link href="/Login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-200">
          <Clock className="h-7 w-7" />
        </div>
        <CardTitle>Registration submitted</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground">{displayName}</span> is registered. Apex is
          verifying your setup payment before access is enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-semibold">
            Please wait about {SETUP_APPROVAL_WAIT_MINUTES} minutes
          </p>
          <p className="mt-2 text-muted-foreground">
            You cannot sign in until Apex approves your setup fee. Refreshing this page keeps your
            pending status — it will not return you to the registration form.
          </p>
        </div>

        <ReviewSummary
          pharmacyName={displayName}
          username={username}
          pharmacyTin={tin}
          paymentChannel={channel}
          transactionRef={transactionRef}
          setupFee={fee}
        />

        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm text-muted-foreground">
          <span>Status: pending Apex review</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => {
              setChecking(true);
              void fetchSignupRegistrationStatus(username).then((data) => {
                if (data.status === "approved") localStorage.removeItem(RECEIPT_KEY);
                setStatus(data.status);
                setReason(data.rejection_reason || "");
                setChecking(false);
              });
            }}
          >
            <Loader2 className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <WhatsAppSupport />

        <div className="flex items-start gap-3 rounded-lg border border-dashed border-white/12 px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            After approval, you will be redirected to sign in with username{" "}
            <span className="font-medium text-foreground">{username}</span>.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/Login">Go to login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
