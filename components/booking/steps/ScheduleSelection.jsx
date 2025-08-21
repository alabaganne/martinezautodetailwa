'use client'
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

const ScheduleSelection = ({ formData, setFormData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthAvailability, setMonthAvailability] = useState({});
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
  
  // Load availability for the entire month
  const loadMonthAvailability = async () => {
    const month = selectedMonth.getMonth() + 1; // JavaScript months are 0-indexed
    const year = selectedMonth.getFullYear();
    
    try {
      const response = await fetch(
        `/api/availability?month=${month}&year=${year}`
      );
      const data = await response.json();
      
      setMonthAvailability(data);
      return data;
    } catch (error) {
      console.error('Failed to load month availability:', error);
      return {};
    }
  };
  
  // Load availability when month changes
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      await loadMonthAvailability();
      setLoading(false);
    };
    
    fetchAvailability();
  }, [selectedMonth]);
  
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
    const dateAvailability = monthAvailability[dateStr];
    
    if (isPastDate(date)) return 'past';
    if (isWeekend(date)) return 'weekend';
    if (!dateAvailability) return 'closed'; // Not a business day
    
    // Check remaining hours
    if (dateAvailability.remainingHours >= 3) return 'available'; // At least 3 hours for minimum service
    if (dateAvailability.remainingHours > 0) return 'limited'; // Some availability but limited
    return 'full'; // No hours remaining
  };
  
  const handleDateSelect = (date) => {
    if (isPastDate(date) || isWeekend(date)) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const dateAvailability = monthAvailability[dateStr];
    
    if (!dateAvailability || !dateAvailability.available) return;
    
    setFormData({ ...formData, appointmentDate: dateStr });
    setSelectedDateSlots(dateAvailability);
  };
  
  const handleTimeSelect = (time) => {
    setFormData({ 
      ...formData, 
      dropOffTime: time
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
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-2">
              <Loader className="animate-spin mr-2" size={20} />
              <span className="text-sm text-gray-500">Loading availability...</span>
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
                  disabled={!isCurrentMonth || status === 'past' || status === 'weekend' || status === 'closed' || status === 'full'}
                  className={`
                    relative p-2 h-12 rounded-lg text-sm font-medium transition-all
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${status === 'past' ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${status === 'weekend' || status === 'closed' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
                    ${status === 'full' ? 'bg-red-50 text-red-400 cursor-not-allowed line-through' : ''}
                    ${status === 'limited' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : ''}
                    ${status === 'available' && !isSelected ? 'hover:bg-blue-50 text-gray-700' : ''}
                    ${isSelected ? 'bg-blue-600 text-white' : ''}
                  `}
                >
                  {date.getDate()}
                  {status === 'available' && isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                  )}
                  {status === 'limited' && isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full"></div>
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
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
              <span>Limited</span>
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
      
      {/* Availability Details */}
      {formData.appointmentDate && selectedDateSlots && (
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold mb-3">
              Availability for {new Date(formData.appointmentDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Total Daily Capacity</span>
                <span className="font-medium">{selectedDateSlots.totalHours} hours</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Hours Booked</span>
                <span className="font-medium text-blue-600">{selectedDateSlots.bookedHours} hours</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Hours Available</span>
                <span className={`font-medium ${
                  selectedDateSlots.remainingHours >= 5 ? 'text-green-600' : 
                  selectedDateSlots.remainingHours > 0 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {selectedDateSlots.remainingHours} hours
                </span>
              </div>
            </div>
            
            {/* Drop-off Time Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Clock className="inline w-4 h-4 mr-1" />
                Select Drop-off Time
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="dropOffTime"
                    value="8:00 AM"
                    checked={formData.dropOffTime === '8:00 AM'}
                    onChange={() => handleTimeSelect('8:00 AM')}
                    disabled={selectedDateSlots.remainingHours < 3}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className={`font-medium ${selectedDateSlots.remainingHours < 3 ? 'text-gray-400' : 'text-gray-900'}`}>
                      Morning Drop-off
                    </div>
                    <div className={`text-sm ${selectedDateSlots.remainingHours < 3 ? 'text-gray-400' : 'text-gray-600'}`}>
                      Drop off at 8:00 AM on your appointment day
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="dropOffTime"
                    value="Evening Before"
                    checked={formData.dropOffTime === 'Evening Before'}
                    onChange={() => handleTimeSelect('Evening Before')}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Evening Before
                    </div>
                    <div className="text-sm text-gray-600">
                      Drop off the evening before your appointment
                    </div>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">All vehicles are ready for pickup at 5:00 PM</p>
            </div>
          </div>
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