'use client'
import React from 'react';
import { services, vehicleTypes } from '@/lib/data/constants';
import { getEstimatedPrice, getDuration, formatDate } from '@/lib/utils/booking';
import { displayPrice } from '@/lib/utils/currency';

const ReviewConfirm = ({ formData }) => {
  const estimatedPrice = getEstimatedPrice(formData.serviceType, formData.vehicleType, formData.vehicleCondition);
  const duration = getDuration(formData.serviceType, formData.vehicleType);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Review Your Booking</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Service Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">
                {formData.serviceType ? services[formData.serviceType].name : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-medium">
                {formData.vehicleType ? vehicleTypes[formData.vehicleType].name : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{duration || 'Not selected'}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Schedule</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{formatDate(formData.appointmentDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Drop-off:</span>
              <span className="font-medium">
                {formData.dropOffOption === 'same-day' ? formData.dropOffTime : 'Evening before'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pick-up:</span>
              <span className="font-medium">5:00 PM</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Vehicle Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-medium">{formData.customerName || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-medium">
                {formData.vehicleYear || formData.vehicleMake || formData.vehicleModel ? 
                  `${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel}`.trim() 
                  : 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition:</span>
              <span className="font-medium">
                {formData.vehicleCondition === 'very-dirty' ? 'Very Dirty' : 'Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Total Estimate Section */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Estimate</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">
                      {displayPrice(estimatedPrice > 0 ? estimatedPrice : 0)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-200 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-100">Payment collected after service</p>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                    Cash or Card
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Drop-off Instructions Section */}
        <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-blue-300/30 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center mb-4">
              <h4 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Drop-off Instructions
              </h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="mt-1.5 mr-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">Enter Main Gate</p>
                  <p className="text-sm text-gray-600 mt-0.5">Drive through the main entrance to our facility</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mt-1.5 mr-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">Secure Your Keys</p>
                  <p className="text-sm text-gray-600 mt-0.5">Place your car keys in the designated Key Drop Box</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mt-1.5 mr-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">Pickup Notification</p>
                  <p className="text-sm text-gray-600 mt-0.5">We'll text you when your vehicle is ready at 5:00 PM</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-200/50">
              <p className="text-sm text-gray-700 font-medium flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Need help? Our staff will be there to assist you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewConfirm;
