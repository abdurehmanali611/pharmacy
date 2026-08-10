"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";

import { PaymentSubmitDialog } from "@/components/billing/PaymentSubmitDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBillingMe } from "@/lib/actions";
import { cn } from "@/lib/utils";

type BillingState = {
  period_status: string;
  payment_kind: string | null;
  billing: {
    setup_fee_etb?: number;
    quarterly_fee_etb?: number;
    setup_fee_approved?: boolean;
    free_trial_ends_at?: string | null;
    subscription_paid_until?: string | null;
  };
  pending_submission?: { transaction_ref?: string; status?: string } | null;
};

export function BillingAlerts({ className }: { className?: string }) {
  const [state, setState] = useState<BillingState | null>(null);
  const [open, setOpen] = useState(false);
  const [isManager, setIsManager] = useState(false);

  async function refresh() {
    try {
      const data = await getBillingMe();
      setState(data);
      localStorage.setItem("period_status", data.period_status || "");
      if (data.billing) localStorage.setItem("billing", JSON.stringify(data.billing));
      if (data.payment_kind) localStorage.setItem("payment_kind", data.payment_kind);
      if (data.access_mode) localStorage.setItem("access_mode", data.access_mode);
    } catch {
      // ignore while offline
    }
  }

  useEffect(() => {
    const role = (localStorage.getItem("Role") || "").toLowerCase();
    setIsManager(role === "manager");
    if (role !== "manager") return;
    void refresh();
    const id = window.setInterval(refresh, 60000);
    return () => window.clearInterval(id);
  }, []);

  const period = state?.period_status || "";
  const needsAttention = [
    "trial_ending",
    "trial_expired",
    "grace",
    "expired",
  ].includes(period);

  const paymentKind = useMemo<"setup" | "quarterly">(() => {
    if (period === "trial_ending" || period === "trial_expired") return "setup";
    if (state?.payment_kind === "quarterly") return "quarterly";
    if (!state?.billing?.setup_fee_approved) return "setup";
    return "quarterly";
  }, [period, state]);

  const amount = useMemo(() => {
    if (!state?.billing) return 0;
    return paymentKind === "setup"
      ? Number(state.billing.setup_fee_etb || 0)
      : Number(state.billing.quarterly_fee_etb || 0);
  }, [paymentKind, state]);

  const daysLeft = useMemo(() => {
    const end =
      paymentKind === "setup"
        ? state?.billing?.free_trial_ends_at
        : state?.billing?.subscription_paid_until;
    if (!end) return null;
    const ms = new Date(end).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [paymentKind, state]);

  // Auto-open dialog when trial ends or subscription enters grace/expired.
  useEffect(() => {
    if (!isManager) return;
    if (["trial_expired", "grace", "expired"].includes(period)) {
      setOpen(true);
    }
  }, [period, isManager]);

  if (!isManager || !needsAttention) return null;

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "relative shrink-0 border-amber-500/40 bg-amber-500/10",
                period !== "trial_ending" && "animate-pulse",
                className,
              )}
              onClick={() => setOpen(true)}
              aria-label="Submit payment transfer ID"
            >
              <CreditCard className="size-4 text-amber-400" />
              {daysLeft !== null ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {daysLeft}
                </span>
              ) : (
                <Badge className="absolute -top-2 -right-3 h-4 px-1 text-[10px]">Pay</Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-56 text-center">
            <p className="font-semibold capitalize">{period.replaceAll("_", " ")}</p>
            <p className="text-xs text-muted-foreground">
              Tap to submit your transfer ID for Apex approval
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PaymentSubmitDialog
        open={open}
        onOpenChange={setOpen}
        paymentKind={paymentKind}
        amountETB={amount}
        pendingMessage={
          state?.pending_submission
            ? `Pending transfer ID: ${state.pending_submission.transaction_ref}`
            : null
        }
        onSubmitted={() => void refresh()}
      />
    </>
  );
}
