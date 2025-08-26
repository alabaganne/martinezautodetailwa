import { bookingsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';

/**
 * GET /api/bookings/[id]
 * Get a specific booking by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const response = await bookingsApi.retrieveBooking(id);
    
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to fetch booking');
  }
}

/**
 * DELETE /api/bookings/[id]
 * Cancel a booking
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Get cancellation reason if provided
    let cancellationReason = 'Cancelled by admin';
    try {
      const body = await request.json();
      if (body.cancellation_reason) {
        cancellationReason = body.cancellation_reason;
      }
    } catch {
      // Body might be empty, use default reason
    }
    
    // First retrieve the booking to get its version
    const retrieveResponse = await bookingsApi.retrieveBooking(id);
    const booking = retrieveResponse.result?.booking || retrieveResponse.booking;
    
    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Cancel the booking
    const response = await bookingsApi.cancelBooking(id, {
      booking_version: booking.version
    });
    
    const cancelledBooking = response.result?.booking || response.booking;
    
    // Add cancellation reason to response for UI
    return successResponse({
      booking: {
        ...cancelledBooking,
        cancellation_reason: cancellationReason
      }
    });
  } catch (error) {
    // Check if it's already cancelled
    if (error.statusCode === 400 && error.errors?.[0]?.code === 'INVALID_BOOKING_STATE') {
      return new Response(
        JSON.stringify({ 
          error: 'Booking is already cancelled or in an invalid state for cancellation' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handleSquareError(error, 'Failed to cancel booking');
  }
}
