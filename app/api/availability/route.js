import { bookingsApi } from '../square/lib/client';
import { serverCache } from '../square/lib/server-cache';

// Business rules
const BUSINESS_RULES = {
  operatingDays: [1, 2, 3, 4, 5], // Monday to Friday
  openTime: '08:00',
  closeTime: '17:00',
  totalDailyHours: 9 // 08:00 to 17:00
};

/**
 * GET /api/availability
 * Check availability for an entire month based on remaining hours
 * 
 * Query parameters:
 * - month: The month number (1-12)
 * - year: The year (e.g., 2025)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));

    if (!month || !year) {
      return Response.json({ error: 'Month and year are required' }, { status: 400 });
    }

    if (month < 1 || month > 12) {
      return Response.json({ error: 'Month must be between 1 and 12' }, { status: 400 });
    }

    // Calculate start and end of month
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const locationId = process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A';

    // Fetch all bookings for the entire month
    let monthBookings = [];
    
    try {
      const response = await bookingsApi.list(
        100,
        undefined,
        undefined,
        locationId,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      
      monthBookings = response.result?.bookings || [];
    } catch (error) {
      console.log('Square Bookings API not available, using empty bookings list');
      // If Square Bookings API is not available, we'll just use an empty list
      // This allows the system to work even without Square Appointments enabled
    }

    // Build availability object for each day in the month
    const availability = {};
    
    // Iterate through each day of the month
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends
      if (!BUSINESS_RULES.operatingDays.includes(dayOfWeek)) {
        continue;
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Get bookings for this specific day
      const dayBookings = monthBookings.filter(booking => {
        const bookingDate = new Date(booking.start_at || booking.startAt);
        return bookingDate.toISOString().split('T')[0] === dateStr;
      });

      // Calculate total booked hours for the day
      let totalBookedMinutes = 0;
      
      for (const booking of dayBookings) {
        // Get duration from booking
        const bookingDuration = booking.appointment_segments?.[0]?.duration_minutes || 
                              booking.appointmentSegments?.[0]?.durationMinutes || 
                              240; // Default 4 hours
        
        totalBookedMinutes += bookingDuration;
      }
      
      const bookedHours = totalBookedMinutes / 60;
      const remainingHours = BUSINESS_RULES.totalDailyHours - bookedHours;
      
      availability[dateStr] = {
        totalHours: BUSINESS_RULES.totalDailyHours,
        bookedHours: bookedHours,
        remainingHours: Math.max(0, remainingHours), // Ensure non-negative
        available: remainingHours > 0
      };
    }
    
    return Response.json(availability);
    
  } catch (error) {
    console.error('Availability check error:', error);
    return Response.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}