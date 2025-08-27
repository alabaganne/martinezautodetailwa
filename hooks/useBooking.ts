import { useState, useCallback } from 'react';
import { BookingFormData, ValidationResult } from '@/types';
import { validateStep } from '@/lib/utils/validation';

// Initial form data
const initialFormData: BookingFormData = {
  serviceType: '',
  vehicleType: '',
  vehicleCondition: 'normal',
  appointmentDate: '',
  dropOffTime: '8:00 AM',
  customerName: '',
  phone: '',
  email: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleColor: '',
  notes: ''
};

export const useBooking = () => {
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
    if (validateCurrentStep() && step < 5) {
      setStep(step + 1);
      setValidationErrors({});
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
    try {
      // Create the booking
      const response = await fetch('/api/bookings/create', {
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

  return {
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
};