'use client'

import React from 'react';
import { Mail, Check } from 'lucide-react';
import { BookingFormData } from '@/contexts/BookingContext';
import { FormInput, FormTextarea } from '@/components/common/FormComponents';

interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isActive?: boolean;
}

const CustomerInfo: React.FC<StepProps> = ({ formData, setFormData }) => {

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
        Your Information
      </h2>
      
      <div className="space-y-6">
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
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200/50">
        <h3 className="font-bold text-blue-800 mb-3 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-2">
            <Check className="w-4 h-4 text-blue-600" />
          </div>
          Why we need this information:
        </h3>
        <ul className="text-sm text-blue-700 space-y-2">
          {[
            'To send you booking confirmation and updates',
            'To contact you if we have questions about your vehicle',
            'To notify you when your car is ready for pickup'
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

export default CustomerInfo;