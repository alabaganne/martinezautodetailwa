import { BookingFormData, ValidationResult } from '@/types';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - at least 10 digits
const PHONE_REGEX = /\d{10,}/;

// Validation rules for each step
export const validateStep = (step: number, formData: BookingFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1: // Service Selection
      if (!formData.serviceType) errors.serviceType = 'Please select a service';
      if (!formData.vehicleType) errors.vehicleType = 'Please select vehicle type';
      break;

    case 2: // Schedule Selection
      if (!formData.appointmentDate) errors.appointmentDate = 'Please select a date';
      if (!formData.dropOffTime) errors.dropOffTime = 'Please select drop-off time';
      break;

    case 3: // Customer Info
      if (!formData.customerName?.trim()) {
        errors.customerName = 'Name is required';
      }
      if (!formData.email?.trim()) {
        errors.email = 'Email is required';
      } else if (!EMAIL_REGEX.test(formData.email)) {
        errors.email = 'Please enter a valid email';
      }
      if (!formData.phone?.trim()) {
        errors.phone = 'Phone is required';
      } else if (!PHONE_REGEX.test(formData.phone.replace(/\D/g, ''))) {
        errors.phone = 'Phone must have at least 10 digits';
      }
      break;

    case 4: // Vehicle Info
      if (!formData.vehicleYear?.trim()) errors.vehicleYear = 'Vehicle year is required';
      if (!formData.vehicleMake?.trim()) errors.vehicleMake = 'Vehicle make is required';
      if (!formData.vehicleModel?.trim()) errors.vehicleModel = 'Vehicle model is required';
      break;

    case 5: // Review
      // Validate all previous steps
      const step1 = validateStep(1, formData);
      const step2 = validateStep(2, formData);
      const step3 = validateStep(3, formData);
      const step4 = validateStep(4, formData);
      
      return {
        isValid: step1.isValid && step2.isValid && step3.isValid && step4.isValid,
        errors: { ...step1.errors, ...step2.errors, ...step3.errors, ...step4.errors }
      };

    case 6: // Payment
      // Validate that payment token is present
      if (!formData.paymentToken) errors.paymentToken = 'Payment authorization required';
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Format phone number as user types
export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Validate individual fields
export const validateField = (field: keyof BookingFormData, value: any): string | null => {
  switch (field) {
    case 'email':
      if (!value?.trim()) return 'Email is required';
      if (!EMAIL_REGEX.test(value)) return 'Invalid email format';
      break;
    
    case 'phone':
      if (!value?.trim()) return 'Phone is required';
      const digits = value.replace(/\D/g, '');
      if (digits.length < 10) return 'Phone must have at least 10 digits';
      break;
    
    case 'customerName':
      if (!value?.trim()) return 'Name is required';
      break;
    
    case 'vehicleYear':
      if (!value?.trim()) return 'Year is required';
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        return 'Please enter a valid year';
      }
      break;
  }
  
  return null;
};