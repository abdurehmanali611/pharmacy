"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { SignupPendingApprovalScreen } from "@/components/billing/SignupPendingApprovalScreen";
import {
  AUTH_BAND,
  AUTH_BUTTON,
  AUTH_EYEBROW,
  AUTH_LINK,
  AUTH_MUTED,
  AUTH_PANEL_COOL,
  AUTH_PANEL_WARM,
  AUTH_SIGNUP_CARD,
  AUTH_SUBTITLE,
  AUTH_TITLE,
  AuthShell,
} from "@/components/chrome/AuthShell";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { SalesAgentSelector } from "@/components/signup/SalesAgentSelector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  APEX_SOLUTION_CBE_ACCOUNT,
  PAYMENT_CHANNEL_META,
  PAYMENT_CHANNELS,
  type PaymentChannel,
} from "@/constants/payments";
import { UserCreation, fetchPublicPricing, fetchPublicSalesAgents } from "@/lib/actions";
import { cn } from "@/lib/utils";
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

const SIGNUP_STEPS = [
  {
    label: "Pharmacy",
    title: "Your pharmacy",
    description: "Legal name, TIN, and the first manager login for your pharmacy.",
  },
  {
    label: "Payment",
    title: "Setup payment",
    description: "Transfer the setup fee to Apex Solution, then enter the transaction reference from your receipt.",
  },
  {
    label: "Finish",
    title: "Brand & finish",
    description: "Upload your logo, confirm your sales agent, and submit for Apex approval.",
  },
] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-3 gap-3">
      {SIGNUP_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.label} className="min-w-0 space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  done && "bg-apex-orange text-white",
                  active &&
                    "scale-110 bg-apex-orange/15 text-apex-orange-light ring-1 ring-apex-orange/40",
                  !done && !active && "bg-white/5 text-white/40",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-xs font-medium transition-colors duration-300",
                  active ? "text-white/85" : "text-white/35",
                )}
              >
                {step.label}
              </span>
            </div>
            <div
              className={cn(
                "h-0.5 w-full rounded-full transition-colors duration-500",
                done || active ? "bg-apex-orange/45" : "bg-white/10",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}

function SignupSection({
  title,
  description,
  children,
  tone = "warm",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "warm" | "cool";
}) {
  return (
    <section className={cn("space-y-4", tone === "cool" ? AUTH_PANEL_COOL : AUTH_PANEL_WARM)}>
      <div className="space-y-1">
        <h2
          className={cn(
            "text-sm font-semibold tracking-wide uppercase",
            tone === "cool" ? "text-sky-200/85" : "text-apex-orange-light/85",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("text-sm text-pretty", AUTH_MUTED)}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [setupFee, setSetupFee] = useState<number | null>(null);
  const [quarterlyFee, setQuarterlyFee] = useState<number | null>(null);
  const [pricingDescription, setPricingDescription] = useState("");
  const [pricingLoading, setPricingLoading] = useState(true);
  const [agents, setAgents] = useState<{ id: number; displayName: string; phone?: string | null; city?: string | null }[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [stepDir, setStepDir] = useState<"forward" | "back">("forward");
  const [submitError, setSubmitError] = useState<string[]>([]);

  const form = useForm<z.infer<typeof registration>>({
    resolver: zodResolver(registration),
    mode: "onTouched",
    defaultValues: {
      username: "",
      password: "",
      pharmacy_name: "",
      role: "Manager",
      logoUrl: "",
      pharmacy_tin: "",
      payment_channel: PAYMENT_CHANNELS[0],
      payment_transaction_ref: "",
      sales_agent_id: null,
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

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows = await fetchPublicSalesAgents();
        if (active) setAgents(rows);
      } catch {
        if (active) setAgents([]);
      } finally {
        if (active) setAgentsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: z.infer<typeof registration>) => {
    setSubmitError([]);
    const result = await UserCreation(data, setLoading, setSubmitError);
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
      sales_agent_id: null,
    });
  };

  const setupLabel =
    setupFee == null || pricingLoading ? "…" : formatEtb(setupFee);

  const lastStep = SIGNUP_STEPS.length - 1;
  const copy = SIGNUP_STEPS[step];

  const goNext = async () => {
    const fieldsByStep: (keyof z.infer<typeof registration>)[][] = [
      ["pharmacy_name", "pharmacy_tin", "username", "password"],
      ["payment_channel", "payment_transaction_ref"],
      ["logoUrl"],
    ];
    setSubmitError([]);
    const valid = await form.trigger(fieldsByStep[step] ?? []);
    if (!valid) return;
    setStepDir("forward");
    setStep((current) => Math.min(current + 1, lastStep));
  };

  const goBack = () => {
    setSubmitError([]);
    setStepDir("back");
    setStep((current) => Math.max(current - 1, 0));
  };

  const submitRegistration = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    await onSubmit(form.getValues());
  };

  return (
    <AuthShell>
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
        <Card className={cn("gap-0 py-0", AUTH_SIGNUP_CARD)}>
          <CardHeader className={cn("space-y-5 border-b px-6 pt-8 pb-6 sm:px-8", AUTH_BAND)}>
            <StepIndicator current={step} />
            <div
              key={`${step}-copy`}
              className="animate-in fade-in slide-in-from-bottom-2 space-y-2.5 duration-400"
            >
              <p className={AUTH_EYEBROW}>
                Step {step + 1} of {SIGNUP_STEPS.length}
              </p>
              <CardTitle className={cn("text-[1.65rem] leading-tight", AUTH_TITLE)}>
                {copy.title}
              </CardTitle>
              <CardDescription className={cn("max-w-xl text-[15px]", AUTH_SUBTITLE)}>
                {copy.description}
              </CardDescription>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="rounded-xl border border-apex-orange/15 bg-apex-orange/6 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-white/45 uppercase">
                    Setup fee
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-apex-orange-light">
                    {pricingLoading ? (
                      <Loader2 className="inline size-5 animate-spin text-white/40" />
                    ) : (
                      formatEtb(setupFee ?? 0)
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-400/15 bg-sky-400/6 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-white/45 uppercase">
                    Quarterly
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-sky-200">
                    {pricingLoading ? (
                      <Loader2 className="inline size-5 animate-spin text-white/40" />
                    ) : (
                      formatEtb(quarterlyFee ?? 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pt-7 pb-0">
            <form
              className="flex flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                if (step < lastStep) void goNext();
                else void submitRegistration();
              }}
            >
              <div
                key={step}
                className={cn(
                  "flex flex-col gap-6 animate-in fade-in duration-500 fill-mode-both",
                  stepDir === "back" ? "slide-in-from-left-6" : "slide-in-from-right-6",
                )}
              >
                {step === 0 ? (
                  <>
                    <SignupSection
                      title="Pharmacy details"
                      description="Legal name and TIN for your pharmacy."
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <CustomFormField
                          name="pharmacy_name"
                          control={form.control}
                          fieldType={formFieldTypes.INPUT}
                          label="Pharmacy name"
                          placeholder="Enter pharmacy name"
                          inputClassName="auth-field h-11 w-full"
                        />
                        <CustomFormField
                          name="pharmacy_tin"
                          control={form.control}
                          fieldType={formFieldTypes.INPUT}
                          label="Pharmacy TIN"
                          placeholder="Enter pharmacy TIN"
                          inputClassName="auth-field h-11 w-full"
                        />
                      </div>
                    </SignupSection>
                    <SignupSection
                      title="Manager account"
                      description="Username and password for the first manager login."
                      tone="cool"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <CustomFormField
                          name="username"
                          control={form.control}
                          fieldType={formFieldTypes.INPUT}
                          label="Manager username"
                          placeholder="Enter username"
                          inputClassName="auth-field h-11 w-full"
                        />
                        <CustomFormField
                          name="password"
                          control={form.control}
                          fieldType={formFieldTypes.INPUT}
                          label="Password"
                          placeholder="Enter password"
                          type="password"
                          inputClassName="auth-field h-11 w-full"
                        />
                      </div>
                    </SignupSection>
                  </>
                ) : null}

                {step === 1 ? (
                  <SignupSection
                    title="Setup payment"
                    description="Pay the one-time setup fee, then confirm the transfer below."
                  >
                    <div className="space-y-3.5 rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                            Apex Solution · CBE account
                          </p>
                          <p className="mt-1 font-mono text-lg font-bold break-all text-apex-orange-light sm:text-xl">
                            {APEX_SOLUTION_CBE_ACCOUNT}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                            Amount
                          </p>
                          <p className="mt-1 font-display text-lg font-semibold text-white">
                            {pricingLoading ? "…" : formatEtb(setupFee ?? 0)}
                          </p>
                        </div>
                      </div>

                      <ol className="space-y-2 border-t border-white/8 pt-3.5 text-sm text-white/70">
                        <li className="flex gap-2.5">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-apex-orange/15 text-[11px] font-semibold text-apex-orange-light">
                            1
                          </span>
                          Transfer the amount to the CBE account above.
                        </li>
                        <li className="flex gap-2.5">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-apex-orange/15 text-[11px] font-semibold text-apex-orange-light">
                            2
                          </span>
                          Copy the transaction reference from your receipt.
                        </li>
                        <li className="flex gap-2.5">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-apex-orange/15 text-[11px] font-semibold text-apex-orange-light">
                            3
                          </span>
                          Select your payment channel and paste the reference below.
                        </li>
                      </ol>

                      {pricingDescription ||
                      (quarterlyFee != null && !pricingLoading) ? (
                        <div className="space-y-1 border-t border-white/8 pt-3.5">
                          {pricingDescription ? (
                            <p className="text-xs leading-relaxed text-white/45">
                              {pricingDescription}
                            </p>
                          ) : null}
                          {quarterlyFee != null && !pricingLoading ? (
                            <p className="text-xs leading-relaxed text-white/45">
                              Quarterly subscription after approval:{" "}
                              <span className="font-medium text-white/75">
                                {formatEtb(quarterlyFee)}
                              </span>
                              .
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <CustomFormField
                      control={form.control}
                      name="payment_channel"
                      fieldType={formFieldTypes.RADIO_BUTTON}
                      label="How did you pay?"
                      radioOrientation="horizontal"
                      showOptionDescription={false}
                      options={PAYMENT_CHANNELS.map((item) => ({
                        label: PAYMENT_CHANNEL_META[item].shortLabel,
                        value: item,
                      }))}
                    />
                    <CustomFormField
                      control={form.control}
                      name="payment_transaction_ref"
                      fieldType={formFieldTypes.INPUT}
                      label={
                        PAYMENT_CHANNEL_META[
                          (form.watch("payment_channel") as PaymentChannel) ??
                            PAYMENT_CHANNELS[0]
                        ].transactionFieldLabel
                      }
                      placeholder={
                        PAYMENT_CHANNEL_META[
                          (form.watch("payment_channel") as PaymentChannel) ??
                            PAYMENT_CHANNELS[0]
                        ].transactionPlaceholder
                      }
                      description="You will find this on your bank slip, SMS, or in the app receipt."
                      inputClassName="auth-field h-11 w-full"
                    />
                  </SignupSection>
                ) : null}

                {step === 2 ? (
                  <>
                    <SignupSection title="Branding" tone="cool">
                      <CustomFormField
                        name="logoUrl"
                        control={form.control}
                        fieldType={formFieldTypes.IMAGE_UPLOADER}
                        label="Pharmacy logo"
                      />
                    </SignupSection>
                    <SignupSection
                      title="Referral"
                      description="Optional — who introduced you to Medicare?"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/80">
                          Sales agent (optional)
                        </Label>
                        <SalesAgentSelector
                          value={form.watch("sales_agent_id") ?? null}
                          onChange={(next) => form.setValue("sales_agent_id", next)}
                          agents={agents}
                          loading={agentsLoading}
                        />
                      </div>
                    </SignupSection>
                  </>
                ) : null}
              </div>

              {submitError.length ? (
                <div
                  role="alert"
                  className="mt-6 space-y-1 rounded-xl border border-red-400/35 bg-red-500/10 p-3.5 text-sm leading-relaxed text-red-200"
                >
                  {submitError.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              <div
                className={cn(
                  "mt-8 -mx-8 flex flex-col-reverse gap-3 border-t px-8 pt-7 pb-8 sm:flex-row sm:items-center sm:justify-between",
                  AUTH_BAND,
                )}
              >
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-2 sm:min-w-28"
                    onClick={goBack}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <span className="hidden sm:block" />
                )}

                {step < lastStep ? (
                  <button
                    type="button"
                    onClick={() => void goNext()}
                    className={cn(
                      "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/8 text-sm font-semibold text-white transition sm:ml-auto sm:w-auto sm:min-w-44",
                      AUTH_BUTTON,
                    )}
                  >
                    Proceed
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/8 text-sm font-semibold text-white transition disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:min-w-48",
                      AUTH_BUTTON,
                    )}
                  >
                    {loading
                      ? "Submitting…"
                      : pricingLoading
                        ? "Loading pricing…"
                        : `Submit · pay ${setupLabel}`}
                  </button>
                )}
              </div>
            </form>
          </CardContent>

          <CardFooter className={cn("justify-center border-t px-8 py-6", AUTH_BAND)}>
            <p className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm", AUTH_MUTED)}>
              <span>Already registered?</span>
              <Link href="/Login" className={AUTH_LINK}>
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      )}
    </AuthShell>
  );
}
