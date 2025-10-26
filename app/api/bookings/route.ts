import { Customer, Availability } from 'square/api';
import { getTeamMemberId, searchAvailability } from '../lib/availability';
import { bookingsApi, cardsApi, customersApi, getLocationId, teamMembersApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';
import { randomUUID } from 'crypto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_SQUARE_WINDOW_DAYS = 31;
const DEFAULT_PAST_DAYS = 60;
const DEFAULT_FUTURE_DAYS = 60;
const MAX_TOTAL_RANGE_DAYS = 365;

type DateRange = { start: Date; end: Date };

const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * MS_PER_DAY);

const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime());

const parseDateParam = (value: string | null): Date | null => {
	if (!value) return null;
	const parsed = new Date(value);
	return isValidDate(parsed) ? parsed : null;
};

const splitRangeIntoWindows = (start: Date, end: Date): DateRange[] => {
	const windows: DateRange[] = [];
	let cursor = new Date(start);

	while (cursor < end) {
		const windowEnd = new Date(
			Math.min(end.getTime(), cursor.getTime() + MAX_SQUARE_WINDOW_DAYS * MS_PER_DAY)
		);
		windows.push({ start: new Date(cursor), end: windowEnd });
		cursor = windowEnd;
	}

	return windows;
};

const buildDefaultRange = (): { start: Date; end: Date } => {
	const now = new Date();
	const start = addDays(now, -DEFAULT_PAST_DAYS);
	const end = addDays(now, DEFAULT_FUTURE_DAYS);
	return { start, end };
};

const formatBookingsPage = (page: any) => {
	if (page?.response) {
		return page.response;
	}
	if (page?.data) {
		return { bookings: page.data };
	}
	return page;
};

