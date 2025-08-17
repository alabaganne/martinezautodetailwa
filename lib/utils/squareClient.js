// Square API Client for Next.js Frontend
// This client calls our Next.js API routes which proxy to Square API

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


// API interfaces that call our Next.js backend
export const locationsApi = {
  async listLocations() {
    return callSquareApi('locations');
  }
};

export const customersApi = {
  async listCustomers(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return callSquareApi(`customers${queryParams ? `?${queryParams}` : ''}`);
  },
  
  async createCustomer(customer) {
    return callSquareApi('customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },
  
  async getCustomer(customerId) {
    return callSquareApi(`customers/${customerId}`);
  },
  
  async updateCustomer(customerId, updates) {
    return callSquareApi(`customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  async deleteCustomer(customerId) {
    return callSquareApi(`customers/${customerId}`, {
      method: 'DELETE',
    });
  }
};

export const catalogApi = {
  async listCatalog(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return callSquareApi(`catalog${queryParams ? `?${queryParams}` : ''}`);
  },
  
  async searchCatalog(searchRequest) {
    return callSquareApi('catalog/search', {
      method: 'POST',
      body: JSON.stringify(searchRequest),
    });
  }
};

// Note: Team API is not fully supported in Square SDK v43
// Keeping for future compatibility
export const teamApi = {
  async searchTeamMembers() {
    // This endpoint would need to be implemented separately if needed
    return { 
      result: { 
        teamMembers: [],
        message: 'Team API not available in current implementation' 
      }
    };
  }
};

export const bookingsApi = {
  async listBookings(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return callSquareApi(`bookings${queryParams ? `?${queryParams}` : ''}`);
  },
  
  async createBooking(booking) {
    return callSquareApi('bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  }
};

export const paymentsApi = {
  async listPayments(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return callSquareApi(`payments${queryParams ? `?${queryParams}` : ''}`);
  },
  
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