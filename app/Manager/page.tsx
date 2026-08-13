"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import ManagerView from "@/components/manager/ManagerView";
import { getBillingMe, Logout } from "@/lib/actions";

export default function ManagerPage() {
  const router = useRouter();

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
      if (mode === "denied" || period === "on_hold") {
        toast.error("This pharmacy is on billing hold. Contact Apex support.");
        await Logout();
        router.replace("/Login");
        return;
      }
      if (mode === "payment_portal") {
        router.replace("/PaymentVerification");
        return;
      }

      try {
        const data = await getBillingMe();
        if (!active) return;
        localStorage.setItem("access_mode", data.access_mode || "full");
        localStorage.setItem("period_status", data.period_status || "");
        if (
          data.access_mode === "denied" ||
          String(data.period_status || "").toLowerCase() === "on_hold"
        ) {
          toast.error("This pharmacy is on billing hold. Contact Apex support.");
          await Logout();
          router.replace("/Login");
          return;
        }
        if (data.access_mode === "payment_portal") {
          router.replace("/PaymentVerification");
        }
      } catch {
        // keep session if billing refresh fails offline
      }
    }

    void guard();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <ProjectBackdrop variant="cinematic">
      <ManagerView />
    </ProjectBackdrop>
  );
}