const normalizePhoneNumber = (phone: string | undefined): string | null => {
	if (!phone) {
		return null;
	}
	const trimmed = phone.trim();
	if (!trimmed) {
		return null;
	}
	const digits = trimmed.replace(/\D/g, '');
	if (!digits || digits.length < 10) {
		return null;
	}
	if (trimmed.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
		return `+${digits}`;
	}
	if (digits.length === 11 && digits.startsWith('1')) {
		return `+${digits}`;
	}
	if (digits.length === 10) {
		return `+1${digits}`;
	}
	if (digits.length >= 10 && digits.length <= 15) {
		return `+${digits}`;
	}
	return null;
};

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

		const limitParam = searchParams.get('limit');
		const cursor = searchParams.get('cursor');
		const locationIdParam = searchParams.get('location_id');
		const customerId = searchParams.get('customer_id') || undefined;
		const teamMemberId = searchParams.get('team_member_id') || undefined;
		const startAtMinParam = searchParams.get('start_at_min');
		const startAtMaxParam = searchParams.get('start_at_max');

		const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
		const limit = parsedLimit && !Number.isNaN(parsedLimit) ? Math.max(1, parsedLimit) : undefined;

		const defaultLocationId = await getLocationId();
		const locationId = locationIdParam || defaultLocationId;

		if (cursor) {
			const page = await bookingsApi.list({
				cursor,
			});
			return successResponse(formatBookingsPage(page));
		}

		const startDateFromParam = parseDateParam(startAtMinParam);
		const endDateFromParam = parseDateParam(startAtMaxParam);

		if (startAtMinParam && !startDateFromParam) {
			return new Response(JSON.stringify({ error: 'Invalid start_at_min value' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (startAtMaxParam && !endDateFromParam) {
			return new Response(JSON.stringify({ error: 'Invalid start_at_max value' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		let dateRange: { start: Date; end: Date };
		if (startDateFromParam && endDateFromParam) {
			dateRange = { start: startDateFromParam, end: endDateFromParam };
		} else if (startDateFromParam && !endDateFromParam) {
			dateRange = { start: startDateFromParam, end: addDays(startDateFromParam, MAX_SQUARE_WINDOW_DAYS) };
		} else if (!startDateFromParam && endDateFromParam) {
			dateRange = { start: addDays(endDateFromParam, -MAX_SQUARE_WINDOW_DAYS), end: endDateFromParam };
		} else {
			dateRange = buildDefaultRange();
		}

		if (dateRange.end <= dateRange.start) {
			return new Response(JSON.stringify({ error: 'start_at_max must be after start_at_min' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const totalRangeDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / MS_PER_DAY);
		if (totalRangeDays > MAX_TOTAL_RANGE_DAYS) {
			return new Response(JSON.stringify({ error: `Requested range cannot exceed ${MAX_TOTAL_RANGE_DAYS} days` }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const windows = splitRangeIntoWindows(dateRange.start, dateRange.end);
		if (windows.length === 0) {
			return successResponse({
				bookings: [],
				startAtMin: dateRange.start.toISOString(),
				startAtMax: dateRange.end.toISOString(),
			});
		}

		const perRequestLimit = Math.max(1, Math.min(limit ?? 200, 200));
		const overallLimit = limit;
		const bookingsMap = new Map<string, any>();
		let collected = 0;

		for (const windowRange of windows) {
			const page = await bookingsApi.list({
				limit: perRequestLimit,
				locationId,
				customerId,
				teamMemberId,
				startAtMin: windowRange.start.toISOString(),
				startAtMax: windowRange.end.toISOString(),
			});

			for await (const booking of page as any) {
				if (!booking?.id || bookingsMap.has(booking.id)) {
					continue;
				}
				bookingsMap.set(booking.id, booking);
				collected += 1;
				if (overallLimit && collected >= overallLimit) {
					break;
				}
			}

			if (overallLimit && collected >= overallLimit) {
				break;
			}
		}

		const bookings = Array.from(bookingsMap.values()).sort((a, b) => {
			const dateA = new Date(a.startAt || a.start_at || 0).getTime();
			const dateB = new Date(b.startAt || b.start_at || 0).getTime();
			return dateA - dateB;
		});

		return successResponse({
			bookings,
			startAtMin: dateRange.start.toISOString(),
			startAtMax: dateRange.end.toISOString(),
			count: bookings.length,
		});
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
	phone: string;
	serviceVariationId: string;
	startAt: string;
	vehicleColor: string;
	vehicleMake: string;
	vehicleModel: string;
	vehicleYear: string;
	paymentToken?: string; // Square payment token for no-show fee
	cardLastFour?: string; // Last 4 digits of card
	cardBrand?: string; // Card brand (Visa, Mastercard, etc.)
}

export async function POST(request) {
	try {
		const body: CreateBookingRequest = await request.json();

		console.log('Create booking request body', body);

		let { email, phone, notes, startAt, serviceVariationId, dropOffTime, vehicleColor, vehicleMake, vehicleModel, vehicleYear, paymentToken, cardLastFour, cardBrand } = body;

		email = typeof email === 'string' ? email.trim() : '';
		phone = typeof phone === 'string' ? phone.trim() : '';
		notes = typeof notes === 'string' ? notes : '';
		startAt = typeof startAt === 'string' ? startAt : '';
		serviceVariationId = typeof serviceVariationId === 'string' ? serviceVariationId : '';
		dropOffTime = typeof dropOffTime === 'string' ? dropOffTime.trim() : '';
		vehicleColor = typeof vehicleColor === 'string' ? vehicleColor.trim() : '';
		vehicleMake = typeof vehicleMake === 'string' ? vehicleMake.trim() : '';
		vehicleModel = typeof vehicleModel === 'string' ? vehicleModel.trim() : '';
		vehicleYear = typeof vehicleYear === 'string' ? vehicleYear.trim() : '';
		cardLastFour = typeof cardLastFour === 'string' ? cardLastFour.trim() : '';
		cardBrand = typeof cardBrand === 'string' ? cardBrand.trim() : '';
		notes = notes.trim();

		if (!email || !phone || !startAt || !serviceVariationId) {
			return new Response(JSON.stringify({ error: 'email, phone, startAt, and serviceVariationId are required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (!dropOffTime) {
			dropOffTime = '8:00 AM';
		}

		const normalizedPhone = normalizePhoneNumber(phone);
		if (!normalizedPhone) {
			return new Response(JSON.stringify({ error: 'A valid phone number is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const startDate = new Date(startAt);
		const day = startDate.getDate();
		const month = startDate.getMonth() + 1;
		const year = startDate.getFullYear();

		const availability = await searchAvailability(serviceVariationId, year, month, day);
		
		const availableSlots = Object.values(availability);
		if (availableSlots.length === 0) {
			return new Response(JSON.stringify({ error: 'No available slots for the selected date and service' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		
		startAt = availableSlots[0].startAt;

		const customer = await findOrCreateCustomer(email, normalizedPhone);
		if (!customer) {
			return new Response(JSON.stringify({ error: 'Unable to create or find customer' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		const defaultLocationId = await getLocationId();

		// Store card on file if payment token is provided
		const storedCardId = await storeCardOnFile(customer, paymentToken);

                const sellerNoteParts = [
                        storedCardId ? `Card ID: ${storedCardId}` : null,
                        'No-Show Fee Charged (cents): 0',
                ].filter(Boolean);

                const bookingData = {
                        locationId: defaultLocationId,
                        customerId: customer.id,
                        startAt,
                        sellerNote: sellerNoteParts.length > 0 ? sellerNoteParts.join(' | ') : undefined,
			customerNote:
				[
					dropOffTime ? `Drop-off Time: ${dropOffTime}` : null,
					phone ? `Phone: ${phone}` : null,
					vehicleMake ? `Make: ${vehicleMake}` : null,
					vehicleModel ? `Model: ${vehicleModel}` : null,
					vehicleYear ? `Year: ${vehicleYear}` : null,
					vehicleColor ? `Color: ${vehicleColor}` : null,
					cardBrand && cardLastFour ? `Card on File: ${cardBrand} ending in ${cardLastFour}` : null,
					notes?.trim() ? `Notes: ${notes.trim()}` : null,
				].filter(Boolean).join(' | ') || '',
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

async function findOrCreateCustomer(email: string, phone?: string): Promise<Customer | null> {
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
		const existingCustomer = customers[0];
		if (phone && existingCustomer.phoneNumber !== phone) {
			try {
				await customersApi.update(existingCustomer.id, { phoneNumber: phone });
				existingCustomer.phoneNumber = phone;
			} catch (updateError) {
				console.warn('Failed to update customer phone number', updateError);
			}
		}
		return existingCustomer;
	}

	// Create customer
	const createPayload: any = {
		emailAddress: email,
	};
	if (phone) {
		createPayload.phoneNumber = phone;
	}

	const { customer, errors: createCustomerErrors } = await customersApi.create(createPayload);

	if (createCustomerErrors) {
		console.log('Failed to create a new customer', createCustomerErrors);
		return null;
	}

	return customer;
}

async function storeCardOnFile(customer: Customer | null, paymentToken: string | undefined): Promise<string | null> {
	if (!paymentToken || !customer) {
		return null;
	}

	const idempotencyKey = randomUUID();
	const cardResponse = await cardsApi.create({
		idempotencyKey,
		sourceId: paymentToken,
		card: {
			customerId: customer.id,
		},
	});

	if (cardResponse.card) {
		console.log('Successfully stored card on file:', cardResponse.card.id);
		return cardResponse.card.id;
	}
	else {
		console.log('cardResponse', cardResponse);
		throw new Error('Error occurred saving card on file.');
	}
}
