'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
import type { AppointmentFilterOption } from '@/lib/types/admin';

interface AppointmentFiltersProps {
  filter: AppointmentFilterOption;
  onFilterChange: (filter: AppointmentFilterOption) => void;
  noShowEligibleCount: number;
}

/**
 * Filter dropdown for appointments list
 * Displays filter options with counts and handles click-outside
 */
export default function AppointmentFilters({
  filter,
  onFilterChange,
  noShowEligibleCount,
}: AppointmentFiltersProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterLabels: Record<AppointmentFilterOption, string> = {
    all: 'All Appointments',
    'no-show-eligible': 'No-Show Eligible',
    accepted: 'Accepted',
    pending: 'Pending',
    cancelled: 'Cancelled',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter size={16} className="text-gray-500" />
        <span className="text-sm font-medium">{filterLabels[filter]}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          {(Object.keys(filterLabels) as AppointmentFilterOption[]).map((option) => (
            <button
              key={option}
              onClick={() => {
                onFilterChange(option);
                setShowDropdown(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                filter === option ? 'text-brand-600 font-medium' : 'text-gray-700'
              }`}
            >
              {filterLabels[option]}
              {option === 'no-show-eligible' && noShowEligibleCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                  {noShowEligibleCount}
                </span>
              )}
              {filter === option && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
