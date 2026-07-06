"use client";

import { AlertTriangle, Package, ReceiptText, Wallet } from "lucide-react";

import { WorkspaceInnerPanel } from "@/components/manager/workspace";
import { cn } from "@/lib/utils";
import type { InvoiceData, MedicineData } from "@/lib/actions";

export function ManagerCommandStrip({
  medicines,
  unpaidInvoices,
  getStockLevel,
  getExpiryLevel,
}: {
  medicines: MedicineData[];
  unpaidInvoices: InvoiceData[];
  getStockLevel: (qty: number) => "out" | "critical" | "low" | "ok";
  getExpiryLevel: (date?: string | null) => "expired" | "soon" | "ok" | "none";
}) {
  let critical = 0;
  let expiring = 0;
  let expired = 0;

  for (const med of medicines) {
    const stock = getStockLevel(Number(med.quantity));
    if (stock === "critical" || stock === "out") critical += 1;
    const expiry = getExpiryLevel(med.expiry_date);
    if (expiry === "soon") expiring += 1;
    if (expiry === "expired") expired += 1;
  }

  const items = [
    {
      icon: Package,
      label: "Critical stock",
      value: String(critical),
      tone: critical > 0 ? "text-red-300" : "text-emerald-300",
      border: critical > 0 ? "border-red-400/30" : "border-white/12",
      bg: critical > 0 ? "bg-red-500/10" : "bg-white/4",
    },
    {
      icon: AlertTriangle,
      label: "Expiring soon",
      value: String(expiring),
      tone: expiring > 0 ? "text-amber-200" : "text-white/70",
      border: expiring > 0 ? "border-amber-400/30" : "border-white/12",
      bg: expiring > 0 ? "bg-amber-500/10" : "bg-white/4",
    },
    {
      icon: AlertTriangle,
      label: "Expired",
      value: String(expired),
      tone: expired > 0 ? "text-red-200" : "text-white/70",
      border: expired > 0 ? "border-red-400/25" : "border-white/12",
      bg: expired > 0 ? "bg-red-500/8" : "bg-white/4",
    },
    {
      icon: ReceiptText,
      label: "Unpaid invoices",
      value: String(unpaidInvoices.length),
      tone: unpaidInvoices.length > 0 ? "text-apex-orange-light" : "text-white/70",
      border: "border-white/12",
      bg: "bg-white/4",
    },
    {
      icon: Wallet,
      label: "Total SKUs",
      value: String(medicines.length),
      tone: "text-white",
      border: "border-white/12",
      bg: "bg-white/4",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <WorkspaceInnerPanel
          key={item.label}
          className={cn("border p-3", item.border, item.bg)}
        >
          <div className="flex items-center gap-2">
            <item.icon className={cn("h-3.5 w-3.5 shrink-0", item.tone)} />
            <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-white/45">{item.label}</p>
          </div>
          <p className={cn("mt-2 font-display text-xl font-bold", item.tone)}>{item.value}</p>
        </WorkspaceInnerPanel>
      ))}
    </div>
  );
}
