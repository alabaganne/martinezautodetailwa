import { useCatalog } from '@/contexts/CatalogContext';
import { useState, useEffect } from 'react';
import { Availability } from 'square/api';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

type DateStatus = 'available' | 'full' | 'weekend' | 'past' | 'loading' | 'closed';

export const useCalendar = (isActive: boolean) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [availability, setAvailability] = useState<String[]>();
  const [loading, setLoading] = useState(false);
  const { selectedService } = useCatalog();

  // Helper function to format date without timezone issues
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load availability for the current month
  useEffect(() => {
    if (!isActive || !selectedService?.serviceVariationId) {
      return;
    }

    const loadAvailability = async () => {
      setLoading(true);
      
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();
      
      try {
        const response = await fetch(
          `/api/bookings/availability/search?month=${month}&year=${year}&serviceVariationId=${selectedService.serviceVariationId}`
        );
        const availability: String[] = await response.json();
        
        // Set the availability array directly
        setAvailability(availability || []);
      } catch (error) {
        console.error('Failed to load availability:', error);
        alert('Failed to load availability');
        setAvailability([]);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [selectedMonth, selectedService, isActive]);

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
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getDateStatus = (date: Date): DateStatus => {
    if (loading) return 'loading';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date <= today) return 'past';
    if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
    
    const dateStr = formatDateKey(date);
    const isAvailable = availability.includes(dateStr);
    
    return isAvailable ? 'available' : 'full';
  };

  const selectDate = (date: Date) => {
    return formatDateKey(date);
    // return availability[formatDateKey(date)].startAt;
  };

  return {
    selectedMonth,
    availability,
    loading,
    navigateMonth,
    getDaysInMonth,
    getDateStatus,
    selectDate,
  };
};