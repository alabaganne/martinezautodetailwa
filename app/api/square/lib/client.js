import { SquareClient, SquareEnvironment } from 'square';

const accessToken = process.env.SQUARE_ACCESS_TOKEN;

console.log('Square Access Token:', accessToken);

if (!accessToken) {
  throw new Error('SQUARE_ACCESS_TOKEN environment variable is not set');
}

// Determine environment based on token prefix
// Sandbox tokens typically start with 'EAAA'
const environment = accessToken.startsWith('EAAA') 
  ? SquareEnvironment.Sandbox 
  : SquareEnvironment.Production;

// Set Square credentials
const config = {
  token: accessToken,
  environment,
  userAgentDetail: 'car-wash-appointments'
};

// Create a single client instance
const client = new SquareClient(config);

// Export the API instances we use
export const bookingsApi = client.bookings;
export const catalogApi = client.catalog;
export const customersApi = client.customers;
export const locationsApi = client.locations;
export const paymentsApi = client.payments;
export const teamApi = client.team;

// Export the full client if needed
export default client;

// Helper function to get environment
export function isSandboxEnvironment() {
  return environment === SquareEnvironment.Sandbox;
}