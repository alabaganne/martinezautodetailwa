'use client'

import React from 'react';
import { Phone, MapPin } from 'lucide-react';
import { useBooking } from '@/hooks/useBooking';
import ProgressBar from '@/components/common/ProgressBar';
import ServiceSelection from './steps/ServiceSelection';
import ScheduleSelection from './steps/ScheduleSelection';
import CustomerInfo from './steps/CustomerInfo';
import VehicleInfo from './steps/VehicleInfo';
import ReviewConfirm from './steps/ReviewConfirm';
import Confirmation from './steps/Confirmation';

const STEPS = [
  { Component: ServiceSelection, name: 'Service' },
  { Component: ScheduleSelection, name: 'Schedule', props: { isActive: true } },
  { Component: CustomerInfo, name: 'Contact' },
  { Component: VehicleInfo, name: 'Vehicle' },
  { Component: ReviewConfirm, name: 'Confirm' },
  { Component: Confirmation, name: 'Complete' }
];

const BookingSystem: React.FC = () => {
  const {
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
  } = useBooking();

  const handleSubmit = async () => {
    try {
      await submitBooking();
    } catch (error: any) {
      alert(`Failed to create booking: ${error.message}`);
    }
  };

  const CurrentStep = STEPS[step - 1].Component;
  const stepProps = STEPS[step - 1].props || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50/30 to-blue-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
            Martinez Auto Detail
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4" />
          <p className="text-gray-700 text-lg font-medium">Professional Car Detailing Services</p>
        </div>

        {/* Progress Bar */}
        {step < 6 && <ProgressBar currentStep={step} totalSteps={5} />}

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
          {step < 6 && (
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
                onClick={step === 5 ? handleSubmit : goNext}
                disabled={!isStepValid() || (step === 5 && isSubmitting)}
                className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                  !isStepValid() || (step === 5 && isSubmitting)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {step === 5 ? (isSubmitting ? 'Processing...' : 'Confirm Booking') : 'Next'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-sm">
          <div className="flex items-center justify-center space-x-6 mb-3">
            <a href="tel:555-123-4567" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors group">
              <div className="p-2 bg-blue-100 rounded-lg mr-2 group-hover:bg-blue-200">
                <Phone size={14} className="text-blue-600" />
              </div>
              <span className="font-medium">(555) 123-4567</span>
            </a>
            <a href="#" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors group">
              <div className="p-2 bg-blue-100 rounded-lg mr-2 group-hover:bg-blue-200">
                <MapPin size={14} className="text-blue-600" />
              </div>
              <span className="font-medium">123 Main St, City, ST 12345</span>
            </a>
          </div>
          <p className="text-gray-500">© 2024 Martinez Auto Detail. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingSystem;