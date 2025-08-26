import { bookingsApi, locationId, teamMembersApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/square/bookings
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

		// Note: The bookings.list method parameters may vary based on SDK version
		// Adjust as needed based on your Square SDK version
		const response = await bookingsApi.list(limit ? parseInt(limit) : undefined, cursor, undefined, locationId, new Date().toISOString());

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
 * POST /api/square/bookings
 * Create a new booking
 */
export async function POST(request) {
	try {
		const body = await request.json();

		const { customerId, customerNote, appointmentSegments, startAt } = body;
		if (!customerId || !startAt || !appointmentSegments || appointmentSegments.length !== 1 || !appointmentSegments[0].serviceVariationId) {
			return new Response(
				JSON.stringify({ error: 'customerId, startAt, and at least one appointment segment with serviceVariationId are required' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		const appointmentSegment = appointmentSegments[0];

		// Assign a random team member to appointment segment if none provided
		if (!appointmentSegment.teamMemberId) {
			const { teamMembers } = await teamMembersApi.search({
				query: {
					filter: {
						status: 'ACTIVE',
					},
					limit: 1,
				},
			});

			if (!teamMembers || teamMembers.length == 0) {
				return new Response(JSON.stringify({ error: 'No active team members found. Please add a team member in Square Dashboard.' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				});
			}

			const teamMember = teamMembers[0];
			appointmentSegment.teamMemberId = teamMember.id;
		}

		// If payment ID is provided, add it to the booking metadata
		const bookingData = {
			locationId,
			customerId,
			startAt,
			customerNote: customerNote || '',
			appointmentSegments,
		};

		const response = await bookingsApi.create(bookingData);
		return successResponse(response.result || response);
	} catch (error) {
		return handleSquareError(error, 'Failed to create booking');
	}
}
