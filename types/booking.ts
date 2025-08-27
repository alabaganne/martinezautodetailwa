export interface Customer {
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
  emailAddress?: string;
}

export interface AppointmentSegment {
  durationMinutes?: number;
  serviceVariationId?: string;
  serviceVariationVersion?: string;
  teamMemberId?: string;
}

export interface Booking {
  id: string;
  startAt: string;
  status: BookingStatus;
  customerId?: string;
  customerNote?: string;
  customer?: Customer;
  appointmentSegments?: AppointmentSegment[];
  locationId?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  allDay?: boolean;
  transitionTimeMinutes?: number;
  creatorDetails?: any;
  source?: string;
  locationType?: string;
}

export enum BookingStatus {
  ACCEPTED = 'ACCEPTED',
  PENDING = 'PENDING',
  DECLINED = 'DECLINED',
  CANCELLED_BY_CUSTOMER = 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_SELLER = 'CANCELLED_BY_SELLER',
  NO_SHOW = 'NO_SHOW'
}

export interface BookingStats {
  total: number;
  today: number;
  pending: number;
  confirmed: number;
}

export type FilterType = 'all' | 'pending' | 'confirmed';

export interface FilterState {
  selectedDate: Date;
  activeStatFilter: FilterType;
  searchQuery: string;
}