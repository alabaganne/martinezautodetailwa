'use client'
import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { getMinDate, isWeekend } from '@/lib/utils/booking';

const ScheduleSelection = ({ formData, setFormData }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Schedule Your Appointment</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline w-4 h-4 mr-1" />
          Select Date
        </label>
        <input
          type="date"
          min={getMinDate()}
          value={formData.appointmentDate}
          onChange={(e) => {
            if (!isWeekend(e.target.value)) {
              setFormData({...formData, appointmentDate: e.target.value});
            }
          }}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">We're open Monday through Friday</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="inline w-4 h-4 mr-1" />
          Drop-off Option
        </label>
        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="dropoff"
              value="same-day"
              checked={formData.dropOffOption === 'same-day'}
              onChange={(e) => setFormData({...formData, dropOffOption: e.target.value, dropOffTime: '8:00 AM'})}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Same Day Drop-off</div>
              <div className="text-sm text-gray-600">Drop off at 8:00 AM or 9:00 AM on appointment day</div>
            </div>
          </label>
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="dropoff"
              value="day-before"
              checked={formData.dropOffOption === 'day-before'}
              onChange={(e) => setFormData({...formData, dropOffOption: e.target.value, dropOffTime: 'Evening'})}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Evening Before</div>
              <div className="text-sm text-gray-600">Drop off the evening before your appointment</div>
            </div>
          </label>
        </div>
      </div>

      {formData.dropOffOption === 'same-day' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Drop-off Time</label>
          <select
            value={formData.dropOffTime}
            onChange={(e) => setFormData({...formData, dropOffTime: e.target.value})}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="8:00 AM">8:00 AM</option>
            <option value="9:00 AM">9:00 AM</option>
          </select>
        </div>
      )}

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start">
          <AlertCircle className="text-amber-600 mt-0.5 mr-2 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Pickup Time: Always 5:00 PM</p>
            <p className="text-amber-700 mt-1">Need a different pickup time? Please call us at (555) 123-4567</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSelection;
