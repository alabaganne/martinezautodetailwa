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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50/30 to-blue-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <div className="relative z-10 max-w-2xl mx-auto p-4">
        {/* Enhanced Header */}
        <div className="text-center mb-10 pt-8">
          <div className="inline-block">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-3 tracking-tight">
              Martinez Auto Detail
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4"></div>
          </div>
          <p className="text-gray-700 text-lg font-medium">Professional Car Detailing Services</p>
          <p className="text-gray-500 text-sm mt-2">Book your appointment in just a few steps</p>
        </div>

        {/* Progress Bar */}
        {step < 6 && <ProgressBar currentStep={step} totalSteps={5} />}

        {/* Enhanced Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-blue-100/50 pointer-events-none"></div>
          
          <div className="relative z-10">
            {renderStep()}

            {/* Navigation Buttons */}
            {step < 6 && (
              <div className="flex justify-between mt-10 gap-4">
                <button
                  onClick={handleBack}
                  disabled={step === 1}
                  className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 ${
                    step === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400 shadow-lg hover:shadow-xl'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={step === 5 ? handleSubmit : handleNext}
                  disabled={!isStepValid(step) || (step === 5 && isSubmitting)}
                  className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 ${
                    !isStepValid(step) || (step === 5 && isSubmitting)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {step === 5 ? (isSubmitting ? 'Processing...' : 'Confirm Booking') : 'Next'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="text-center mt-10 text-sm">
          <div className="flex items-center justify-center space-x-6 mb-3">
            <a href="tel:555-123-4567" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group">
              <div className="p-2 bg-blue-100 rounded-lg mr-2 group-hover:bg-blue-200 transition-colors">
                <Phone size={14} className="text-blue-600" />
              </div>
              <span className="font-medium">(555) 123-4567</span>
            </a>
            <a href="#" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group">
              <div className="p-2 bg-blue-100 rounded-lg mr-2 group-hover:bg-blue-200 transition-colors">
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