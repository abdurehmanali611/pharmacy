export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  });
}

