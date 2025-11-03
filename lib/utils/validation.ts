import { BookingFormData, ValidationResult } from '@/contexts/BookingContext';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - at least 10 digits
const PHONE_REGEX = /\d{10,}/;

// Validation rules for each step
export const validateStep = (step: number, formData: BookingFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1: // Service Selection
      if (!formData.serviceVariationId) errors.serviceVariationId = 'Please select a service';
      break;

    case 2: // Schedule Selection
      if (!formData.startAt) errors.startAt = 'Please select a date and time';
      if (!formData.dropOffTime) errors.dropOffTime = 'Please select drop-off time';
      break;

    case 3: // Customer Info
      if (!formData.fullName?.trim()) {
        errors.fullName = 'Full name is required';
      }
      if (!formData.email?.trim()) {
        errors.email = 'Email is required';
      } else if (!EMAIL_REGEX.test(formData.email)) {
        errors.email = 'Please enter a valid email';
      }

      const phoneDigits = formData.phone?.replace(/\D/g, '') || '';
      if (!phoneDigits) {
        errors.phone = 'Phone number is required';
      } else if (!PHONE_REGEX.test(phoneDigits)) {
        errors.phone = 'Please enter a valid phone number';
      }
      break;

    case 4: // Vehicle Info
      if (!formData.vehicleYear?.trim()) errors.vehicleYear = 'Vehicle year is required';
      if (!formData.vehicleMake?.trim()) errors.vehicleMake = 'Vehicle make is required';
      if (!formData.vehicleModel?.trim()) errors.vehicleModel = 'Vehicle model is required';
      break;

    case 5: // Payment
      if (!formData.paymentToken) errors.paymentToken = 'Please provide payment information';
      break;

    case 6: // Review
      // Validate all previous steps
      const step1 = validateStep(1, formData);
      const step2 = validateStep(2, formData);
      const step3 = validateStep(3, formData);
      const step4 = validateStep(4, formData);
      const step5 = validateStep(5, formData);
      
      return {
        isValid: step1.isValid && step2.isValid && step3.isValid && step4.isValid && step5.isValid,
        errors: { ...step1.errors, ...step2.errors, ...step3.errors, ...step4.errors, ...step5.errors }
      };
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
    
    case 'vehicleYear':
      if (!value?.trim()) return 'Year is required';
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        return 'Please enter a valid year';
      }
      break;
      
    case 'vehicleMake':
      if (!value?.trim()) return 'Make is required';
      break;
      
    case 'vehicleModel':
      if (!value?.trim()) return 'Model is required';
      break;

    case 'phone': {
      const phoneDigits = typeof value === 'string' ? value.replace(/\D/g, '') : '';
      if (!phoneDigits) return 'Phone number is required';
      if (!PHONE_REGEX.test(phoneDigits)) return 'Invalid phone number';
      break;
    }
    case 'fullName':
      if (!value?.trim()) return 'Full name is required';
      break;
  }
  
  return null;
};
