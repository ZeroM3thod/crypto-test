export function sanitizeAmount(v: string) {
  const cleaned = v.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function formatAmount(n: number, max = 2) {
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: max,
    maximumFractionDigits: max,
  });
}
