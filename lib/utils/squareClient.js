// Square API Client for Next.js Frontend
// This client calls our Next.js API routes which proxy to Square API
import { isSandbox as checkIsSandbox } from '@/lib/config/square';

// Helper function to call our API
const callSquareApi = async (endpoint, options = {}) => {
  const response = await fetch(`/api/square/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw data;
  }
  
  return { result: data };
};

// Helper function to format Square API errors
export const formatSquareError = (error) => {
  if (error.errors) {
    return error.errors.map(e => `${e.category}: ${e.detail}`).join(', ') || 'Unknown Square API error';
  }
  return error.message || error.error || 'Unknown error occurred';
};

// Helper to check if we're in sandbox mode
export const isSandboxMode = () => {
  return checkIsSandbox();
};

// API interfaces that call our Next.js backend
export const locationsApi = {
  async listLocations() {
    return callSquareApi('locations');
  },
  
  async retrieveLocation(locationId) {
    return callSquareApi(`locations/${locationId}`);
  }
};

export const customersApi = {
  async createCustomer(customer) {
    return callSquareApi('customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },
  
  async retrieveCustomer(customerId) {
    return callSquareApi(`customers/${customerId}`);
  }
};

export const catalogApi = {
  async listCatalog(cursor, types) {
    const params = new URLSearchParams();
    if (types) params.append('types', types);
    if (cursor) params.append('cursor', cursor);
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return callSquareApi(`catalog/list${query}`);
  }
};

export const teamApi = {
  async searchTeamMembers(searchRequest) {
    return callSquareApi('team-members/search', {
      method: 'POST',
      body: JSON.stringify(searchRequest),
    });
  }
};

export const bookingsApi = {
  async listBookingProfiles(limit, cursor, locationId) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (cursor) params.append('cursor', cursor);
    if (locationId) params.append('location_id', locationId);
    const query = params.toString() ? `?${params.toString()}` : '';
    
    return callSquareApi(`bookings/booking-profiles${query}`);
  },
  
  async createBooking(booking) {
    return callSquareApi('bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }
};

export const paymentsApi = {
  async createPayment(payment) {
    return callSquareApi('payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }
};

export default {
  locationsApi,
  customersApi,
  catalogApi,
  teamApi,
  bookingsApi,
  paymentsApi,
};