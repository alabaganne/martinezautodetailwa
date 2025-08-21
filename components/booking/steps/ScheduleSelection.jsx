'use client'
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

const ScheduleSelection = ({ formData, setFormData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDateSlots, setSelectedDateSlots] = useState(null);
  
  // Get calendar days for the month
  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add padding days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Add padding days from next month
    const endPadding = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };
  
  // Check availability for a specific date
  const checkDateAvailability = async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip if we already have this data
    if (availability[dateStr]) return;
    
    try {
      const response = await fetch(
        `/api/availability?date=${dateStr}&serviceType=${formData.serviceType}&vehicleType=${formData.vehicleType}`
      );
      const data = await response.json();
      
      setAvailability(prev => ({
        ...prev,
        [dateStr]: data
      }));
      
      return data;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return null;
    }
  };
  
  // Load availability for visible dates
  useEffect(() => {
    const loadMonthAvailability = async () => {
      setLoading(true);
      const days = getDaysInMonth().filter(d => d.isCurrentMonth);
      
      // Check availability for all days in the month
      await Promise.all(
        days.map(({ date }) => checkDateAvailability(date))
      );
      
      setLoading(false);
    };
    
    if (formData.serviceType && formData.vehicleType) {
      loadMonthAvailability();
    }
  }, [selectedMonth, formData.serviceType, formData.vehicleType]);
  
  const navigateMonth = (direction) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };
  
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const getDateStatus = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dateAvailability = availability[dateStr];
    
    if (isPastDate(date)) return 'past';
    if (isWeekend(date)) return 'weekend';
    if (!dateAvailability) return 'loading';
    if (!dateAvailability.available) return 'full';
    
    // Check if any slots are available
    const hasAvailableSlots = dateAvailability.slots?.some(slot => slot.available);
    return hasAvailableSlots ? 'available' : 'full';
  };
  
  const handleDateSelect = async (date) => {
    if (isPastDate(date) || isWeekend(date)) return;
    
    const dateStr = date.toISOString().split('T')[0];
    setFormData({ ...formData, appointmentDate: dateStr });
    
    // Load or show slots for this date
    const dateAvailability = availability[dateStr];
    if (dateAvailability) {
      setSelectedDateSlots(dateAvailability);
    } else {
      setLoading(true);
      const data = await checkDateAvailability(date);
      setSelectedDateSlots(data);
      setLoading(false);
    }
  };
  
  const handleTimeSelect = (time) => {
    setFormData({ 
      ...formData, 
      dropOffTime: time,
      dropOffOption: 'same-day' 
    });
  };
  
  const formatMonthYear = () => {
    return selectedMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const isSelectedDate = (date) => {
    if (!formData.appointmentDate) return false;
    return date.toISOString().split('T')[0] === formData.appointmentDate;
  };
  
  if (!formData.serviceType || !formData.vehicleType) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto mb-4 text-amber-500" size={48} />
        <h3 className="text-lg font-semibold mb-2">Please select a service first</h3>
        <p className="text-gray-600">Go back to choose your service type and vehicle</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Schedule Your Appointment</h2>
      
      {/* Custom Calendar */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-semibold">{formatMonthYear()}</h3>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
              <Loader className="animate-spin" size={32} />
            </div>
          )}
          
          {/* Days of week */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map(({ date, isCurrentMonth }, index) => {
              const status = getDateStatus(date);
              const isSelected = isSelectedDate(date);
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={!isCurrentMonth || status === 'past' || status === 'weekend' || status === 'full'}
                  className={`
                    relative p-2 h-12 rounded-lg text-sm font-medium transition-all
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${status === 'past' ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${status === 'weekend' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
                    ${status === 'full' ? 'bg-red-50 text-red-400 cursor-not-allowed line-through' : ''}
                    ${status === 'available' && !isSelected ? 'hover:bg-blue-50 text-gray-700' : ''}
                    ${isSelected ? 'bg-blue-600 text-white' : ''}
                  `}
                >
                  {date.getDate()}
                  {status === 'available' && isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
              <span>Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 rounded-full mr-1"></div>
              <span>Closed</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Slot Selection */}
      {formData.appointmentDate && selectedDateSlots && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline w-4 h-4 mr-1" />
            Select Drop-off Time
          </label>
          <div className="space-y-2">
            {selectedDateSlots.slots?.map((slot) => (
              <button
                key={slot.time}
                onClick={() => handleTimeSelect(`${slot.time} AM`)}
                disabled={!slot.available}
                className={`
                  w-full p-3 rounded-lg border text-left transition-all
                  ${!slot.available ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : ''}
                  ${slot.available && formData.dropOffTime === `${slot.time} AM` 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'hover:bg-gray-50 border-gray-200'}
                `}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{slot.time} AM Drop-off</div>
                    <div className="text-sm text-gray-600">Pick-up at 5:00 PM</div>
                  </div>
                  <div className="text-sm">
                    {slot.available ? (
                      <span className="text-green-600">
                        {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? 's' : ''} left
                      </span>
                    ) : (
                      <span className="text-red-600">Full</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Evening Drop-off Option */}
      {formData.appointmentDate && (
        <div className="mb-6">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="dropoff"
              value="day-before"
              checked={formData.dropOffOption === 'day-before'}
              onChange={(e) => setFormData({
                ...formData, 
                dropOffOption: e.target.value, 
                dropOffTime: 'Evening'
              })}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Evening Before</div>
              <div className="text-sm text-gray-600">
                Drop off the evening before your appointment
              </div>
            </div>
          </label>
        </div>
      )}
      
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start">
          <AlertCircle className="text-amber-600 mt-0.5 mr-2 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Important Information</p>
            <ul className="text-amber-700 mt-1 space-y-1">
              <li>• We're open Monday through Friday only</li>
              <li>• Maximum 3 vehicles serviced at a time</li>
              <li>• All vehicles are picked up at 5:00 PM</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSelection;