export function formatCad(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export function applyDiscount(
  priceCents: number,
  type: "percent" | "fixed",
  value: number,
): number {
  if (type === "percent") {
    return Math.max(0, Math.round(priceCents * (1 - value / 100)));
  }
  return Math.max(0, priceCents - value);
}
