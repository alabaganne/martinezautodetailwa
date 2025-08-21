import { bookingsApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/square/bookings
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
    const locationId = searchParams.get('location_id');
    
    // Note: The bookings.list method parameters may vary based on SDK version
    // Adjust as needed based on your Square SDK version
    const response = await bookingsApi.list(
      limit ? parseInt(limit) : undefined,
      cursor,
      undefined,
      locationId,
      new Date().toISOString(),
    );
    
    return successResponse(response.data || response);
  } catch (error) {
    // Bookings API might not be available in all Square accounts
    if (error.statusCode === 403 || error.statusCode === 404) {
      return handleSquareError(
        { 
          message: 'Bookings API requires Square Appointments to be enabled',
          statusCode: 403 
        },
        'Bookings API not available'
      );
    }
    return handleSquareError(error, 'Failed to fetch bookings');
  }
}

/**
 * POST /api/square/bookings
 * Create a new booking
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const response = await bookingsApi.create(body);
    return successResponse(response.result || response);
  } catch (error) {
    if (error.statusCode === 403 || error.statusCode === 404) {
      return handleSquareError(
        { 
          message: 'Bookings API requires Square Appointments to be enabled',
          statusCode: error.statusCode 
        },
        'Bookings API not available'
      );
    }
    return handleSquareError(error, 'Failed to create booking');
  }
}