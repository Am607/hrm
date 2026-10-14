/**
 * Formatter and constants for INR (Indian Rupee) currency.
 */
export const CURRENCY_SYMBOL = '₹';

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}
