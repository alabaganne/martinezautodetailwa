import React from 'react';
import { Calendar } from 'lucide-react';
import { FilterType } from '@/lib/types/admin';

interface EmptyStateProps {
  searchQuery: string;
  activeFilter: FilterType;
  selectedDate: Date;
  onClearFilters: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  activeFilter,
  selectedDate,
  onClearFilters
}) => {
  const getEmptyMessage = () => {
    if (searchQuery) {
      return `No bookings match your search "${searchQuery}"`;
    }
    
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'pending':
          return "No pending bookings";
        case 'confirmed':
          return "No confirmed bookings";
        default:
          return "No bookings found";
      }
    }
    
    return `No bookings scheduled for ${selectedDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4 flex items-center justify-center">
          <Calendar size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-500 mb-6">
          {getEmptyMessage()}
        </p>
        {(activeFilter !== 'all' || searchQuery) && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;