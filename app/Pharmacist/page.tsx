"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import PharmacistView from "@/components/pharmacist/PharmacistView";
import { Spinner } from "@/components/ui/spinner";
import { getBillingMe, Logout } from "@/lib/actions";

const HARD_PERIODS = new Set([
  "setup_pending",
  "on_hold",
  "trial_expired",
  "grace",
  "expired",
]);

export default function PharmacistPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function guard() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/Login");
        return;
      }

      const mode = (localStorage.getItem("access_mode") || "").toLowerCase();
      const period = (localStorage.getItem("period_status") || "").toLowerCase();
      if (mode === "payment_portal" || mode === "denied" || HARD_PERIODS.has(period)) {
        toast.error("Your pharmacy subscription needs attention. Ask your manager to renew.");
        await Logout();
        router.replace("/Login");
        return;
      }

      try {
        const data = await getBillingMe();
        if (!active) return;
        localStorage.setItem("access_mode", data.access_mode || "full");
        localStorage.setItem("period_status", data.period_status || "");
        if (
          data.access_mode === "payment_portal" ||
          data.access_mode === "denied" ||
          HARD_PERIODS.has(String(data.period_status || "").toLowerCase())
        ) {
          toast.error(
            "Your pharmacy subscription needs attention. Ask your manager to renew.",
          );
          await Logout();
          router.replace("/Login");
          return;
        }
        setReady(true);
      } catch {
        if (!active) return;
        // If billing check fails, still allow UI but keep token-based auth
        setReady(true);
      }
    }

    void guard();
    const id = window.setInterval(() => void guard(), 60_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [router]);

  if (!ready) {
    return (
      <ProjectBackdrop variant="cinematic">
        <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
          <Spinner /> Checking access…
        </div>
      </ProjectBackdrop>
    );
  }

  return (
    <ProjectBackdrop variant="cinematic">
      <PharmacistView />
    </ProjectBackdrop>
  );
}
