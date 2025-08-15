// Environment configuration
export const config = {
  square: {
    appId: import.meta.env.VITE_SQUARE_APP_ID || '',
    locationId: import.meta.env.VITE_SQUARE_LOCATION_ID || '',
    environment: import.meta.env.VITE_SQUARE_ENVIRONMENT || 'sandbox',
  },
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  },
  features: {
    payments: import.meta.env.VITE_ENABLE_PAYMENTS === 'true',
    smsNotifications: import.meta.env.VITE_ENABLE_SMS_NOTIFICATIONS === 'true',
  },
};

// Helper to check if in production
export const isProduction = import.meta.env.PROD;

// Helper to check if in development
export const isDevelopment = import.meta.env.DEV;