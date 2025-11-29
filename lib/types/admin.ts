// BookingStatus enum values from Square API
export const BookingStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_SELLER: 'CANCELLED_BY_SELLER',
  NO_SHOW: 'NO_SHOW'
} as const;

export type BookingStatusType = typeof BookingStatus[keyof typeof BookingStatus];

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
  sellerNote?: string;
  serviceAmount?: {
    amountCents: number;
    currency: string;
  };
  serviceDetails?: {
    serviceName: string | null;
    durationMinutes?: number;
  };
  status: BookingStatusType;
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

export type FilterType = 'all' | 'today' | 'pending' | 'confirmed';

// Appointment-specific types
export type AppointmentFilterOption =
  | 'all'
  | 'no-show-eligible'
  | 'accepted'
  | 'pending'
  | 'cancelled';

export interface AppointmentRowProps {
  booking: Booking;
  onCancel: (bookingId: string, reason: string) => Promise<void>;
  onChargeNoShow: (bookingId: string) => Promise<void>;
  isCharging: boolean;
}

export interface CardInfo {
  brand: string;
  lastFour: string;
}

export interface ChargeNotification {
  type: 'success' | 'error';
  message: string;
}