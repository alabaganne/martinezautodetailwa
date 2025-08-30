'use client'

import React from 'react';
import { Palette, FileText } from 'lucide-react';
import { BookingFormData } from '@/contexts/BookingContext';
import InfoBox from '@/components/common/InfoBox';

interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isActive?: boolean;
}
import { FormInput, FormTextarea } from '@/components/common/FormComponents';

const VehicleInfo: React.FC<StepProps> = ({ formData, setFormData }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
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
      <InfoBox 
        title="Vehicle Information Helps Us"
        items={[
          { title: 'Prepare the right cleaning products for your vehicle' },
          { title: 'Allocate appropriate time for the service' },
          { title: 'Provide accurate pricing estimates' }
        ]}
        className="mt-8"
      />
    </div>
  );
};

export default VehicleInfo;