'use client'
import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

const CustomerInfo = ({ formData, setFormData }) => {
  const handlePhoneChange = (e) => {
    // Basic phone formatting
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 3) {
        value = value;
      } else if (value.length <= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      }
    }
    setFormData({ ...formData, phone: value });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Information</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Full Name *
          </label>
          <input
            type="text"
            value={formData.customerName || ''}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            placeholder="John Smith"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="inline w-4 h-4 mr-1" />
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="john@example.com"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">We'll send your booking confirmation here</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline w-4 h-4 mr-1" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">We'll text you when your car is ready</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            value={formData.customerNote || ''}
            onChange={(e) => setFormData({...formData, customerNote: e.target.value})}
            placeholder="Any special requests or notes for our team..."
            rows={3}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Why we need this information:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• To send you booking confirmation and updates</li>
          <li>• To contact you if we have questions about your vehicle</li>
          <li>• To notify you when your car is ready for pickup</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerInfo;