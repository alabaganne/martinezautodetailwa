'use client'
import React from 'react';
import { services, vehicleTypes } from '@/lib/data/constants';
import { getEstimatedPrice, getDuration, formatDate } from '@/lib/utils/booking';

const ReviewConfirm = ({ formData }) => {
  const estimatedPrice = getEstimatedPrice(formData.serviceType, formData.vehicleType, formData.vehicleCondition);
  const duration = getDuration(formData.serviceType, formData.vehicleType);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Review Your Booking</h2>
      
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

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-blue-800">Total Estimate:</span>
            <span className="text-2xl font-bold text-blue-800">
              ${estimatedPrice > 0 ? estimatedPrice : 0}
            </span>
          </div>
          {estimatedPrice > 0 && (
            <p className="text-sm text-blue-700 mt-1">Payment collected at pickup</p>
          )}
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2">Drop-off Instructions:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Enter through the main gate</li>
            <li>• Place car keys in the Key Drop Box</li>
            <li>• We'll text you when your car is ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewConfirm;
