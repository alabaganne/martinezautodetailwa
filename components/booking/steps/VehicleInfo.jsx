'use client'
import React from 'react';
import { AlertCircle } from 'lucide-react';

const VehicleInfo = ({ formData, setFormData }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Vehicle & Contact Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <h3 className="font-semibold mb-4 text-gray-800">Vehicle Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
          <input
            type="text"
            value={formData.vehicleYear}
            onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="2024"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
          <input
            type="text"
            value={formData.vehicleMake}
            onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Honda"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
          <input
            type="text"
            value={formData.vehicleModel}
            onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Accord"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Condition</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setFormData({...formData, vehicleCondition: 'normal'})}
            className={`p-3 rounded-lg border-2 transition-all ${
              formData.vehicleCondition === 'normal'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setFormData({...formData, vehicleCondition: 'very-dirty'})}
            className={`p-3 rounded-lg border-2 transition-all ${
              formData.vehicleCondition === 'very-dirty'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Very Dirty (+$50)
          </button>
        </div>
        {formData.vehicleCondition === 'very-dirty' && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              Very dirty vehicles may require an extra day to complete
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Any special requests or concerns..."
        />
      </div>
    </div>
  );
};

export default VehicleInfo;
