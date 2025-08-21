import { bookingsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';

/**
 * GET /api/square/bookings/upcoming
 * Get upcoming bookings for specified number of days
 * 
 * Query parameters:
 * - days: Number of days to look ahead (default: 7)
 * - include_today: Include today's bookings (default: true)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const includeToday = searchParams.get('include_today') !== 'false';
    
    const startDate = new Date();
    if (includeToday) {
      startDate.setHours(0, 0, 0, 0);
    }
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);
    
    const locationId = process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A';
    
    const response = await bookingsApi.list(
      100, // limit
      undefined, // cursor
      undefined, // teamMemberId
      locationId,
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    const bookings = response.result?.bookings || [];
    
    // Sort by start time
    bookings.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    
    // Group bookings by date
    const bookingsByDate = {};
    bookings.forEach(booking => {
      const date = new Date(booking.start_at).toISOString().split('T')[0];
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = [];
      }
      bookingsByDate[date].push(booking);
    });
    
    // Calculate stats
    const stats = {
      total: bookings.length,
      byStatus: {
        pending: bookings.filter(b => b.status === 'PENDING').length,
        accepted: bookings.filter(b => b.status === 'ACCEPTED').length,
        declined: bookings.filter(b => b.status === 'DECLINED').length,
        cancelled: bookings.filter(b => 
          b.status === 'CANCELLED_BY_CUSTOMER' || b.status === 'CANCELLED_BY_SELLER'
        ).length,
      },
      byDate: Object.keys(bookingsByDate).map(date => ({
        date,
        count: bookingsByDate[date].length
      }))
    };
    
    return successResponse({
      bookings,
      bookingsByDate,
      stats,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      }
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
    return handleSquareError(error, 'Failed to fetch upcoming bookings');
  }
}