/** Formats a plain decimal amount with thousands separators, no currency symbol
 * (PRD requires neutral currency handling — the app never assumes a locale/currency). */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}
