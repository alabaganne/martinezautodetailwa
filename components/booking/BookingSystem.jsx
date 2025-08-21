'use client'

import React, { useState } from 'react';
import { Phone, MapPin } from 'lucide-react';
import { initialFormData } from '@/lib/data/constants';
import ProgressBar from '@/components/common/ProgressBar';
import ServiceSelection from './steps/ServiceSelection';
import ScheduleSelection from './steps/ScheduleSelection';
import CustomerInfo from './steps/CustomerInfo';
import VehicleInfo from './steps/VehicleInfo';
import ReviewConfirm from './steps/ReviewConfirm';
import Confirmation from './steps/Confirmation';

const BookingSystem = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions for each step
  const isStepValid = (stepNumber) => {
    switch(stepNumber) {
      case 1: // Service selection
        return formData.serviceType && formData.vehicleType;
      
      case 2: // Schedule selection
        return formData.appointmentDate && formData.dropOffTime;
      
      case 3: // Customer info
        return formData.customerName && 
               formData.email && 
               formData.phone &&
               formData.email.includes('@') &&
               formData.phone.length >= 10;
      
      case 4: // Vehicle info
        return formData.vehicleMake && 
               formData.vehicleModel && 
               formData.vehicleYear;
      
      case 5: // Review - all previous steps must be valid
        return isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4);
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    // Only allow next if current step is valid
    if (isStepValid(step) && step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Prevent submission if form is not valid
    if (!isStepValid(5)) {
      alert('Please complete all required fields before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the booking through API
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const result = await response.json();
      
      // Store booking details for confirmation page
      setFormData({
        ...formData,
        bookingId: result.booking.id,
        confirmationNumber: result.booking.id.slice(-6).toUpperCase()
      });
      
      // Move to confirmation page
      setStep(6);
    } catch (error) {
      console.error('Booking failed:', error);
      alert(`Failed to create booking: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return <ServiceSelection formData={formData} setFormData={setFormData} />;
      case 2:
        return <ScheduleSelection formData={formData} setFormData={setFormData} />;
      case 3:
        return <CustomerInfo formData={formData} setFormData={setFormData} />;
      case 4:
        return <VehicleInfo formData={formData} setFormData={setFormData} />;
      case 5:
        return <ReviewConfirm formData={formData} />;
      case 6:
        return <Confirmation formData={formData} setFormData={setFormData} setStep={setStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Martinez Auto Detail</h1>
          <p className="text-gray-600">Professional Car Detailing Services</p>
        </div>

        {/* Progress Bar */}
        {step < 6 && <ProgressBar currentStep={step} totalSteps={5} />}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          {step < 6 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  step === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back
              </button>
              <button
                onClick={step === 5 ? handleSubmit : handleNext}
                disabled={!isStepValid(step) || (step === 5 && isSubmitting)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  !isStepValid(step) || (step === 5 && isSubmitting)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {step === 5 ? (isSubmitting ? 'Processing...' : 'Confirm Booking') : 'Next'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <a href="#" className="flex items-center hover:text-gray-800">
              <Phone size={16} className="mr-1" />
              (555) 123-4567
            </a>
            <span>•</span>
            <a href="#" className="flex items-center hover:text-gray-800">
              <MapPin size={16} className="mr-1" />
              123 Main St, City, ST 12345
            </a>
          </div>
          <p>© 2024 Martinez Auto Detail. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingSystem;