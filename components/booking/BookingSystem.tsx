'use client'

import React, { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import BookingHeader from './BookingHeader';
import BookingFooter from './BookingFooter';
import ServiceSelection from './steps/ServiceSelection';
import ScheduleSelection from './steps/ScheduleSelection';
import CustomerInfo from './steps/CustomerInfo';
import VehicleInfo from './steps/VehicleInfo';
import Payment from './steps/Payment';
import ReviewConfirm from './steps/ReviewConfirm';
import Confirmation from './steps/Confirmation';

const STEPS = [
  { Component: ServiceSelection, name: 'Service' },
  { Component: ScheduleSelection, name: 'Schedule', props: { isActive: true } },
  { Component: CustomerInfo, name: 'Contact' },
  { Component: VehicleInfo, name: 'Vehicle' },
  { Component: Payment, name: 'Card on File' },
  { Component: ReviewConfirm, name: 'Review' },
  { Component: Confirmation, name: 'Complete' }
];

// Payment-related error patterns that indicate card issues
const CARD_ERROR_PATTERNS = [
  'INVALID_CARD_DATA',
  'card',
  'payment',
  'source_id',
  'CVV',
  'expired'
];

const isCardRelatedError = (errorMessage: string): boolean => {
  const lowerMessage = errorMessage.toLowerCase();
  return CARD_ERROR_PATTERNS.some(pattern => lowerMessage.includes(pattern.toLowerCase()));
};

const BookingSystem: React.FC = () => {
  const {
    step,
    setStep,
    formData,
    setFormData,
    isSubmitting,
    goNext,
    goBack,
    submitBooking,
    resetForm,
    isStepValid
  } = useBooking();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await submitBooking();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create booking';
      
      // Check if this is a card-related error
      if (isCardRelatedError(errorMessage)) {
        setSubmitError('There was an issue with your card. Please re-enter your payment details.');
        // Navigate back to Payment step (step 5)
        setStep(5);
      } else {
        setSubmitError(errorMessage);
      }
    }
  };

  const CurrentStep = STEPS[step - 1].Component;
  const stepProps = STEPS[step - 1].props || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-50/30 to-brand-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <BookingHeader />

        {/* Error Banner */}
        {submitError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-800 font-medium">{submitError}</p>
                <button 
                  onClick={() => setSubmitError(null)}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-gray-200 p-8 md:p-10">
          <CurrentStep
            formData={formData}
            setFormData={setFormData}
            setStep={(newStep: number) => {
              if (newStep === 1) {
                resetForm();
              } else {
                setStep(newStep);
              }
            }}
            {...stepProps}
          />

          {/* Navigation Buttons */}
          {step < 7 && (
            <div className="flex justify-between mt-10 gap-4">
              <button
                onClick={goBack}
                disabled={step === 1}
                className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                  step === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                }`}
              >
                Back
              </button>
              <button
                onClick={step === 6 ? handleSubmit : goNext}
                disabled={!isStepValid() || (step === 6 && isSubmitting)}
                className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                  !isStepValid() || (step === 6 && isSubmitting)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700'
                }`}
              >
                {step === 6 ? (isSubmitting ? 'Processing...' : 'Confirm Booking') : 'Next'}
              </button>
            </div>
          )}
        </div>

        <BookingFooter />
      </div>
    </div>
  );
};

export default BookingSystem;