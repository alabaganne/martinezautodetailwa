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


	teamMembers = teamMembers.filter(tm => !tm.isOwner && tm.givenName.toLowerCase() !== 'strivehawk');

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
 * @returns Object with dates as keys and first availability slot as values
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

	// Get today's date at start of day in UTC for comparison
	const today = new Date();
	const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
	
	const defaultLocationId = await getLocationId();
	// const teamMemberId = await getTeamMemberId();
	const allAvailabilities: Availability[] = [];

	if (day) {
		// Search for specific day (UTC)
		const startAt = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0));
		const endAt = new Date(Date.UTC(year, monthIndex, day + 1, 0, 0, 0)); // Next day at midnight UTC
		
		// Skip if the requested day is in the past
		if (startAt < todayUTC) {
			return {};
		}
		
		const page = await bookingsApi.searchAvailability({
			query: {
				filter: {
					startAtRange: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
					locationId: defaultLocationId,
					segmentFilters: [
						{
							serviceVariationId,
						},
					],
				},
			},
		});
		if (page.availabilities) allAvailabilities.push(...page.availabilities);
	} else {
		// Search for entire month day by day using concurrent requests
		// Get the last day of the month
		const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getDate();
		
		// Determine starting day - skip past days
		const currentDate = new Date();
		let startDay = 1;
		
		// If searching current month/year, start from today or tomorrow
		if (year === currentDate.getUTCFullYear() && month === currentDate.getUTCMonth() + 1) {
			startDay = Math.max(1, currentDate.getUTCDate());
		}
		
		// Build array of days to fetch (filtering out past days)
		const daysToFetch: number[] = [];
		for (let currentDay = startDay; currentDay <= lastDayOfMonth; currentDay++) {
			const startAt = new Date(Date.UTC(year, monthIndex, currentDay));
			if (startAt >= todayUTC) {
				daysToFetch.push(currentDay);
			}
		}
		
		// Create array of promises for concurrent execution
		const availabilityPromises = daysToFetch.map(async (currentDay) => {
			const startAt = new Date(Date.UTC(year, monthIndex, currentDay));
			const endAt = new Date(Date.UTC(year, monthIndex, currentDay + 1));
			
			try {
				const page = await bookingsApi.searchAvailability({
					query: {
						filter: {
							startAtRange: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
							locationId: defaultLocationId,
							segmentFilters: [
								{
									serviceVariationId,
								},
							],
						},
					},
				});
				
				if (page.availabilities && page.availabilities.length > 0) {
					// Sort to get the earliest slot first
					const sortedSlots = page.availabilities.sort((a, b) => 
						new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
					);
					return sortedSlots[0]; // Return first available slot
				}
				return null;
			} catch (error) {
				console.error(`Error fetching availability for ${year}-${month}-${currentDay}:`, error);
				return null;
			}
		});
		
		// Execute all requests concurrently and filter out nulls
		const results = await Promise.all(availabilityPromises);
		
		// Add all non-null results to allAvailabilities
		allAvailabilities.push(...results.filter(slot => slot !== null));
	}

	// Create a date availability map - since we already have first slot per day,
	// just build the map directly
	const dateAvailabilityMap: Record<string, Availability> = {};
	allAvailabilities.forEach((slot: Availability) => {
		if (!slot?.startAt) {
			return;
		}

		const dateKey = slot.startAt.split('T')[0];
		const existingSlot = dateAvailabilityMap[dateKey];
		if (!existingSlot?.startAt) {
			dateAvailabilityMap[dateKey] = slot;
			return;
		}

		const currentStart = new Date(slot.startAt).getTime();
		const existingStart = new Date(existingSlot.startAt).getTime();
		if (currentStart < existingStart) {
			dateAvailabilityMap[dateKey] = slot;
		}
	});

	return dateAvailabilityMap;
}
