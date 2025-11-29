// Currency formatting utilities for USD

/**
 * Format a price in USD
 * @param amount - The amount in USD
 * @returns Formatted price string
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get currency symbol
 * @returns Currency symbol for USD
 */
export const getCurrencySymbol = (): string => 'USD';

/**
 * Convert amount to display format
 * @param amount - The amount in base units
 * @returns Formatted display string
 */
export const displayPrice = (amount: number): string => {
  if (amount === 0) {
    return '0 USD';
  }
  return `${amount.toFixed(0)} USD`;
};

/**
 * Format price from cents (Square API format)
 * @param amountCents - Amount in cents
 * @returns Formatted price string (e.g., "$120.00")
 */
export const formatPriceFromCents = (amountCents: number): string => {
  return `$${(amountCents / 100).toFixed(2)}`;
};

/**
 * Calculate percentage of amount in cents
 * @param amountCents - Base amount in cents
 * @param percentage - Percentage to calculate (e.g., 30 for 30%)
 * @returns Calculated amount in cents (rounded)
 */
export const calculatePercentage = (
  amountCents: number,
  percentage: number
): number => {
  return Math.round((amountCents * percentage) / 100);
};
