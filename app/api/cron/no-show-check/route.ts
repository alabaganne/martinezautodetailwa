import { bookingsApi, cardsApi, customersApi, getLocationId, paymentsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';
import { randomUUID } from 'crypto';

const NO_SHOW_WINDOW_HOURS = 48;

/**
 * POST /api/cron/no-show-check
 *
 * Cron job endpoint to check for no-show bookings and charge fees.
 * This should be called every 24 hours by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 *
 * Process:
 * 1. Find bookings that started 48+ hours ago
 * 2. Check if booking status indicates completion or cancellation
 * 3. For no-shows, extract card ID from seller note
 * 4. Charge the no-show fee using the card on file
 */
export async function POST(request: Request) {
	try {
		// Verify this is a legitimate cron request
		const authHeader = request.headers.get('authorization');
		const cronSecret = process.env.CRON_SECRET;

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
			// Skip if booking was cancelled or completed
			if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED' || booking.status === 'ACCEPTED') {
				continue;
			}

			// Skip if no seller note (complimentary bookings won't have card info)
			if (!booking.sellerNote) {
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

			const amount = BigInt(amountMatch[1]);
			const currency = currencyMatch[1];

			noShowBookings.push({
				bookingId: booking.id,
				customerId: booking.customerId,
				startAt: booking.startAt,
				cardId,
				amount,
				currency,
			});

			// Charge the no-show fee
			try {
				const defaultLocationId = await getLocationId();

				const paymentResponse = await paymentsApi.create({
					sourceId: cardId,
					idempotencyKey: randomUUID(),
					amountMoney: {
						amount,
						currency: currency as any,
					},
					customerId: booking.customerId,
					locationId: defaultLocationId,
					autocomplete: true,
					note: `No-show fee for booking ${booking.id} on ${new Date(booking.startAt).toLocaleDateString()}`,
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
						amount: amount.toString(),
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
