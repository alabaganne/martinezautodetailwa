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
    
    // Check remaining hours - simplified logic
    if (dateAvailability.remainingHours >= 3) return 'available'; // At least 3 hours for minimum service
    return 'full'; // No hours remaining or less than minimum service time
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
                    ${status === 'full' ? 'bg-red-100 text-red-600 cursor-not-allowed line-through' : ''}
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
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span>Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mr-1"></div>
              <span>Closed</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Availability Details */}
      {formData.appointmentDate && selectedDateSlots && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-blue-100/30 rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-blue-300/20 rounded-full blur-3xl"></div>
            
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
              {new Date(formData.appointmentDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            {/* Availability Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Capacity Status</span>
                <span className="text-sm font-bold text-gray-900">
                  {selectedDateSlots.remainingHours} of {selectedDateSlots.totalHours} hours available
                </span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${((selectedDateSlots.totalHours - selectedDateSlots.remainingHours) / selectedDateSlots.totalHours) * 100}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500 drop-shadow-sm">
                    {selectedDateSlots.bookedHours} / {selectedDateSlots.totalHours} hours booked
                  </span>
                </div>
              </div>
            </div>
            
            {/* Drop-off Time Selection Cards */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-800 flex items-center mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                Select Your Drop-off Time
              </label>
              
              <div className="grid gap-3">
                <label className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                  formData.dropOffTime === '8:00 AM' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                } ${selectedDateSlots.remainingHours < 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="dropOffTime"
                    value="8:00 AM"
                    checked={formData.dropOffTime === '8:00 AM'}
                    onChange={() => handleTimeSelect('8:00 AM')}
                    disabled={selectedDateSlots.remainingHours < 3}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className={`font-bold text-lg ${
                        formData.dropOffTime === '8:00 AM' ? 'text-white' : 'text-gray-900'
                      } ${selectedDateSlots.remainingHours < 3 ? 'text-gray-400' : ''}`}>
                        Morning Drop-off
                      </div>
                      <div className={`text-sm mt-1 ${
                        formData.dropOffTime === '8:00 AM' ? 'text-blue-100' : 'text-gray-600'
                      } ${selectedDateSlots.remainingHours < 3 ? 'text-gray-400' : ''}`}>
                        Drop off at 8:00 AM • Same day service
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${
                      formData.dropOffTime === '8:00 AM' ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        formData.dropOffTime === '8:00 AM' ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                  {selectedDateSlots.remainingHours < 3 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                      <span className="text-red-600 font-medium">Not Available</span>
                    </div>
                  )}
                </label>
                
                <label className={`relative flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                  formData.dropOffTime === 'Evening Before' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="dropOffTime"
                    value="Evening Before"
                    checked={formData.dropOffTime === 'Evening Before'}
                    onChange={() => handleTimeSelect('Evening Before')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className={`font-bold text-lg ${
                        formData.dropOffTime === 'Evening Before' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Evening Before
                      </div>
                      <div className={`text-sm mt-1 ${
                        formData.dropOffTime === 'Evening Before' ? 'text-purple-100' : 'text-gray-600'
                      }`}>
                        Drop off the evening before • Convenient timing
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${
                      formData.dropOffTime === 'Evening Before' ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        formData.dropOffTime === 'Evening Before' ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl mr-3">
              <AlertCircle className="text-purple-600" size={20} />
            </div>
            <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Important Information
            </h3>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <div className="mr-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Business Hours</p>
                <p className="text-sm text-gray-600">Open Monday through Friday only</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Drop-off Times</p>
                <p className="text-sm text-gray-600">Vehicles must be given at 8 AM or the evening before</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Pickup Time</p>
                <p className="text-sm text-gray-600">All vehicles ready at 5:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSelection;