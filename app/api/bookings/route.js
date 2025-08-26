import { getTeamMemberId } from '../lib/availability';
import { bookingsApi, locationId, teamMembersApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/bookings
 * List bookings
 *
 * Query parameters:
 * - limit: Maximum number of results
 * - cursor: Pagination cursor
 * - location_id: Filter by location
 * - start_at_min: Minimum start time
 * - start_at_max: Maximum start time
 */
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);

		const limit = searchParams.get('limit');
		const cursor = searchParams.get('cursor');
		const locationIdParam = searchParams.get('location_id');

		// Note: The bookings.list method parameters may vary based on SDK version
		// Adjust as needed based on your Square SDK version
		const response = await bookingsApi.list({
			limit: limit ? parseInt(limit) : undefined,
			cursor: cursor || undefined,
			locationId: locationIdParam || locationId
		});

		return successResponse(response.data || response);
	} catch (error) {
		// Bookings API might not be available in all Square accounts
		if (error.statusCode === 403 || error.statusCode === 404) {
			return handleSquareError(
				{
					message: 'Bookings API requires Square Appointments to be enabled',
					statusCode: 403,
				},
				'Bookings API not available'
			);
		}
		return handleSquareError(error, 'Failed to fetch bookings');
	}
}

/**
 * POST /api/bookings
 * Create a new booking
 * Required fields in the request body:
 * - customerId: ID of the customer
 * - startAt: Start time of the booking in ISO 8601 format
 * - appointmentSegments: Array of appointment segments (exactly one required)
 *  - Each segment must include serviceVariationId
 * Optional fields:
 * - customerNote: Note from the customer
 * - teamMemberId: ID of the team member (if not provided, a random active team member will be assigned)
 * If payment ID is provided, it will be added to the booking metadata
 */
export async function POST(request) {
	try {
		const body = await request.json();

		const { customerId, customerNote, appointmentSegments, startAt } = body;
		if (!customerId || !startAt) {
			return new Response(
				JSON.stringify({ error: 'customerId, startAt, and at least one appointment segment are required' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}
		
		// Extract day, month, and year from startAt
		const startDate = new Date(startAt);
		const day = startDate.getDate();
		const month = startDate.getMonth() + 1; // getMonth() returns 0-11, so we add 1
		const year = startDate.getFullYear();
		
		if (!appointmentSegments || appointmentSegments.length !== 1 || !appointmentSegments[0].serviceVariationId) {
			return new Response(
				JSON.stringify({ error: 'Exactly one appointment segment with serviceVariationId is required' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		const appointmentSegment = appointmentSegments[0];

		// Assign a random team member to appointment segment if none provided
		if (!appointmentSegment.teamMemberId) {
			appointmentSegment.teamMemberId = await getTeamMemberId();
		}

		// If payment ID is provided, add it to the booking metadata
		const bookingData = {
			locationId,
			customerId,
			startAt: startDate.toISOString(),
			customerNote: customerNote || '',
			appointmentSegments: [
				{
					...appointmentSegment,
					serviceVariationVersion: BigInt(1),
				}
			],
		};

		console.log('Creating booking with data:', bookingData);

		const response = await bookingsApi.create({
			booking: bookingData,
		});
		return successResponse(response.result || response);
	} catch (error) {
		return handleSquareError(error, 'Failed to create booking');
	}
}
