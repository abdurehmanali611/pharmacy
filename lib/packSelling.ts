import type { MedicineData } from "@/lib/actions";
import { unitLabel } from "@/lib/medicineUnits";

/** A sale line counts whole packs (strips, boxes...) or loose units (tablets...). */
export type SaleUnit = "pack" | "loose";

export const LOOSE_UNIT_OPTIONS = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "sachet", label: "Sachet" },
  { value: "ampoule", label: "Ampoule" },
  { value: "piece", label: "Piece" },
  { value: "ml", label: "Millilitre (ml)" },
  { value: "gram", label: "Gram" },
] as const;

export const packSize = (m: Pick<MedicineData, "pack_size">) => Math.max(1, Number(m.pack_size) || 1);

/** Medicines with a pack size above 1 can also be sold by the loose unit. */
export const isSplittable = (m: Pick<MedicineData, "pack_size">) => packSize(m) > 1;

export const looseName = (m: Pick<MedicineData, "loose_unit">) => (m.loose_unit || "piece").toLowerCase();

export const packName = (m: Pick<MedicineData, "unit">) => unitLabel(m.unit).toLowerCase();

export function plural(word: string, count: number) {
  if (count === 1) return word;
  if (word === "ml" || word === "dozen" || word === "other") return word;
  if (/(x|s|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}

export const unitWord = (m: MedicineData, saleUnit: SaleUnit, count = 2) =>
  plural(saleUnit === "loose" ? looseName(m) : packName(m), count);

/** What one unit of the chosen kind costs the customer (list price, before any discount). */
export function unitPrice(m: MedicineData, saleUnit: SaleUnit = "pack"): number {
  if (saleUnit === "pack" || !isSplittable(m)) return Number(m.price);
  if (m.loose_unit_price != null && m.loose_unit_price !== "") return Number(m.loose_unit_price);
  if (m.loose_price != null && m.loose_price !== "") return Number(m.loose_price);
  return Math.round((Number(m.price) / packSize(m)) * 100) / 100;
}

/** Everything on hand, counted in loose units. */
export const looseCapacity = (m: MedicineData) => Number(m.quantity || 0) * packSize(m) + Number(m.loose_stock || 0);

/** The most that can be sold in the chosen unit. */
export const maxQuantity = (m: MedicineData, saleUnit: SaleUnit = "pack") =>
  saleUnit === "loose" && isSplittable(m) ? looseCapacity(m) : Number(m.quantity || 0);

/** True when something can be sold today, counting loose stock from an opened pack. */
export const hasStock = (m: MedicineData) => Number(m.quantity || 0) > 0 || Number(m.loose_stock || 0) > 0;

/** "3 strips + 4 tablets", or just "3 strips" when nothing is opened. */
export function stockText(m: MedicineData): string {
  const packs = Number(m.quantity || 0);
  const loose = Number(m.loose_stock || 0);
  const parts: string[] = [];
  if (packs > 0 || !loose || !isSplittable(m)) parts.push(`${packs} ${plural(packName(m), packs)}`);
  if (isSplittable(m) && loose > 0) parts.push(`${loose} ${plural(looseName(m), loose)}`);
  return parts.join(" + ");
}

/** Sold quantity in whole packs (a loose sale is a fraction of one). */
export const soldPacks = (p: { quantity: number | string; pack_quantity?: number | string | null }) =>
  p.pack_quantity != null && p.pack_quantity !== "" ? Number(p.pack_quantity) : Number(p.quantity);

/** Up to two decimals, no trailing zeros: 3, 0.3, 12.5. */
export const trimNumber = (n: number) => (Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });
