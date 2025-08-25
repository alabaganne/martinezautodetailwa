'use client'

import React, { useState } from 'react';
import { StepProps } from '@/types';
import PaymentForm from '../PaymentForm';
import { displayPrice } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/booking';
import { useCatalog } from '@/contexts/CatalogContext';

const SERVICES: Record<string, string> = {
  interior: 'Interior Only',
  exterior: 'Exterior Only',
  full: 'Full Detail'
};

const VEHICLES: Record<string, string> = {
  small: 'Small Car',
  truck: 'Truck',
  minivan: 'Minivan'
};

const PaymentInfo: React.FC<StepProps> = ({ formData, setFormData }) => {
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { calculatePrice, getServiceDuration, formatDuration } = useCatalog();
  
  const estimatedPrice = formData.serviceType && formData.vehicleType 
    ? calculatePrice(formData.vehicleType, formData.serviceType, formData.vehicleCondition === 'very-dirty')
    : 0;
    
  const duration = formData.serviceType && formData.vehicleType
    ? formatDuration(getServiceDuration(formData.vehicleType, formData.serviceType))
    : 'Not selected';

  const handlePaymentComplete = (token: string, verificationToken?: string) => {
    // Store payment tokens in form data
    setFormData({
      ...formData,
      paymentToken: token,
      verificationToken: verificationToken || '',
      paymentAmount: estimatedPrice
    });
    
    // Clear any previous errors
    setPaymentError(null);
  };

  const handlePaymentError = (error: Error) => {
    setPaymentError(error.message);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
        Payment Information
      </h2>
      
      <div className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Booking Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium text-gray-800">
                {formData.serviceType ? SERVICES[formData.serviceType] : 'Not selected'}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-medium text-gray-800">
                {formData.vehicleType ? VEHICLES[formData.vehicleType] : 'Not selected'}
                {formData.vehicleCondition === 'very-dirty' && ' (Very Dirty)'}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-800">
                {formatDate(formData.appointmentDate)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-800">
                {formData.dropOffTime} (Duration: {duration})
              </span>
            </div>
            
            <div className="pt-3 mt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-700">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {displayPrice(estimatedPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg 
              className="w-5 h-5 text-blue-600 mr-3 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Payment Authorization
              </p>
              <p className="text-sm text-blue-700">
                Your card will be authorized for the service amount. The final charge will be processed after service completion.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Error */}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg 
                className="w-5 h-5 text-red-600 mr-3 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium mb-1">
                  Payment Error
                </p>
                <p className="text-sm text-red-700">
                  {paymentError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <div className="mt-6">
          <PaymentForm
            amount={estimatedPrice}
            onPaymentComplete={handlePaymentComplete}
            onError={handlePaymentError}
          />
        </div>

        {/* Success Message */}
        {formData.paymentToken && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg 
                className="w-5 h-5 text-green-600 mr-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <p className="text-sm text-green-800 font-medium">
                Payment authorized successfully! Click Continue to confirm your booking.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentInfo;