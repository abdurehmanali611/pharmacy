"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import ManagerView from "@/components/manager/ManagerView";

export default function ManagerPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const mode = localStorage.getItem("access_mode");
    if (!token) {
      router.replace("/Login");
      return;
    }
    if (mode === "payment_portal") {
      router.replace("/PaymentVerification");
    }
  }, [router]);

  return (
    <ProjectBackdrop variant="cinematic">
      <ManagerView />
    </ProjectBackdrop>
  );
}
