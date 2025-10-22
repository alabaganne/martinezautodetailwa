export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Not selected';
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const isWeekend = (date: string | Date): boolean => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

export const getMinDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Temporary function that matches the server-cache structure
// This will be replaced with actual API calls
export const getDurationInHours = (serviceType: string, vehicleType: string): number => {
  if (!serviceType || !vehicleType) return 0;
  
  // Default durations matching server-cache.js defaults
  const defaults: Record<string, Record<string, number>> = {
    'interior-detail-service': { 'car': 3.5, 'truck': 4.5, 'suv-mini-van': 5, 'small-truck-suv': 4.5 },
    'exterior-detail-service': { 'car': 3, 'truck': 3.5, 'suv-mini-van': 3.5, 'small-truck-suv': 3.5 },
    'full-detail-package': { 'car': 4, 'truck': 5, 'suv-mini-van': 5.5, 'small-truck-suv': 5 }
  };
  
  return defaults[serviceType]?.[vehicleType] || 4;
};

// Helper to format duration for display
export const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
};
