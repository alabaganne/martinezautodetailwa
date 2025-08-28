'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { validateStep } from '@/lib/utils/validation';

// Simplified Booking Form Data
export interface BookingFormData {
  startAt: string;
  email: string;
  dropOffTime: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor?: string;
  notes?: string;
  serviceVariationId: string;
  paymentToken?: string;
  cardLastFour?: string;
  cardBrand?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface BookingContextType {
  step: number;
  setStep: (step: number) => void;
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  goNext: () => void;
  goBack: () => void;
  updateField: (field: keyof BookingFormData, value: any) => void;
  submitBooking: () => Promise<any>;
  resetForm: () => void;
  isStepValid: () => boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

// Initial form data
const initialFormData: BookingFormData = {
  startAt: '',
  email: '',
  dropOffTime: '8:00 AM',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleColor: '',
  notes: '',
  serviceVariationId: '',
  paymentToken: '',
  cardLastFour: '',
  cardBrand: ''
};

interface BookingProviderProps {
  children: ReactNode;
}

export function BookingProvider({ children }: BookingProviderProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate current step (for navigation)
  const validateCurrentStep = useCallback((): boolean => {
    const validation = validateStep(step, formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [step, formData]);

  // Check if step is valid (for UI display without side effects)
  const isStepValid = useCallback((): boolean => {
    const validation = validateStep(step, formData);
    return validation.isValid;
  }, [step, formData]);

  // Navigate to next step
  const goNext = useCallback(() => {
    if (validateCurrentStep()) {
      // Update formData based on current step before moving to next
      // This ensures formData contains necessary booking data
      
      if (step < 6) {
        setStep(step + 1);
        setValidationErrors({});
      }
    }
  }, [step, validateCurrentStep]);

  // Navigate to previous step
  const goBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      setValidationErrors({});
    }
  }, [step]);

  // Update form field
  const updateField = useCallback((field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [validationErrors]);

  // Submit booking
  const submitBooking = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    console.log('formData', formData);

    try {
      // Create the booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Move to confirmation step
      setStep(6);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateCurrentStep]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setStep(1);
    setValidationErrors({});
    setIsSubmitting(false);
  }, []);

  const value: BookingContextType = {
    step,
    setStep,
    formData,
    setFormData,
    isSubmitting,
    validationErrors,
    goNext,
    goBack,
    updateField,
    submitBooking,
    resetForm,
    isStepValid
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}