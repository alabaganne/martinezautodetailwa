import { bookingsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';

/**
 * GET /api/square/bookings/today
 * Get all bookings for today
 */
export async function GET(request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const locationId = process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A';
    // TODO: make location dynamic
    
    const response = await bookingsApi.list(
      100, // limit
      undefined, // cursor
      undefined, // teamMemberId
      locationId,
      today.toISOString(),
      tomorrow.toISOString()
    );
    
    const bookings = response.result?.bookings || [];
    
    // Sort by start time
    bookings.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    
    // Add useful metadata
    const now = new Date();
    const stats = {
      total: bookings.length,
      upcoming: bookings.filter(b => new Date(b.start_at) > now).length,
      inProgress: bookings.filter(b => {
        const start = new Date(b.start_at);
        const duration = b.appointment_segments?.[0]?.duration_minutes || 60;
        const end = new Date(start.getTime() + duration * 60000);
        return start <= now && end > now;
      }).length,
      completed: bookings.filter(b => {
        const start = new Date(b.start_at);
        const duration = b.appointment_segments?.[0]?.duration_minutes || 60;
        const end = new Date(start.getTime() + duration * 60000);
        return end <= now;
      }).length,
    };
    
    return successResponse({
      bookings,
      stats,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    if (error.statusCode === 403 || error.statusCode === 404) {
      return handleSquareError(
        { 
          message: 'Bookings API requires Square Appointments to be enabled',
          statusCode: 403 
        },
        'Bookings API not available'
      );
    }
    return handleSquareError(error, 'Failed to fetch today\'s bookings');
  }
}