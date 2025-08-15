// Square configuration module
// Handles environment variables properly for client-side usage in Next.js

// Safe access to process.env with fallbacks
const getEnvVar = (key, defaultValue = '') => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

// These values are injected at build time by Next.js
export const squareConfig = {
  locationId: getEnvVar('NEXT_PUBLIC_SQUARE_LOCATION_ID', ''),
  environment: getEnvVar('NEXT_PUBLIC_SQUARE_ENVIRONMENT', 'sandbox'),
  isProduction: getEnvVar('NEXT_PUBLIC_SQUARE_ENVIRONMENT') === 'production',
  isSandbox: getEnvVar('NEXT_PUBLIC_SQUARE_ENVIRONMENT') !== 'production',
  isDevelopment: getEnvVar('NODE_ENV') === 'development'
};

// Export individual values for convenience
export const getLocationId = () => squareConfig.locationId;
export const getEnvironment = () => squareConfig.environment;
export const isProduction = () => squareConfig.isProduction;
export const isSandbox = () => squareConfig.isSandbox;
export const isDevelopment = () => squareConfig.isDevelopment;