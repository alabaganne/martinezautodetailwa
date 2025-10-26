'use client'

import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { BookingFormData } from '@/contexts/BookingContext';
import { FormInput, FormTextarea } from '@/components/common/FormComponents';
import InfoBox from '@/components/common/InfoBox';
import { formatPhoneNumber } from '@/lib/utils/validation';

interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isActive?: boolean;
}

const CustomerInfo: React.FC<StepProps> = ({ formData, setFormData }) => {

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
        Your Information
      </h2>
      
      <div className="space-y-6">
        <FormInput
          label="Phone Number *"
          icon={Phone}
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
          placeholder="(360) 555-0123"
          helpText="We'll text you updates about your vehicle"
          required
        />

        <FormInput
          label="Email Address *"
          icon={Mail}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com"
          helpText="We'll send your booking confirmation here"
          required
        />

        <FormTextarea
          label="Special Instructions (Optional)"
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any special requests or notes for our team..."
          rows={3}
        />
      </div>

      {/* Info Box */}
      <div className="mt-8">
        <InfoBox 
          title="Why we need this information"
          items={[
            { title: 'To send you booking confirmation and updates' },
            { title: 'To contact you if we have questions about your vehicle' },
            { title: 'To notify you when your car is ready for pickup' },
            { title: 'To send you text reminders about drop-off and pick-up times' }
          ]}
        />
      </div>
    </div>
  );
};

export default CustomerInfo;
