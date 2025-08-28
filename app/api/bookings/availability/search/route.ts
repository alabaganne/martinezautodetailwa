import { NextRequest } from 'next/server';
import { successResponse, handleSquareError } from '../../../lib/utils';
import { searchAvailability } from '../../../lib/availability';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const month = searchParams.get('month');
	const year = searchParams.get('year');
	const serviceVariationId = searchParams.get('serviceVariationId');
	const day = searchParams.get('day'); // Optional day parameter

	if (!month || !year || !serviceVariationId) {
		return new Response('Missing month or year or serviceVariationId', { status: 400 });
	}

	try {
		const availability = await searchAvailability(
			serviceVariationId,
			parseInt(year),
			parseInt(month),
			day ? parseInt(day) : undefined
		);

		console.log('Fetched availability:', availability);

		return successResponse(availability);
	} catch (err) {
		return handleSquareError(err, 'Error fetching availability');
	}
}
