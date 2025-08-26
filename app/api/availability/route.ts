import { bookingsApi } from "../square/lib/client";

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const month = searchParams.get('month');
	const year = searchParams.get('year');

	if (!month || !year) {
		return new Response('Missing month or year parameter', { status: 400 });
	}

	// Get bookings for the entire month
	// Month is 1-indexed from the frontend, JavaScript Date uses 0-indexed months
	const monthIndex = parseInt(month) - 1;
	const yearNum = parseInt(year);
	
	// Start of month: first day at 00:00:00
	const startOfMonth = new Date(yearNum, monthIndex, 1);
	
	// End of month: first day of next month at 00:00:00
	// Square API will exclude this exact timestamp, giving us all bookings up to 23:59:59 of the last day
	const endOfMonth = new Date(yearNum, monthIndex + 1, 1);
	
	const currMonthBookings = await bookingsApi.list({
		startAtMin: startOfMonth.toISOString(),
		startAtMax: endOfMonth.toISOString(),
	})

	return Response.json({ availability: [] });
}