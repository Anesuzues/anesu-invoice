/**
 * Shared currency formatting utility.
 * Uses Intl.NumberFormat for locale-aware formatting.
 */
export function formatCurrency(amount: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
