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
  if (!amount) {
    return 'NULL';
  }
  return `${amount.toFixed(2)} USD`;
};