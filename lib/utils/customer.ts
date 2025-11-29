/**
 * Customer-related utility functions
 */

import { Booking } from '@/lib/types/admin';

/**
 * Get formatted customer name from booking
 *
 * @param booking - Booking object
 * @returns Formatted full name or fallback "Unknown Customer"
 */
export const getCustomerName = (booking: Booking): string => {
  if (booking.customer?.givenName || booking.customer?.familyName) {
    return `${booking.customer.givenName || ''} ${booking.customer.familyName || ''}`.trim();
  }
  return 'Unknown Customer';
};

/**
 * Get customer initials for avatar
 *
 * @param booking - Booking object
 * @returns Two-letter initials (e.g., "JD") or "?" if no name
 */
export const getCustomerInitials = (booking: Booking): string => {
  const first = booking.customer?.givenName?.[0] || '';
  const last = booking.customer?.familyName?.[0] || '';
  return (first + last).toUpperCase() || '?';
};
