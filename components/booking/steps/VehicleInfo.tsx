'use client'

import React from 'react';
import { Car, Palette, FileText } from 'lucide-react';
import { BookingFormData } from '@/contexts/BookingContext';

interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isActive?: boolean;
}
import { FormInput, FormTextarea } from '@/components/common/FormComponents';

const VehicleInfo: React.FC<StepProps> = ({ formData, setFormData }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
        Vehicle Information
      </h2>
      
      <div className="space-y-6">
        {/* Vehicle Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Year *"
            type="text"
            value={formData.vehicleYear}
            onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
            placeholder="2024"
            required
          />
          <FormInput
            label="Make *"
            type="text"
            value={formData.vehicleMake}
            onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
            placeholder="Honda"
            required
          />
          <FormInput
            label="Model *"
            type="text"
            value={formData.vehicleModel}
            onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
            placeholder="Accord"
            required
          />
        </div>

        {/* Color */}
        <FormInput
          label="Vehicle Color (Optional)"
          icon={Palette}
          type="text"
          value={formData.vehicleColor || ''}
          onChange={(e) => setFormData({...formData, vehicleColor: e.target.value})}
          placeholder="Silver, Black, White, etc."
        />


        {/* Notes */}
        <FormTextarea
          label="Additional Notes (Optional)"
          icon={FileText}
          value={formData.notes || ''}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Any specific areas that need attention, special requests, or concerns..."
          rows={3}
          helpText="Let us know about any specific requirements for your vehicle"
        />
      </div>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200/50">
        <h3 className="font-bold text-blue-800 mb-3 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-2">
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          Vehicle Information Helps Us:
        </h3>
        <ul className="text-sm text-blue-700 space-y-2">
          {[
            'Prepare the right cleaning products for your vehicle',
            'Allocate appropriate time for the service',
            'Provide accurate pricing estimates'
          ].map((item, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VehicleInfo;