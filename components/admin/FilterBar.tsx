'use client';

import React from 'react';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export type DateFilterType = 'all' | 'today' | 'week' | 'custom';

interface FilterBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilterType?: DateFilterType;
  onDateFilterTypeChange?: (type: DateFilterType) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedDate,
  onDateChange,
  searchQuery,
  onSearchChange,
  dateFilterType = 'custom',
  onDateFilterTypeChange
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  };

  const getDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Date Picker Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-gray-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Date Filter</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Date Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onDateChange(addDays(selectedDate, -1));
                  onDateFilterTypeChange?.('custom');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="relative">
                <input
                  type="date"
                  value={getDateInputValue(selectedDate)}
                  onChange={(e) => {
                    handleDateInputChange(e);
                    onDateFilterTypeChange?.('custom');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              
              <button
                onClick={() => {
                  onDateChange(addDays(selectedDate, 1));
                  onDateFilterTypeChange?.('custom');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Next day"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onDateFilterTypeChange?.('all');
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  dateFilterType === 'all'
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => {
                  onDateFilterTypeChange?.('week');
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  dateFilterType === 'week'
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => {
                  onDateChange(addDays(new Date(), -1));
                  onDateFilterTypeChange?.('custom');
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Yesterday
              </button>
              <button
                onClick={() => {
                  onDateChange(new Date());
                  onDateFilterTypeChange?.('today');
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  dateFilterType === 'today'
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  onDateChange(addDays(new Date(), 1));
                  onDateFilterTypeChange?.('custom');
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Tomorrow
              </button>
            </div>
          </div>

          {/* Selected Date Display */}
          <div className="mt-2 text-sm text-gray-600">
            {dateFilterType === 'all' ? (
              <span>Showing <span className="font-semibold">all bookings</span></span>
            ) : dateFilterType === 'week' ? (
              <span>Showing bookings for <span className="font-semibold">this week</span></span>
            ) : dateFilterType === 'today' ? (
              <span>Showing bookings for <span className="font-semibold">today</span></span>
            ) : (
              <span>Showing bookings for: <span className="font-semibold">{formatDate(selectedDate)}</span></span>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="lg:w-80">
          <div className="flex items-center gap-2 mb-3">
            <Search className="text-gray-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Search</span>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;