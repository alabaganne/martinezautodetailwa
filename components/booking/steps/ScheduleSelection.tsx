'use client'

import React from 'react';
import { Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { BookingFormData } from '@/contexts/BookingContext';

interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isActive?: boolean;
}
import { useCalendar } from '@/hooks/useCalendar';
import { FormRadioGroup } from '@/components/common/FormComponents';

const DATE_STATUS_STYLES = {
  available: 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer',
  full: 'bg-red-100 text-red-700 cursor-not-allowed',
  weekend: 'bg-gray-100 text-gray-400 cursor-not-allowed',
  past: 'bg-gray-50 text-gray-300 cursor-not-allowed',
  loading: 'bg-gray-50 text-gray-400 cursor-wait',
  closed: 'bg-gray-100 text-gray-400 cursor-not-allowed'
};

const DATE_STATUS_DOTS = {
  available: 'bg-green-500',
  full: 'bg-red-500',
  closed: 'bg-gray-300'
};

const TIME_OPTIONS = [
  { value: '8:00 AM', label: 'Morning Drop-off', description: 'Drop your car at 8:00 AM' },
  { value: 'Evening Before', label: 'Evening Before', description: 'Drop your car the evening before' }
];

const ScheduleSelection: React.FC<StepProps> = ({ formData, setFormData, isActive = false }) => {
  const {
    selectedMonth,
    navigateMonth,
    getDaysInMonth,
    getDateStatus,
    selectDate,
    loading
  } = useCalendar(isActive);

  if (!formData.serviceVariationId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">Please select a service and vehicle type first</p>
      </div>
    );
  }

  const handleDateSelect = (date: Date) => {
    const status = getDateStatus(date);
    if (status === 'available') {
      const dateStr = selectDate(date);
      console.log('dateStr', dateStr);
      setFormData({ ...formData, startAt: dateStr });
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
        Select Date & Time
      </h2>
      
      {/* Calendar */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigateMonth(-1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800">
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            {loading && (
              <div className="flex items-center justify-center mt-2">
                <Loader className="animate-spin mr-2" size={16} />
                <span className="text-sm text-gray-500">Loading availability...</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigateMonth(1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
          
          {getDaysInMonth().map((dayInfo, index) => {
            const status = dayInfo.isCurrentMonth ? getDateStatus(dayInfo.date) : 'past';
            const year = dayInfo.date.getFullYear();
            const month = String(dayInfo.date.getMonth() + 1).padStart(2, '0');
            const day = String(dayInfo.date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            const isSelected = formData.startAt === dateKey;
            
            return (
              <div
                key={index}
                onClick={() => dayInfo.isCurrentMonth && handleDateSelect(dayInfo.date)}
                className={`
                  relative p-3 rounded-lg text-center transition-all duration-200
                  ${dayInfo.isCurrentMonth ? '' : 'opacity-30'}
                  ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                  ${DATE_STATUS_STYLES[status]}
                `}
              >
                <span className="text-sm font-medium">{dayInfo.date.getDate()}</span>
                {dayInfo.isCurrentMonth && status !== 'past' && status !== 'weekend' && (
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                    DATE_STATUS_DOTS[status as keyof typeof DATE_STATUS_DOTS] || 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs">
          {[
            { color: 'bg-green-500', label: 'Available' },
            { color: 'bg-red-500', label: 'Full' },
            { color: 'bg-gray-300', label: 'Closed' }
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${color} rounded-full`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Time Selection */}
      {formData.startAt && (
        <div className="mt-6 animate-fadeIn">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-blue-100/30 rounded-2xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
              {new Date(formData.startAt).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <FormRadioGroup
              label="Select Your Drop-off Time"
              icon={Clock}
              value={formData.dropOffTime || ''}
              onChange={(value) => setFormData({ ...formData, dropOffTime: value })}
              options={TIME_OPTIONS}
            />
          </div>
        </div>
      )}
      
      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200/50 mt-6">
        <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Important Information
        </h3>
        <div className="grid gap-3">
          {[
            { title: 'Business Hours', desc: 'Open Monday through Friday only' },
            { title: 'Drop-off Times', desc: 'Vehicles must be given at 8 AM or the evening before' },
            { title: 'Pickup Time', desc: 'All vehicles ready at 5:00 PM' }
          ].map((info, idx) => (
            <div key={idx} className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
              <div>
                <p className="text-gray-700 font-medium">{info.title}</p>
                <p className="text-sm text-gray-600">{info.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleSelection;