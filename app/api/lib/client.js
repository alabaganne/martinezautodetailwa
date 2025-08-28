import { SquareClient, SquareEnvironment } from 'square';

const accessToken = process.env.SQUARE_ACCESS_TOKEN;

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
export const teamMembersApi = client.teamMembers;

// Cache for location ID to avoid repeated API calls
let cachedLocationId = null;

// Function to get location ID lazily at runtime
export async function getLocationId() {
  if (cachedLocationId) {
    return cachedLocationId;
  }
  
  try {
    const { locations } = await locationsApi.list();
    if (!locations || locations.length === 0) {
      console.error('⚠️ No locations found in your Square account. Please create a location in the Square Dashboard.');
      throw new Error('No Square locations found');
    }
    
    cachedLocationId = locations[0].id;
    return cachedLocationId;
  } catch (error) {
    console.error('Failed to fetch Square location:', error);
    throw error;
  }
}

// Export the full client if needed
export default client;

// Helper function to get environment
export function isSandboxEnvironment() {
  return environment === SquareEnvironment.Sandbox;
}