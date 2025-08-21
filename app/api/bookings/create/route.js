import { customersApi, bookingsApi } from '../../square/lib/client';
import { serverCache } from '../../square/lib/server-cache';
import crypto from 'crypto';

function generateIdempotencyKey() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * POST /api/bookings/create
 * Create a new booking with customer and appointment
 */
export async function POST(request) {
  try {
    const formData = await request.json();
    
    // Validate required fields
    if (!formData.customerName || !formData.email || !formData.phone) {
      return Response.json(
        { error: 'Customer information is required' },
        { status: 400 }
      );
    }
    
    if (!formData.appointmentDate || !formData.dropOffTime) {
      return Response.json(
        { error: 'Appointment date and time are required' },
        { status: 400 }
      );
    }
    
    if (!formData.serviceType || !formData.vehicleType) {
      return Response.json(
        { error: 'Service and vehicle type are required' },
        { status: 400 }
      );
    }
    
    // Step 1: Create or find customer
    let customerId;
    
    try {
      // Search for existing customer by email
      console.log('Searching for customer with email:', formData.email);
      
      const searchResponse = await customersApi.search({
        filter: {
          emailAddress: {
            exact: formData.email
          }
        }
      });
      
      console.log('Search response:', searchResponse);
      
      // Handle different response structures
      const customers = searchResponse.result?.customers || 
                       searchResponse.customers || 
                       [];
      
      if (customers.length > 0) {
        // Use existing customer
        customerId = customers[0].id;
        console.log('Found existing customer:', customerId);
      } else {
        // Create new customer
        console.log('Creating new customer...');
        
        // Format phone number - add country code if not present
        let phoneNumber = formData.phone.replace(/\D/g, ''); // Remove formatting
        if (phoneNumber.length === 10) {
          phoneNumber = '+1' + phoneNumber; // Add US country code if 10 digits
        } else if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+' + phoneNumber; // Ensure it starts with +
        }
        
        const createCustomerResponse = await customersApi.create({
          idempotencyKey: generateIdempotencyKey(),
          givenName: formData.customerName.split(' ')[0],
          familyName: formData.customerName.split(' ').slice(1).join(' ') || '',
          emailAddress: formData.email,
          phoneNumber: phoneNumber,
          note: `Vehicle: ${formData.vehicleYear || ''} ${formData.vehicleMake || ''} ${formData.vehicleModel || ''}`.trim()
        });
        
        console.log('Create customer response:', createCustomerResponse);
        
        // Handle different response structures
        const customer = createCustomerResponse.result?.customer || 
                        createCustomerResponse.customer;
        
        if (customer) {
          customerId = customer.id;
          console.log('Created new customer:', customerId);
        } else {
          throw new Error('Customer creation returned unexpected response');
        }
      }
    } catch (error) {
      console.error('Customer creation/search error:', error);
      console.error('Error details:', error.result?.errors || error.message);
      return Response.json(
        { 
          error: 'Failed to create or find customer record',
          details: error.result?.errors?.[0]?.detail || error.message
        },
        { status: 500 }
      );
    }
    
    // Step 2: Validate availability
    const appointmentDate = new Date(formData.appointmentDate);
    const [dropOffHours, dropOffMinutes] = formData.dropOffTime.replace(' AM', '').replace(' PM', '').split(':');
    appointmentDate.setHours(
      formData.dropOffTime.includes('PM') && dropOffHours !== '12' ? parseInt(dropOffHours) + 12 : parseInt(dropOffHours),
      parseInt(dropOffMinutes || 0),
      0,
      0
    );
    
    // Get service duration from server cache
    const duration = await serverCache.getServiceDuration(formData.serviceType, formData.vehicleType);
    const durationHours = duration / 60;
    
    // Check if there's enough time available for this booking
    const dateStr = appointmentDate.toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);
    
    try {
      const locationId = process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A';
      const response = await bookingsApi.list(
        100,
        undefined,
        undefined,
        locationId,
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );
      
      const existingBookings = response.bookings || [];
      
      // Calculate total booked hours for the day
      let totalBookedMinutes = 0;
      for (const booking of existingBookings) {
        const bookingDuration = booking.appointment_segments?.[0]?.duration_minutes || 
                              booking.appointmentSegments?.[0]?.durationMinutes || 
                              240;
        totalBookedMinutes += bookingDuration;
      }
      
      const bookedHours = totalBookedMinutes / 60;
      const remainingHours = 9 - bookedHours; // 9 hours = 08:00 to 17:00
      
      // Check if the new booking fits
      if (durationHours > remainingHours) {
        return Response.json(
          { 
            error: `Not enough time available on ${dateStr}. This service requires ${durationHours.toFixed(1)} hours but only ${remainingHours.toFixed(1)} hours remain.`,
            details: {
              required: durationHours,
              available: remainingHours,
              date: dateStr
            }
          },
          { status: 422 }
        );
      }
    } catch (error) {
      console.log('Could not validate availability, proceeding with booking');
    }
    
    // Get service variation ID from server cache
    const serviceInfo = await serverCache.getServiceInfo(formData.serviceType, formData.vehicleType);
    const serviceVariationId = serviceInfo?.variationId || serviceInfo?.itemId || null;

    if(!serviceVariationId) {
      return Response.json(
        { error: 'Service variation not found for the selected service and vehicle type' },
        { status: 422 }
      );
    }
    
    // Get default team member ID from server cache
    const teamMemberId = await serverCache.getDefaultTeamMemberId();
    
    // Step 3: Create the booking
    try {
      // Note: Square Bookings API requires Square Appointments to be enabled
      // This is a simplified version - you may need to adjust based on your Square setup
      console.log('Creating booking for customer:', customerId);
      console.log('Appointment date/time:', appointmentDate.toISOString());
      console.log('Service duration:', duration, 'minutes');
      console.log('Service variation ID:', serviceVariationId);
      console.log('Service info from cache:', serviceInfo);
      
      // Build appointment segment
      const appointmentSegment = {
        durationMinutes: duration,
        teamMemberId: teamMemberId  // Use team member from server cache
      };
      
      // Only add serviceVariationId if we have a valid one
      // Square requires this to be a valid variation ID, not an item ID
      if (serviceVariationId && serviceVariationId.includes('-')) {
        appointmentSegment.serviceVariationId = serviceVariationId;
        appointmentSegment.serviceVariationVersion = BigInt(Date.now());
      }
      
      const bookingData = {
        idempotencyKey: generateIdempotencyKey(),
        booking: {
          startAt: appointmentDate.toISOString(),
          locationId: process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A',
          customerId: customerId,
          customerNote: `Service: ${formData.serviceType}, Vehicle: ${formData.vehicleType}, Details: ${formData.notes || 'N/A'}`,
          appointmentSegments: [appointmentSegment]
        }
      };
      
      const bookingResponse = await bookingsApi.create(bookingData);
      
      console.log('Booking created successfully:', bookingResponse);
      
      // Check different response structures
      const booking = bookingResponse.result?.booking || 
                     bookingResponse.booking || 
                     bookingResponse;
      
      return Response.json({
        success: true,
        booking: booking,
        customer: { id: customerId }
      });
      
    } catch (bookingError) {
      console.error('Booking creation error:', bookingError);
      console.error('Booking error details:', 
        'Status code:', bookingError.statusCode,
        'Body:', JSON.stringify(bookingError.result || bookingError.body || bookingError, null, 2)
      );
      
      // If Square Bookings API is not available or service variation is invalid, create a fallback response
      if (bookingError.statusCode === 403 || bookingError.statusCode === 404 || 
          bookingError.statusCode === 400 ||
          bookingError.message?.includes('bookings') || bookingError.message?.includes('Bookings') ||
          bookingError.message?.includes('service_variation_id')) {
        // Create a mock booking for development/testing
        console.log('Creating mock booking for testing (Square Appointments not available)');
        
        const mockBooking = {
          id: `MOCK-${Date.now()}`,
          startAt: appointmentDate.toISOString(),
          customerId: customerId,
          status: 'PENDING',
          customerNote: formData.customerNote || `Service: ${formData.serviceType}, Vehicle: ${formData.vehicleType}`,
          appointmentSegments: [{
            durationMinutes: duration
          }],
          locationId: process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A'
        };
        
        return Response.json({
          success: true,
          booking: mockBooking,
          customer: { id: customerId },
          warning: 'Square Appointments not enabled - created mock booking for testing'
        });
      }
      
      // For other errors, return details
      return Response.json(
        { 
          error: 'Failed to create booking',
          details: bookingError.result?.errors?.[0]?.detail || bookingError.message
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Booking creation failed:', error);
    return Response.json(
      { 
        error: 'Failed to create booking',
        details: error.message 
      },
      { status: 500 }
    );
  }
}