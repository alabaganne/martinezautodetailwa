import { bookingsApi, cardsApi, catalogApi, getLocationId, paymentsApi } from '../../../lib/client';
import { successResponse, handleSquareError } from '../../../lib/utils';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

const NO_SHOW_FEE_PERCENTAGE = 30; // 30% of service price
const SESSION_NAME = 'admin_session';

/**
 * POST /api/bookings/[id]/charge-no-show
 *
 * Charge no-show fee for a specific booking.
 * Requires admin session authentication.
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: bookingId } = await params;

		// Check admin authentication
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get(SESSION_NAME);

		if (!sessionCookie || !sessionCookie.value) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Get the booking
		const bookingResponse = await bookingsApi.get({ bookingId });

		if (bookingResponse.errors?.length) {
			return new Response(
				JSON.stringify({ error: bookingResponse.errors[0]?.detail || 'Booking not found' }),
				{ status: 404, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const booking = bookingResponse.booking;

		if (!booking) {
			return new Response(JSON.stringify({ error: 'Booking not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Check if booking is in a valid state for no-show charge
		if (booking.status !== 'ACCEPTED') {
			return new Response(
				JSON.stringify({
					error: `Cannot charge no-show fee: booking status is ${booking.status}. Only ACCEPTED bookings can be charged.`,
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Check if no-show fee has already been charged
		if (booking.sellerNote?.includes('No-show fee charged:')) {
			return new Response(
				JSON.stringify({ error: 'No-show fee has already been charged for this booking' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Extract card ID from seller note (flexible pattern to match Square's various card ID formats)
		const cardIdMatch = booking.sellerNote?.match(/Card ID: ([^\s|]+)/);
		let cardId = cardIdMatch?.[1];

		// Fallback: If card ID not in seller note, try to get customer's card on file from Square
		if (!cardId && booking.customerId) {
			try {
				const cardsPage = await cardsApi.list({ customerId: booking.customerId });
				for await (const card of cardsPage as any) {
					if (card?.enabled && card?.id) {
						cardId = card.id;
						break;
					}
				}
			} catch (cardError) {
				console.warn('Failed to fetch customer cards:', cardError);
			}
		}

		if (!cardId) {
			return new Response(
				JSON.stringify({ error: 'No card on file for this booking' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Extract service amount from seller note
		const amountMatch = booking.sellerNote?.match(/Service Amount \(cents\): (\d+)/);
		const currencyMatch = booking.sellerNote?.match(/Currency: ([A-Z]{3})/);

		let fullAmount: bigint | null = amountMatch ? BigInt(amountMatch[1]) : null;
		let currency: string = currencyMatch?.[1] || 'USD';

		// Fallback: Get amount from catalog if not in seller note
		if (!fullAmount && booking.appointmentSegments?.[0]?.serviceVariationId) {
			try {
				const variationId = booking.appointmentSegments[0].serviceVariationId;
				const catalogResponse = await catalogApi.object.get({
					objectId: variationId,
				});
				const priceMoney = (catalogResponse.object as any)?.itemVariationData?.priceMoney;
				if (priceMoney?.amount) {
					fullAmount = BigInt(priceMoney.amount);
					currency = priceMoney.currency || 'USD';
				}
			} catch (catalogError) {
				console.warn('Failed to fetch service pricing from catalog:', catalogError);
			}
		}

		if (!fullAmount) {
			return new Response(
				JSON.stringify({ error: 'Missing amount or currency information for this booking' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Calculate 30% no-show fee
		const noShowFeeAmount = (fullAmount * BigInt(NO_SHOW_FEE_PERCENTAGE)) / BigInt(100);

		// Charge the no-show fee
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
			note: `No-show fee (${NO_SHOW_FEE_PERCENTAGE}%) for booking ${bookingId} on ${new Date(booking.startAt as string).toLocaleDateString()}`,
		});

		if (paymentResponse.errors?.length) {
			return new Response(
				JSON.stringify({
					error: paymentResponse.errors[0]?.detail || 'Failed to charge no-show fee',
				}),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Update booking seller note to indicate payment was charged
		try {
			await bookingsApi.update({
				bookingId,
				booking: {
					version: booking.version,
					sellerNote: `${booking.sellerNote} | No-show fee charged: ${paymentResponse.payment?.id}`,
				},
			});
		} catch (updateError) {
			console.warn(`Failed to update booking ${bookingId} after charging no-show fee:`, updateError);
		}

		return successResponse({
			success: true,
			bookingId,
			paymentId: paymentResponse.payment?.id,
			fullAmount: fullAmount.toString(),
			noShowFeeAmount: noShowFeeAmount.toString(),
			feePercentage: NO_SHOW_FEE_PERCENTAGE,
			currency,
		});
	} catch (error) {
		return handleSquareError(error, 'Failed to charge no-show fee');
	}
}
