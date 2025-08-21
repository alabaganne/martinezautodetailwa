import { useState, useEffect, useCallback } from 'react';
import { getDurationInHours } from '@/lib/utils/booking';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

interface DateSlots {
  totalHours: number;
  bookedHours: number;
  remainingHours: number;
}

type DateStatus = 'available' | 'full' | 'weekend' | 'past' | 'loading' | 'closed';

export const useCalendar = (serviceType: string, vehicleType: string, isActive: boolean) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, string[]>>({});
  const [loadingMonths, setLoadingMonths] = useState<Record<string, boolean>>({});
  const [selectedDateSlots, setSelectedDateSlots] = useState<DateSlots | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const getMonthKey = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${year}`;
  };

  const loadMonthAvailability = useCallback(async (monthDate: Date) => {
    const monthKey = getMonthKey(monthDate);
    
    if (availabilityCache[monthKey] !== undefined || loadingMonths[monthKey]) {
      return;
    }
    
    const duration = getDurationInHours(serviceType, vehicleType);
    if (!duration) return;
    
    const month = monthDate.getMonth() + 1;
    const year = monthDate.getFullYear();
    
    setLoadingMonths(prev => ({ ...prev, [monthKey]: true }));
    
    try {
      const response = await fetch(
        `/api/availability?month=${month}&year=${year}&duration=${duration}`
      );
      const availableDates = await response.json();
      
      setAvailabilityCache(prev => ({
        ...prev,
        [monthKey]: Array.isArray(availableDates) ? availableDates : []
      }));
    } catch (error) {
      console.error('Failed to load month availability:', error);
      setAvailabilityCache(prev => ({ ...prev, [monthKey]: [] }));
    } finally {
      setLoadingMonths(prev => {
        const newState = { ...prev };
        delete newState[monthKey];
        return newState;
      });
    }
  }, [serviceType, vehicleType, availabilityCache, loadingMonths]);

  useEffect(() => {
    if (isActive && !hasInitiallyLoaded && serviceType && vehicleType) {
      setHasInitiallyLoaded(true);
      loadMonthAvailability(selectedMonth);
    }
  }, [isActive, serviceType, vehicleType, hasInitiallyLoaded, selectedMonth, loadMonthAvailability]);

  useEffect(() => {
    if (hasInitiallyLoaded && serviceType && vehicleType) {
      loadMonthAvailability(selectedMonth);
    }
  }, [selectedMonth, hasInitiallyLoaded, serviceType, vehicleType, loadMonthAvailability]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const getDaysInMonth = (): CalendarDay[] => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];
    
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getDateStatus = (date: Date): DateStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return 'past';
    if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
    
    const monthKey = getMonthKey(date);
    
    if (loadingMonths[monthKey]) return 'loading';
    
    const availableDates = availabilityCache[monthKey];
    if (!availableDates) return 'closed';
    
    const dateStr = date.toISOString().split('T')[0];
    return availableDates.includes(dateStr) ? 'available' : 'full';
  };

  const selectDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDateSlots({
      totalHours: 9,
      bookedHours: 3,
      remainingHours: 6
    });
    return dateStr;
  };

  const isCurrentMonthLoading = (): boolean => {
    const monthKey = getMonthKey(selectedMonth);
    return loadingMonths[monthKey] || false;
  };

  return {
    selectedMonth,
    selectedDateSlots,
    navigateMonth,
    getDaysInMonth,
    getDateStatus,
    selectDate,
    isCurrentMonthLoading
  };
};