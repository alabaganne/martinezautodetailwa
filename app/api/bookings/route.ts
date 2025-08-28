import { Customer, Availability } from 'square/api';
import { getTeamMemberId, searchAvailability } from '../lib/availability';
import { bookingsApi, customersApi, getLocationId, teamMembersApi } from '../lib/client';
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
		const defaultLocationId = await getLocationId();
		const response = await bookingsApi.list({
			limit: limit ? parseInt(limit) : 100,
			cursor: cursor || undefined,
			locationId: locationIdParam || defaultLocationId,
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
interface CreateBookingRequest {
	dropOffTime: string;
	notes: string;
	email: string; // customer email
	serviceVariationId: string;
	startAt: string;
	vehicleColor: string;
	vehicleMake: string;
	vehicleModel: string;
	vehicleYear: string;
}

export async function POST(request) {
	try {
		const body: CreateBookingRequest = await request.json();

		console.log('Create booking request body', body);

		let { email, notes, startAt, serviceVariationId, dropOffTime, vehicleColor, vehicleMake, vehicleModel, vehicleYear } = body;
		if (!email || !startAt || !serviceVariationId) {
			return new Response(JSON.stringify({ error: 'customerId, startAt, and serviceVariationid are required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const startDate = new Date(startAt);
		const day = startDate.getDate();
		const month = startDate.getMonth() + 1;
		const year = startDate.getFullYear();

		const availability = await searchAvailability(serviceVariationId, year, month, day);
		console.log('availability', availability);
		
		const availableSlots = Object.values(availability);
		if (availableSlots.length === 0) {
			return new Response(JSON.stringify({ error: 'No available slots for the selected date and service' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		
		console.log('startAt Before', startAt);
		startAt = availableSlots[0].startAt;
		console.log('startAt After', startAt);

		const customer = await findOrCreateCustomer(email);
		const defaultLocationId = await getLocationId();

		const bookingData = {
			locationId: defaultLocationId,
			customerId: customer.id,
			startAt,
			customerNote:
				[
					`Drop-off Time: ${dropOffTime}`,
					`Make: ${vehicleMake}`,
					`Model: ${vehicleModel}`,
					`Year: ${vehicleYear}`,
					`Color: ${vehicleColor}`,
					`Notes: ${notes}`,
				].join(' | ') || '',
			appointmentSegments: [
				{
					teamMemberId: await getTeamMemberId(),
					serviceVariationId,
					serviceVariationVersion: BigInt(1),
				},
			],
		};

		const response = await bookingsApi.create({
			booking: bookingData,
		});
		return successResponse(response.booking || response);
	} catch (error) {
		return handleSquareError(error, 'Failed to create booking');
	}
}

async function findOrCreateCustomer(email: string): Promise<Customer> {
	const response = await customersApi.search({
		query: {
			filter: {
				emailAddress: {
					exact: email,
				},
			},
		},
		limit: BigInt('1'),
	});

	const { customers, errors } = response;

	if (errors) {
		console.error('Failed to find customer with email', errors);
		return null;
	}

	if (customers && customers.length > 0) {
		return customers[0];
	}

	// Create customer
	const { customer, errors: createCustomerErrors } = await customersApi.create({
		emailAddress: email,
	});

	if (createCustomerErrors) {
		console.log('Failed to create a new customer', createCustomerErrors);
		return null;
	}

	return customer;
}
