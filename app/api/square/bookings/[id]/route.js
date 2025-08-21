import { bookingsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';

/**
 * GET /api/square/bookings/[id]
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
 * PUT /api/square/bookings/[id]
 * Update a booking (customer note, address, etc.)
 * Note: Status cannot be updated directly as it's read-only
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // First retrieve the booking to get its current version
    const retrieveResponse = await bookingsApi.retrieveBooking(id);
    const currentBooking = retrieveResponse.result?.booking || retrieveResponse.booking;
    
    if (!currentBooking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Prepare update request with version
    const updateRequest = {
      bookingId: id,
      booking: {
        version: currentBooking.version,
        ...body // This can include customerNote, address, etc.
      }
    };
    
    // Update the booking
    const response = await bookingsApi.updateBooking(updateRequest);
    
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to update booking');
  }
}

/**
 * DELETE /api/square/bookings/[id]
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

/**
 * PATCH /api/square/bookings/[id]
 * Handle status change requests
 * Since status is read-only in Square API, we handle different status changes appropriately
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;
    
    // Handle different status change requests
    switch(status) {
      case 'ACCEPTED': {
        // Square doesn't have an "accept" method - bookings are automatically accepted
        // Just return the current booking with accepted status for UI update
        const acceptResponse = await bookingsApi.retrieveBooking(id);
        const acceptedBooking = acceptResponse.result?.booking || acceptResponse.booking;
        
        // Note: In production, you might want to send a confirmation email here
        // or update your own database to track acceptance
        
        return successResponse({
          booking: {
            ...acceptedBooking,
            status: 'ACCEPTED'
          }
        });
      }
        
      case 'DECLINED':
      case 'CANCELLED_BY_SELLER': {
        // For decline or cancel, use the cancel method
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
        
        const cancelResponse = await bookingsApi.cancelBooking(id, {
          booking_version: booking.version
        });
        
        const cancelledBooking = cancelResponse.result?.booking || cancelResponse.booking;
        
        return successResponse({
          booking: {
            ...cancelledBooking,
            status: 'CANCELLED_BY_SELLER'
          }
        });
      }
        
      default:
        return new Response(
          JSON.stringify({ error: `Cannot change status to ${status}` }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    return handleSquareError(error, 'Failed to update booking status');
  }
}