'use client'
import React from 'react';
import { User, Mail, Phone, CheckCircle, Check } from 'lucide-react';

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
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Your Information</h2>
      
      <div className="space-y-6">
        <div className="group">
          <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.customerName || ''}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            placeholder="John Smith"
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
            required
          />
        </div>

        <div className="group">
          <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="john@example.com"
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
            required
          />
          <p className="text-xs text-gray-500 mt-2 ml-2">We'll send your booking confirmation here</p>
        </div>

        <div className="group">
          <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
            required
          />
          <p className="text-xs text-gray-500 mt-2 ml-2">We'll text you when your car is ready</p>
        </div>

        <div className="group">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Special Instructions (Optional)
          </label>
          <textarea
            value={formData.customerNote || ''}
            onChange={(e) => setFormData({...formData, customerNote: e.target.value})}
            placeholder="Any special requests or notes for our team..."
            rows={3}
            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
          />
        </div>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200/50 shadow-lg">
        <h3 className="font-bold text-blue-800 mb-3 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-2">
            <Check className="w-4 h-4 text-blue-600" />
          </div>
          Why we need this information:
        </h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li className="flex items-start">
            To send you booking confirmation and updates
          </li>
          <li className="flex items-start">
            To contact you if we have questions about your vehicle
          </li>
          <li className="flex items-start">
            To notify you when your car is ready for pickup
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerInfo;