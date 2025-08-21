import { bookingsApi } from '../square/lib/client';

// Business rules
const BUSINESS_RULES = {
  maxConcurrentServices: 3, // 3 bays available
  operatingDays: [1, 2, 3, 4, 5], // Monday to Friday
  dropOffTimes: ['08:00', '09:00'],
  pickupTime: '17:00',
};

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

/**
 * GET /api/availability
 * Check availability for a specific date and service
 * 
 * Query parameters:
 * - date: The date to check (YYYY-MM-DD)
 * - serviceType: Type of service (interior, exterior, full)
 * - vehicleType: Type of vehicle (small, truck, minivan)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceType = searchParams.get('serviceType');
    const vehicleType = searchParams.get('vehicleType');

    if (!date) {
      return Response.json({ error: 'Date is required' }, { status: 400 });
    }

    // Check if date is a weekday
    const checkDate = new Date(date);
    const dayOfWeek = checkDate.getDay();
    
    if (!BUSINESS_RULES.operatingDays.includes(dayOfWeek)) {
      return Response.json({
        available: false,
        reason: 'We are only open Monday through Friday',
        slots: []
      });
    }

    // Get all bookings for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const locationId = process.env.SQUARE_LOCATION_ID || 'LZ2Z250CXVH0A';

    let existingBookings = [];
    
    try {
      const response = await bookingsApi.list(
        100,
        undefined,
        undefined,
        locationId,
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );
      
      existingBookings = response.result?.bookings || [];
    } catch (error) {
      console.log('Square Bookings API not available, using empty bookings list');
      // If Square Bookings API is not available, we'll just use an empty list
      // This allows the system to work even without Square Appointments enabled
    }

    // Calculate availability for each time slot
    const slots = [];
    
    for (const dropOffTime of BUSINESS_RULES.dropOffTimes) {
      // Count bookings that would be active during this slot
      const slotStart = new Date(date);
      const [hours, minutes] = dropOffTime.split(':');
      slotStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const duration = serviceType && vehicleType 
        ? SERVICE_DURATIONS[serviceType]?.[vehicleType] || 240 
        : 240; // Default 4 hours
        
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      
      // Count overlapping bookings
      const overlappingBookings = existingBookings.filter(booking => {
        const bookingStart = new Date(booking.start_at || booking.startAt);
        const bookingDuration = booking.appointment_segments?.[0]?.duration_minutes || 
                              booking.appointmentSegments?.[0]?.durationMinutes || 
                              240;
        const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
        
        // Check if this booking overlaps with our slot
        return (bookingStart < slotEnd && bookingEnd > slotStart);
      });
      
      const available = overlappingBookings.length < BUSINESS_RULES.maxConcurrentServices;
      const spotsLeft = BUSINESS_RULES.maxConcurrentServices - overlappingBookings.length;
      
      slots.push({
        time: dropOffTime,
        available,
        spotsLeft,
        totalSpots: BUSINESS_RULES.maxConcurrentServices
      });
    }
    
    // Check if any slots are available
    const hasAvailability = slots.some(slot => slot.available);
    
    return Response.json({
      date,
      available: hasAvailability,
      slots,
      businessRules: {
        maxConcurrentServices: BUSINESS_RULES.maxConcurrentServices,
        pickupTime: BUSINESS_RULES.pickupTime
      }
    });
    
  } catch (error) {
    console.error('Availability check error:', error);
    return Response.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}