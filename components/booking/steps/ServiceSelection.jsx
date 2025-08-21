'use client'
import React from 'react';
import { Check, CheckCircle, Loader } from 'lucide-react';
import { services, vehicleTypes } from '@/lib/data/constants';
import { displayPrice } from '@/lib/utils/currency';
import { useCatalog } from '@/contexts/CatalogContext';

const ServiceSelection = ({ formData, setFormData }) => {
  const { calculatePrice, getServiceDuration, formatDuration, loading: catalogLoading } = useCatalog();
  
  // Calculate prices for each service type dynamically
  const getServicePrice = (serviceType, vehicleType = 'small') => {
    return calculatePrice(vehicleType, serviceType, false);
  };
  
  // Use catalog data if available, otherwise fall back to local calculations
  const estimatedPrice = formData.serviceType && formData.vehicleType 
    ? calculatePrice(formData.vehicleType, formData.serviceType, formData.vehicleCondition === 'very-dirty')
    : 0;
  
  const duration = formData.serviceType && formData.vehicleType
    ? getServiceDuration(formData.vehicleType, formData.serviceType)
    : 0;
  
  const durationFormatted = duration ? formatDuration(duration) : '';

  return (
    <div className='text-gray-900'>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Your Service</h2>
      
      {catalogLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="animate-spin mr-2" size={24} />
          <span className="text-gray-600">Loading services...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.entries(services).map(([key, service]) => {
            // Get dynamic price from catalog based on selected vehicle type or default to small
            const basePrice = getServicePrice(key, formData.vehicleType || 'small');
            
            return (
              <div
                key={key}
                onClick={() => setFormData({...formData, serviceType: key})}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.serviceType === key
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{service.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <p className="text-gray-600">
                        Starting at {displayPrice(basePrice)}
                        {formData.vehicleType && formData.vehicleType !== 'small' && (
                          <span className="text-xs ml-1">
                            (for {vehicleTypes[formData.vehicleType]?.name})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {formData.serviceType === key && (
                    <Check className="text-blue-600" size={24} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Vehicle Type</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(vehicleTypes).map(([key, type]) => {
            // Show price adjustment for each vehicle type if a service is selected
            const priceAdjustment = formData.serviceType 
              ? calculatePrice(key, formData.serviceType, false) - calculatePrice('small', formData.serviceType, false)
              : 0;
            
            return (
              <button
                key={key}
                onClick={() => setFormData({...formData, vehicleType: key})}
                className={`p-3 rounded-lg border-2 transition-all relative ${
                  formData.vehicleType === key
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>{type.name}</div>
                {formData.serviceType && priceAdjustment > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{displayPrice(priceAdjustment)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {formData.serviceType && formData.vehicleType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Estimated Duration:</span>
            <span className="font-semibold">{durationFormatted}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-700">Estimated Price:</span>
            <span className="font-semibold text-lg">{displayPrice(estimatedPrice)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;
