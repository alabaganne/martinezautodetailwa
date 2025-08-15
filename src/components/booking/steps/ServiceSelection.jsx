import React from 'react';
import { CheckCircle } from 'lucide-react';
import { services, vehicleTypes } from '../../../data/constants';
import { getEstimatedPrice, getDuration } from '../../../utils/booking';

const ServiceSelection = ({ formData, setFormData }) => {
  const estimatedPrice = getEstimatedPrice(formData.serviceType, formData.vehicleType, formData.vehicleCondition);
  const duration = getDuration(formData.serviceType, formData.vehicleType);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Your Service</h2>
      <div className="grid gap-4">
        {Object.entries(services).map(([key, service]) => (
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
                  <p className="text-gray-600">Starting at ${service.basePrice}</p>
                </div>
              </div>
              {formData.serviceType === key && (
                <CheckCircle className="text-blue-600" size={24} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Vehicle Type</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(vehicleTypes).map(([key, type]) => (
            <button
              key={key}
              onClick={() => setFormData({...formData, vehicleType: key})}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.vehicleType === key
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {formData.serviceType && formData.vehicleType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Estimated Duration:</span>
            <span className="font-semibold">{duration}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-700">Estimated Price:</span>
            <span className="font-semibold text-lg">${estimatedPrice}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;