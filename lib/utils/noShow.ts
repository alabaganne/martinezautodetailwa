/**
 * No-show fee business logic utilities
 */

import { Booking, CardInfo } from '@/lib/types/admin';
import { NO_SHOW_WINDOW_HOURS } from '@/lib/constants/admin';

/**
 * Check if booking is eligible for no-show fee
 *
 * Business rules:
 * - Must be ACCEPTED status
 * - Must be 48+ hours past start time
 * - Must have card on file
 * - Must not have already been charged
 *
 * @param booking - The booking to check
 * @returns true if eligible for no-show fee
 */
export const isNoShowEligible = (booking: Booking): boolean => {
  // Must be ACCEPTED status
  if (booking.status !== 'ACCEPTED') return false;

  // Must be 48+ hours past start time
  const startTime = new Date(booking.startAt);
  const now = new Date();
  const hoursPast = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  if (hoursPast < NO_SHOW_WINDOW_HOURS) return false;

  // Must have card on file
  if (!booking.sellerNote?.includes('Card ID:')) return false;

  // Must not have already been charged
  if (booking.sellerNote?.includes('No-show fee charged:')) return false;

  return true;
};

/**
 * Check if booking has been charged for no-show
 *
 * @param booking - The booking to check
 * @returns true if already charged
 */
export const hasBeenCharged = (booking: Booking): boolean => {
  return booking.sellerNote?.includes('No-show fee charged:') ?? false;
};

/**
 * Extract card information from customer note
 *
 * Expected format: "Visa ending in 1234" or "Mastercard ending in 5678"
 *
 * @param customerNote - Customer note containing card info
 * @returns Card info object or null if not found
 */
export const extractCardInfo = (customerNote?: string): CardInfo | null => {
  if (!customerNote) return null;

  // Format: "Visa ending in 1234" or "Mastercard ending in 5678"
  const cardMatch = customerNote.match(/(\w+)\s+ending\s+in\s+(\d{4})/i);
  if (cardMatch) {
    return {
      brand: cardMatch[1],
      lastFour: cardMatch[2],
    };
  }
  return null;
};
