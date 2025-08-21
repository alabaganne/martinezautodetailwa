// Square API Types - Based on actual Square API structure
export interface SquareBooking {
  id?: string;
  customerId: string;
  startAt: string;
  locationId: string;
  customerNote?: string;
  appointmentSegments: AppointmentSegment[];
  status?: 'ACCEPTED' | 'PENDING' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_SELLER' | 'NO_SHOW';
}

export interface AppointmentSegment {
  durationMinutes: number;
  teamMemberId?: string;
  serviceVariationId?: string;
  serviceVariationVersion?: bigint;
}

export interface SquareCustomer {
  id?: string;
  givenName: string;
  familyName: string;
  emailAddress: string;
  phoneNumber: string;
  referenceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SquareTeamMember {
  id: string;
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
  phoneNumber?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isOwner: boolean;
}

// Simplified Booking Form Data
export interface BookingFormData {
  // Service Selection
  serviceType: string;
  vehicleType: string;
  vehicleCondition: 'normal' | 'very-dirty';
  
  // Schedule
  appointmentDate: string;
  dropOffTime: string;
  
  // Customer Info
  customerName: string;
  email: string;
  phone: string;
  
  // Vehicle Info
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor?: string;
  
  // Additional
  notes?: string;
}

// Catalog Types from Square
export interface SquareCatalogObject {
  type: 'ITEM' | 'CATEGORY' | 'ITEM_VARIATION';
  id: string;
  updatedAt?: string;
  version?: bigint;
  isDeleted?: boolean;
  customAttributeValues?: Record<string, any>;
  catalogV1Ids?: any[];
  presentAtAllLocations?: boolean;
  itemData?: {
    name: string;
    description?: string;
    categoryId?: string;
    variations?: SquareCatalogObject[];
  };
  itemVariationData?: {
    itemId: string;
    name: string;
    priceMoney?: {
      amount: number;
      currency: string;
    };
  };
  categoryData?: {
    name: string;
  };
}

// Simplified Types for UI
export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
}

export interface Vehicle {
  id: string;
  name: string;
  priceMultiplier: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Business Configuration
export interface BusinessConfig {
  operatingDays: number[];
  openTime: string;
  closeTime: string;
  totalDailyHours: number;
}

// Step Component Props
export interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isActive?: boolean;
}

// Validation
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}