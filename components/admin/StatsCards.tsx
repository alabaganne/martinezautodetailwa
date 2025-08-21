import React from 'react';
import { Calendar, AlertCircle, Check } from 'lucide-react';
import { BookingStats, FilterType } from '@/types/booking';

interface StatsCardsProps {
  stats: BookingStats;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  isLoading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  stats, 
  activeFilter, 
  onFilterChange,
  isLoading = false 
}) => {
  const cards = [
    {
      id: 'all' as FilterType,
      title: 'Total Bookings',
      value: stats.total,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      activeColor: 'border-blue-500 bg-blue-100'
    },
    {
      id: 'pending' as FilterType,
      title: 'Pending',
      value: stats.pending,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      activeColor: 'border-yellow-500 bg-yellow-100'
    },
    {
      id: 'confirmed' as FilterType,
      title: 'Confirmed',
      value: stats.confirmed,
      icon: Check,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      activeColor: 'border-green-500 bg-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        
        return (
          <div
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className={`
              relative overflow-hidden rounded-lg border-2 p-6 
              cursor-pointer transition-all duration-200
              hover:shadow-lg hover:scale-[1.02]
              ${isActive ? card.activeColor : `${card.bgColor} ${card.borderColor}`}
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    card.value
                  )}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg text-white`}>
                <Icon size={24} />
              </div>
            </div>
            
            {isActive && (
              <div className="absolute top-2 right-2">
                <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded-full shadow-sm">
                  Active
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;