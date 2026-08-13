"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

import { PaymentSubmitDialog } from "@/components/billing/PaymentSubmitDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBillingMe, Logout } from "@/lib/actions";
import { cn } from "@/lib/utils";

type BillingState = {
  period_status: string;
  payment_kind: string | null;
  access_mode?: string;
  billing: {
    setup_fee_etb?: number;
    quarterly_fee_etb?: number;
    setup_fee_approved?: boolean;
    free_trial_ends_at?: string | null;
    subscription_paid_until?: string | null;
  };
  pending_submission?: { transaction_ref?: string; status?: string } | null;
};

const SOFT_PERIODS = new Set(["trial_ending", "warning"]);
const HARD_PERIODS = new Set(["trial_expired", "grace", "expired"]);

export function BillingAlerts({ className }: { className?: string }) {
  const router = useRouter();
  const [state, setState] = useState<BillingState | null>(null);
  const [open, setOpen] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  async function refresh() {
    try {
      const data = await getBillingMe();
      setState(data);
      localStorage.setItem("period_status", data.period_status || "");
      if (data.billing) localStorage.setItem("billing", JSON.stringify(data.billing));
      if (data.payment_kind) localStorage.setItem("payment_kind", data.payment_kind);
      if (data.access_mode) localStorage.setItem("access_mode", data.access_mode);

      if (data.access_mode === "denied" || data.period_status === "on_hold") {
        toast.error("This pharmacy is on billing hold. Contact Apex support.");
        await Logout();
        router.replace("/Login");
        return;
      }

      if (data.access_mode === "payment_portal") {
        router.replace("/PaymentVerification");
      }
    } catch {
      // ignore while offline
    }
  }

  useEffect(() => {
    const role = (localStorage.getItem("Role") || "").toLowerCase();
    setIsManager(role === "manager");
    if (role !== "manager") return;
    setNowMs(Date.now());
    void refresh();
    const id = window.setInterval(() => {
      setNowMs(Date.now());
      void refresh();
    }, 60000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const period = state?.period_status || "";
  const isSoft = SOFT_PERIODS.has(period);
  const isHard = HARD_PERIODS.has(period);
  const needsAttention = isSoft || isHard;

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
    if (!end || !nowMs) return null;
    const ms = new Date(end).getTime() - nowMs;
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [paymentKind, state, nowMs]);

  const infoLines = useMemo(() => {
    const lines: string[] = [];
    if (paymentKind === "setup") {
      lines.push("Setup fee unlocks your Medicare pharmacy workspace after Apex approval.");
      if (state?.billing?.free_trial_ends_at) {
        lines.push(
          `Trial ends: ${new Date(state.billing.free_trial_ends_at).toLocaleDateString()}`,
        );
      }
    } else {
      lines.push("Quarterly subscription keeps inventory, sales, and staff access active.");
      if (state?.billing?.subscription_paid_until) {
        lines.push(
          `Paid until: ${new Date(state.billing.subscription_paid_until).toLocaleDateString()}`,
        );
      }
      if (period === "grace") {
        lines.push("Grace period active — renew soon to avoid service interruption.");
      }
    }
    return lines;
  }, [paymentKind, period, state]);

  useEffect(() => {
    if (!isManager) return;
    if (isHard) setOpen(true);
  }, [isHard, isManager]);

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
                isHard && "animate-pulse",
                className,
              )}
              onClick={() => setOpen(true)}
              aria-label="Open payment verification"
            >
              <CreditCard className="size-4 text-amber-400" />
              {daysLeft !== null && isSoft ? (
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
              {isHard
                ? "Payment required to continue using Medicare"
                : "Tap to review payment details and submit a transfer ID"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PaymentSubmitDialog
        open={open}
        onOpenChange={setOpen}
        paymentKind={paymentKind}
        amountETB={amount}
        blocking={isHard}
        infoLines={infoLines}
        pendingMessage={
          state?.pending_submission
            ? `Pending transfer ID: ${state.pending_submission.transaction_ref}`
            : null
        }
        onSubmitted={() => {
          void refresh();
          if (isHard) {
            toast.message("Submitted — you can sign out and return after Apex approves.");
          }
        }}
      />
    </>
  );
}
