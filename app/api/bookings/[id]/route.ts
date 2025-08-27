import { bookingsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';
import { NextRequest } from 'next/server';
/**
 * DELETE /api/bookings/[id]
 * Cancel a booking
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    console.log('request', request);
    
    // Cancel the booking
    const response = await bookingsApi.cancel({
      bookingVersion: 0,
      bookingId: id
    });
    
    const cancelledBooking = response.booking
    
    // Add cancellation reason to response for UI
    return successResponse({
      booking: cancelledBooking
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
