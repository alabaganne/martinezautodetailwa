import { services, vehicleTypes, serviceDurations } from '../data/constants';

export const getEstimatedPrice = (serviceType, vehicleType, vehicleCondition) => {
  if (!serviceType || !vehicleType) return 0;
  const basePrice = services[serviceType].basePrice;
  const multiplier = vehicleTypes[vehicleType].multiplier;
  const conditionExtra = vehicleCondition === 'very-dirty' ? 50 : 0;
  return Math.round(basePrice * multiplier + conditionExtra);
};

export const getDuration = (serviceType, vehicleType) => {
  if (!serviceType || !vehicleType) return '';
  return serviceDurations[serviceType][vehicleType];
};

export const getMinDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Not selected';
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};