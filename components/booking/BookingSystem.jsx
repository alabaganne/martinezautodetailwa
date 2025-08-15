'use client'

import React, { useState } from 'react';
import { Phone, MapPin } from 'lucide-react';
import { initialFormData } from '@/lib/data/constants';
import ProgressBar from '@/components/common/ProgressBar';
import ServiceSelection from './steps/ServiceSelection';
import ScheduleSelection from './steps/ScheduleSelection';
import VehicleInfo from './steps/VehicleInfo';
import ReviewConfirm from './steps/ReviewConfirm';
import Confirmation from './steps/Confirmation';

const BookingSystem = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // In real app, this would call Square API
    setStep(5);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return <ServiceSelection formData={formData} setFormData={setFormData} />;
      case 2:
        return <ScheduleSelection formData={formData} setFormData={setFormData} />;
      case 3:
        return <VehicleInfo formData={formData} setFormData={setFormData} />;
      case 4:
        return <ReviewConfirm formData={formData} />;
      case 5:
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
        {step < 5 && <ProgressBar currentStep={step} />}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          {step < 5 && (
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
                onClick={step === 4 ? handleSubmit : handleNext}
                className="px-6 py-3 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
              >
                {step === 4 ? 'Confirm Booking' : 'Next'}
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