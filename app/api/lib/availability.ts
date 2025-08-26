import { bookingsApi, locationId, teamMembersApi } from './client';

/**
 * Get the first active team member ID for the location
 * @returns Team member ID
 * @throws Error if no active team members found
 */
export async function getTeamMemberId() {
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

/**
 * Reusable function to search for availability
 * @param year - The year (e.g., 2024)
 * @param month - The month (1-indexed, 1-12)
 * @param serviceVariationId - The service variation ID
 * @param day - Optional day of the month (1-31). If not provided, searches entire month
 * @returns Array of available booking slots
 */
export async function searchAvailability(
	year: number,
	month: number,
	serviceVariationId: string,
	day?: number
) {

	if (month < 1 || month > 12) {
		throw new Error('Month must be between 1 and 12');
	}
	if (day && (day < 1 || day > 31)) {
		throw new Error('Day must be between 1 and 31');
	}

	// Month is 1-indexed from the caller, JavaScript Date uses 0-indexed months
	const monthIndex = month - 1;
	
	const today = new Date();
	let startAt: Date;
	let endAt: Date;
	
	if (day) {
		// Search for specific day
		startAt = new Date(year, monthIndex, day, 0, 0, 0);
		endAt = new Date(year, monthIndex, day + 1, 0, 0, 0); // Next day at midnight
	} else {
		// Search for entire month
		startAt = new Date(year, monthIndex, 1);
		endAt = new Date(year, monthIndex + 1, 1);
	}
	
	// Start date cannot be in the past
	if (startAt < today) {
		startAt = new Date(today);
		// If searching for a specific day and it's in the past, return empty
		if (day && endAt <= today) {
			return [];
		}
	}
	
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
	
	return response.availabilities || [];
}