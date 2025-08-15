export const services = {
  interior: { name: 'Interior Only', icon: '🚗', basePrice: 120 },
  exterior: { name: 'Exterior Only', icon: '✨', basePrice: 100 },
  full: { name: 'Full Detail', icon: '💎', basePrice: 200 }
};

export const vehicleTypes = {
  small: { name: 'Small Car', multiplier: 1 },
  truck: { name: 'Truck', multiplier: 1.2 },
  minivan: { name: 'Minivan', multiplier: 1.3 }
};

export const serviceDurations = {
  interior: { small: '3h 30m', truck: '4h 30m', minivan: '5h' },
  exterior: { small: '3h', truck: '3h 30m', minivan: '3h 30m' },
  full: { small: '4h', truck: '5h', minivan: '5h 30m' }
};

export const initialFormData = {
  serviceType: '',
  vehicleType: '',
  appointmentDate: '',
  dropOffOption: 'same-day',
  dropOffTime: '8:00 AM',
  customerName: '',
  phone: '',
  email: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleCondition: 'normal',
  notes: ''
};