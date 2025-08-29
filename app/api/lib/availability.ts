import { Availability } from 'square/api';
import { bookingsApi, getLocationId, teamMembersApi } from './client';

/**
 * Get the first active team member ID for the location
 * @returns Team member ID
 * @throws Error if no active team members found
 */

let teamMemberId = null;

export async function getTeamMemberId(): Promise<string> {
	if (teamMemberId) return teamMemberId;

	// Fetch active team members for the location
	const defaultLocationId = await getLocationId();
	let { teamMembers } = await teamMembersApi.search({
		query: {
			filter: {
				locationIds: [defaultLocationId],
				status: 'ACTIVE',
			},
		},
	});

	teamMembers = teamMembers.filter(tm => !tm.isOwner);

	if (teamMembers.length === 0) {
		throw new Error('No active team members found for the location');
	}

	return teamMembers[0].id;
}

/**
 * Reusable function to search for availability
 * @param year - The year (e.g., 2024)
 * @param month - The month (1-indexed, 1-12)
 * @param serviceVariationId - The service variation ID
 * @param day - Optional day of the month (1-31). If not provided, searches entire month
 * @returns Object with dates as keys and boolean availability as values
 */
export async function searchAvailability(serviceVariationId: string, year: number, month: number, day?: number): Promise<Record<string, Availability>> {
	if (month < 1 || month > 12) {
		throw new Error('Month must be between 1 and 12');
	}
	if (day && (day < 1 || day > 31)) {
		throw new Error('Day must be between 1 and 31');
	}

	// Month is 1-indexed from the caller, JavaScript Date uses 0-indexed months
	const monthIndex = month - 1;


	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0); // Set to start of tomorrow
	
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

	// Start date cannot be today or in the past - must be at least tomorrow
	if (startAt < tomorrow) {
		startAt = new Date(tomorrow);
		// If searching for a specific day and it's today or in the past, return empty
		if (day && endAt <= tomorrow) {
			return {};
		}
	}

	const defaultLocationId = await getLocationId();
	const response = await bookingsApi.searchAvailability({
		query: {
			filter: {
				startAtRange: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
				locationId: defaultLocationId,
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

	const availabilities: Availability[] = response.availabilities || [];

	// Sort availabilities by startAt time
	availabilities.sort((a, b) => {
		return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
	});

	// Create a date availability map
	const dateAvailabilityMap: Record<string, Availability> = {};

	availabilities.forEach((slot: any) => {
		const dateKey = slot.startAt.split('T')[0];
		if (!dateAvailabilityMap[dateKey])
			dateAvailabilityMap[dateKey] = slot;
	});

	return dateAvailabilityMap;
}
