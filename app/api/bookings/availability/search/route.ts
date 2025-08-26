import { NextRequest } from 'next/server';
import { bookingsApi, locationId, teamMembersApi } from '../../../lib/client';
import { successResponse, handleSquareError } from '../../../lib/utils';

async function getTeamMemberId() {
	// Fetch active team members for the location
	const teamMembersResponse = await teamMembersApi.search({
		query: {
			filter: {
				locationIds: [locationId],
				status: 'ACTIVE',
			},
		},
	});

	if (teamMembersResponse.teamMembers.length === 0) {
		throw new Error('No active team members found for the location');
	}

	return teamMembersResponse.teamMembers[0].id;
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const month = searchParams.get('month');
	const year = searchParams.get('year');
	const serviceVariationId = searchParams.get('serviceVariationId');

	if (!month || !year || !serviceVariationId) {
		return new Response('Missing month or year or serviceVariationId', { status: 400 });
	}

	// Get bookings for the entire month
	// Month is 1-indexed from the frontend, JavaScript Date uses 0-indexed months
	const monthIndex = parseInt(month) - 1;
	const yearNum = parseInt(year);

	const today = new Date();
	const startAt = new Date(yearNum, monthIndex, 1);
	const endAt = new Date(yearNum, monthIndex + 1, 1);

	// Start date cannot be in the past
	if (startAt < today) {
		startAt.setTime(today.getTime());
	}

	try {
		const response = await bookingsApi.searchAvailability({
			query: {
				filter: {
					startAtRange: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
					locationId: locationId,
					segmentFilters: [
						{
							serviceVariationId,
							teamMemberIdFilter: {
								any: [await getTeamMemberId()],
							},
						},
					],
				},
			},
		});

		const availabilities = response.availabilities;

		console.log('Fetched availabilities:', availabilities);

		return successResponse({ availabilities });
	} catch (err) {
		return handleSquareError(err, 'Error fetching availability');
	}
}
