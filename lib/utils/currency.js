// Currency formatting utilities for Tunisian Dinar (TND)

/**
 * Format a price in TND
 * @param {number} amount - The amount in TND
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount) => {
  // Format with 3 decimal places as TND uses millimes (1 TND = 1000 millimes)
  return new Intl.NumberFormat('en-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get currency symbol
 * @returns {string} - Currency symbol for TND
 */
export const getCurrencySymbol = () => 'TND';

/**
 * Convert amount to display format
 * @param {number} amount - The amount in base units
 * @returns {string} - Formatted display string
 */
export const displayPrice = (amount) => {
  return `${amount} TND`;
};