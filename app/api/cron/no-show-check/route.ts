import { bookingsApi, cardsApi, customersApi, getLocationId, paymentsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

const NO_SHOW_WINDOW_HOURS = 48;
const NO_SHOW_FEE_PERCENTAGE = 30; // 30% of service price
const SESSION_NAME = 'admin_session';

/**
 * GET /api/cron/no-show-check
 *
 * Manual trigger endpoint for checking no-show bookings and charging fees.
 * Can be called from the admin dashboard (requires admin session) or via cron service (requires CRON_SECRET).
 *
 * Process:
 * 1. Find bookings that started 48+ hours ago
 * 2. Check if booking status is still ACCEPTED (not COMPLETED or CANCELLED)
 * 3. For no-shows, extract card ID from seller note
 * 4. Charge 30% no-show fee using the card on file
 */
export async function GET(request: Request) {
	try {
		// Check authentication: either admin session cookie or CRON_SECRET header
		const authHeader = request.headers.get('authorization');
		const cronSecret = process.env.CRON_SECRET;
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get(SESSION_NAME);

		const hasValidCronSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;
		const hasValidAdminSession = sessionCookie && sessionCookie.value;

		if (!hasValidCronSecret && !hasValidAdminSession) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const now = new Date();
		const noShowCutoff = new Date(now.getTime() - NO_SHOW_WINDOW_HOURS * 60 * 60 * 1000);

		// Query bookings from the past 7 days up to the no-show cutoff
		const queryStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const bookingsResponse = await bookingsApi.list({
			limit: 100,
			startAtMin: queryStart.toISOString(),
			startAtMax: noShowCutoff.toISOString(),
		});

		const bookings: any[] = [];
		for await (const booking of bookingsResponse as any) {
			bookings.push(booking);
		}

		const noShowBookings: any[] = [];
		const chargeResults: any[] = [];

		for (const booking of bookings) {
			// Only process ACCEPTED bookings (skip CANCELLED and COMPLETED)
			// ACCEPTED means customer made booking but hasn't shown up yet
			if (booking.status !== 'ACCEPTED') {
				continue;
			}

			// Skip if no seller note (complimentary bookings won't have card info)
			if (!booking.sellerNote) {
				continue;
			}

			// Skip if no-show fee has already been charged (prevent duplicate charges)
			if (booking.sellerNote.includes('No-show fee charged:')) {
				continue;
			}

			// Extract card ID from seller note
			const cardIdMatch = booking.sellerNote.match(/Card ID: (card_[a-zA-Z0-9_-]+)/);
			if (!cardIdMatch) {
				// No card on file, skip
				continue;
			}

			const cardId = cardIdMatch[1];

			// Extract service amount from seller note
			const amountMatch = booking.sellerNote.match(/Service Amount \(cents\): (\d+)/);
			const currencyMatch = booking.sellerNote.match(/Currency: ([A-Z]{3})/);

			if (!amountMatch || !currencyMatch) {
				console.error(`Missing amount or currency for booking ${booking.id}`);
				continue;
			}

			const fullAmount = BigInt(amountMatch[1]);
			const currency = currencyMatch[1];

			// Calculate 30% no-show fee
			const noShowFeeAmount = (fullAmount * BigInt(NO_SHOW_FEE_PERCENTAGE)) / BigInt(100);

			noShowBookings.push({
				bookingId: booking.id,
				customerId: booking.customerId,
				startAt: booking.startAt,
				cardId,
				fullAmount: fullAmount.toString(),
				noShowFeeAmount: noShowFeeAmount.toString(),
				currency,
			});

			// Charge the 30% no-show fee
			try {
				const defaultLocationId = await getLocationId();

				const paymentResponse = await paymentsApi.create({
					sourceId: cardId,
					idempotencyKey: randomUUID(),
					amountMoney: {
						amount: noShowFeeAmount,
						currency: currency as any,
					},
					customerId: booking.customerId,
					locationId: defaultLocationId,
					autocomplete: true,
					note: `No-show fee (${NO_SHOW_FEE_PERCENTAGE}%) for booking ${booking.id} on ${new Date(booking.startAt).toLocaleDateString()}`,
				});

				if (paymentResponse.errors?.length) {
					chargeResults.push({
						bookingId: booking.id,
						success: false,
						error: paymentResponse.errors[0]?.detail || 'Failed to charge no-show fee',
					});
					console.error(`Failed to charge no-show fee for booking ${booking.id}:`, paymentResponse.errors);
				} else {
					chargeResults.push({
						bookingId: booking.id,
						success: true,
						paymentId: paymentResponse.payment?.id,
						fullAmount: fullAmount.toString(),
						noShowFeeAmount: noShowFeeAmount.toString(),
						feePercentage: NO_SHOW_FEE_PERCENTAGE,
						currency,
					});

					// Update booking status to indicate payment was charged
					try {
						await bookingsApi.update({
							bookingId: booking.id,
							booking: {
								version: booking.version,
								sellerNote: `${booking.sellerNote} | No-show fee charged: ${paymentResponse.payment?.id}`,
							},
						});
					} catch (updateError) {
						console.warn(`Failed to update booking ${booking.id} after charging no-show fee:`, updateError);
					}
				}
			} catch (chargeError: any) {
				chargeResults.push({
					bookingId: booking.id,
					success: false,
					error: chargeError.message || 'Failed to charge no-show fee',
				});
				console.error(`Error charging no-show fee for booking ${booking.id}:`, chargeError);
			}
		}

		return successResponse({
			message: 'No-show check completed',
			noShowBookings: noShowBookings.length,
			chargeResults,
			timestamp: now.toISOString(),
		});
	} catch (error) {
		return handleSquareError(error, 'Failed to process no-show check');
	}
}
