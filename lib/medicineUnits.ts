export const MEDICINE_UNITS = [
  { value: "litre", label: "Litre" },
  { value: "kilogram", label: "Kilogram" },
  { value: "piece", label: "Piece" },
  { value: "packet", label: "Packet" },
  { value: "box", label: "Box" },
  { value: "dozen", label: "Dozen" },
  { value: "other", label: "Other" },
] as const;

export const DEFAULT_MEDICINE_UNIT = "piece";

export function unitLabel(value?: string | null): string {
  return MEDICINE_UNITS.find((u) => u.value === value)?.label ?? "Piece";
}

/** "12 Boxes", "1 Litre": the unit name, pluralised for counts other than 1. */
export function quantityWithUnit(quantity: number | string, unit?: string | null): string {
  const n = Number(quantity);
  const label = unitLabel(unit);
  if (n === 1 || label === "Other") return `${n} ${label.toLowerCase()}`;
  const plural = label === "Box" ? "Boxes" : label === "Piece" ? "Pieces" : label === "Packet" ? "Packets" : label === "Dozen" ? "Dozen" : label === "Litre" ? "Litres" : label === "Kilogram" ? "Kilograms" : label;
  return `${n} ${plural.toLowerCase()}`;
}
