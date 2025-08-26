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
		const availabilities = await searchAvailability(
			parseInt(year),
			parseInt(month),
			serviceVariationId,
			day ? parseInt(day) : undefined
		);

		console.log('Fetched availabilities:', availabilities);

		return successResponse({ availabilities });
	} catch (err) {
		return handleSquareError(err, 'Error fetching availability');
	}
}
