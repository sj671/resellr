export function formatCurrency(value: number | null | undefined, currency: string = "USD"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value as number);
  } catch {
    return String(value);
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
}


