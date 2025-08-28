import { BookingStatus } from "square/api";

// Admin component types
export interface Booking {
  id: string;
  customerId: string;
  customerName?: string;
  customer: {
    givenName?: string;
    familyName?: string;
    email?: string;
    phone?: string;
  }
  startAt: string;
  locationId: string;
  customerNote?: string;
  status: BookingStatus;
  appointmentSegments?: Array<{
    durationMinutes: number;
    serviceVariationId: string;
  }>;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  serviceType?: string;
  vehicleType?: string;
}