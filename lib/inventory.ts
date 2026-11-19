import { differenceInCalendarDays, parseISO } from "date-fns";

import type { MedicineData, PurchaseData, StockLossData } from "@/lib/actions";

/** Money helpers shared by the Reports and Inventory payment screens. */

export type ExpiryTone = "expired" | "red" | "yellow" | "lime" | "green" | "none";

export function daysToExpiry(expiry?: string | null): number | null {
  if (!expiry) return null;
  const date = parseISO(expiry);
  if (Number.isNaN(date.getTime())) return null;
  return differenceInCalendarDays(date, new Date());
}

/** Red: a month or less. Yellow: up to 3 months. Lime: 3–5 months. Green: 5 months and above. */
export function expiryTone(days: number | null): ExpiryTone {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 30) return "red";
  if (days <= 90) return "yellow";
  if (days < 150) return "lime";
  return "green";
}

export const EXPIRY_TONE_CLASSES: Record<ExpiryTone, string> = {
  expired: "border-red-400/60 bg-red-500/25 text-red-100",
  red: "border-rose-300/55 bg-rose-400/20 text-rose-100",
  yellow: "border-yellow-300/55 bg-yellow-400/20 text-yellow-100",
  lime: "border-lime-300/50 bg-lime-400/15 text-lime-100",
  green: "border-emerald-300/55 bg-emerald-400/20 text-emerald-100",
  none: "border-white/20 bg-white/8 text-white/60",
};

export const EXPIRY_DOT_CLASSES: Record<ExpiryTone, string> = {
  expired: "bg-red-400",
  red: "bg-rose-400",
  yellow: "bg-yellow-300",
  lime: "bg-lime-300",
  green: "bg-emerald-400",
  none: "bg-white/40",
};

export function expiryLabel(days: number | null): string {
  if (days === null) return "No expiry";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  if (days <= 60) return `${days}d left`;
  const months = Math.round(days / 30);
  return `${months} mo left`;
}

export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Stock still on the shelf, valued at what it cost. */
export function stockCostValue(m: Pick<MedicineData, "quantity" | "cost">): number {
  return toNumber(m.quantity) * toNumber(m.cost);
}

export function receivedQuantity(m: MedicineData): number {
  const received = toNumber(m.received_quantity);
  return received > 0 ? received : toNumber(m.quantity);
}

export function totalCost(m: MedicineData): number {
  if (m.total_cost !== undefined && m.total_cost !== null) return toNumber(m.total_cost);
  return receivedQuantity(m) * toNumber(m.cost);
}

export function paidAmount(m: MedicineData): number {
  if (m.paid_amount !== undefined && m.paid_amount !== null) return toNumber(m.paid_amount);
  return totalCost(m);
}

export function creditDue(m: MedicineData): number {
  if (m.credit_amount !== undefined && m.credit_amount !== null) return toNumber(m.credit_amount);
  const owed = totalCost(m) - paidAmount(m);
  return owed > 0.01 ? owed : 0;
}

export type PaymentBucket = "paid" | "credit";

export function paymentBucket(m: MedicineData): PaymentBucket {
  return creditDue(m) > 0.01 ? "credit" : "paid";
}

export type MovementRow = {
  medicine: MedicineData;
  received: number;
  sold: number;
  lost: number;
  inStock: number;
};

/** Per-batch movement: what arrived, what sold, what was lost, what is left. */
export function buildMovement(
  medicines: MedicineData[],
  purchases: (PurchaseData & { medicine_id?: number | null })[],
  losses: StockLossData[],
): MovementRow[] {
  const sold = new Map<string, number>();
  for (const p of purchases) {
    if (p.medicine_id == null) continue;
    const key = String(p.medicine_id);
    sold.set(key, (sold.get(key) ?? 0) + toNumber(p.quantity));
  }
  const lost = new Map<string, number>();
  for (const l of losses) {
    if (l.medicine_id == null) continue;
    const key = String(l.medicine_id);
    lost.set(key, (lost.get(key) ?? 0) + toNumber(l.quantity));
  }
  return medicines.map((medicine) => ({
    medicine,
    received: receivedQuantity(medicine),
    sold: sold.get(String(medicine.id)) ?? 0,
    lost: lost.get(String(medicine.id)) ?? 0,
    inStock: toNumber(medicine.quantity),
  }));
}
