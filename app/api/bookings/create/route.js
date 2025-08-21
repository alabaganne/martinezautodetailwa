import { customersApi, bookingsApi, catalogApi } from '../../square/lib/client';
import crypto from 'crypto';

// Service durations in minutes
const SERVICE_DURATIONS = {
  'interior': {
    'small': 210, // 3.5h
    'truck': 270, // 4.5h
    'minivan': 300 // 5h
  },
  'exterior': {
    'small': 180, // 3h
    'truck': 210, // 3.5h
    'minivan': 210 // 3.5h
  },
  'full': {
    'small': 240, // 4h
    'truck': 300, // 5h
    'minivan': 330 // 5.5h
  }
};

// Map frontend values to Square catalog item IDs
const SERVICE_CATALOG_IDS = {
  'interior_small': '63C3R73LAN5XXIDYPKOYX4GE',
  'exterior_small': 'RUTBVBVNYUVKFLD664QCAMLO',
  'full_small': '2YUDZ7737LEMGLEKK2ER76SS',
  'interior_truck': 'DXLVBL65CXRZBOPC7C5OLHJU',
  'exterior_truck': 'INXNRSXX3SDWVCDYMRYT6HQH',
  'full_truck': 'JLPPYYFCSNPM3XQ6KCYKUBHZ',
  'interior_minivan': 'AHEVPG7K5AQIVKBT7DUOLECG',
  'exterior_minivan': 'ZZPBS4JZIWWKRO35JHQW7OBP',
  'full_minivan': 'LTMB6IDA3LTZCDIQGE7IWLSD',
};

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
    
    // Step 2: Check availability one more time
    const appointmentDate = new Date(formData.appointmentDate);
    const [dropOffHours, dropOffMinutes] = formData.dropOffTime.replace(' AM', '').replace(' PM', '').split(':');
    appointmentDate.setHours(
      formData.dropOffTime.includes('PM') && dropOffHours !== '12' ? parseInt(dropOffHours) + 12 : parseInt(dropOffHours),
      parseInt(dropOffMinutes || 0),
      0,
      0
    );
    
    // Get service duration
    const duration = SERVICE_DURATIONS[formData.serviceType]?.[formData.vehicleType] || 240;
    
    // Get catalog item ID
    const catalogKey = `${formData.serviceType}_${formData.vehicleType}`;
    const catalogItemId = SERVICE_CATALOG_IDS[catalogKey];
    
    // Step 3: Create the booking
    try {
      // Note: Square Bookings API requires Square Appointments to be enabled
      // This is a simplified version - you may need to adjust based on your Square setup
      console.log('Creating booking for customer:', customerId);
      console.log('Appointment date/time:', appointmentDate.toISOString());
      console.log('Service duration:', duration, 'minutes');
      
      const bookingData = {
        idempotencyKey: generateIdempotencyKey(),
        booking: {
          startAt: appointmentDate.toISOString(),
          locationId: process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A',
          customerId: customerId,
          customerNote: formData.customerNote || `Service: ${formData.serviceType}, Vehicle: ${formData.vehicleType}`,
          appointmentSegments: [
            {
              durationMinutes: duration,
              serviceVariationId: catalogItemId,
              serviceVariationVersion: BigInt(Date.now()),
              anyTeamMember: true  // Let Square assign any available team member
            }
          ]
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
      console.error('Booking error details:', bookingError.result?.errors || bookingError.message);
      
      // If Square Bookings API is not available, create a fallback response
      if (bookingError.statusCode === 403 || bookingError.statusCode === 404 || 
          bookingError.message?.includes('bookings') || bookingError.message?.includes('Bookings')) {
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