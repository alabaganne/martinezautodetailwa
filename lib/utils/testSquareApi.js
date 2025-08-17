import {
  locationsApi,
  customersApi,
  catalogApi,
  formatSquareError
} from '@/lib/utils/squareClient';

// Test 1: Verify connection and credentials
export const testConnection = async () => {
  try {
    console.log('Testing Square API connection...');
    
    // Try to list locations - this is a basic API call that verifies credentials
    const response = await locationsApi.listLocations();
    
    if (response.result.locations && response.result.locations.length > 0) {
      const location = response.result.locations[0];
      return {
        success: true,
        message: 'Successfully connected to Square API!',
        data: {
          locationName: location.name,
          locationId: location.id,
          businessName: location.businessName,
          status: location.status,
          currency: location.currency,
        }
      };
    }
    
    return {
      success: false,
      message: 'Connected but no locations found',
      data: null
    };
  } catch (error) {
    return {
      success: false,
      message: formatSquareError(error),
      data: null
    };
  }
};

// Test 2: Fetch location details
export const testLocationDetails = async (locationId) => {
  try {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    console.log('Fetching location details for:', locationId);
    
    // Getting individual location details returns 403 in sandbox
    // So we'll get the location from the list instead
    const listResponse = await locationsApi.listLocations();
    const location = listResponse.result.locations?.find(loc => loc.id === locationId);
    
    if (!location) {
      throw new Error('Location not found');
    }
    
    return {
      success: true,
      message: 'Location details retrieved successfully!',
      data: {
        name: location.name,
        address: location.address,
        phoneNumber: location.phoneNumber,
        businessHours: location.businessHours,
        capabilities: location.capabilities,
      }
    };
  } catch (error) {
    return {
      success: false,
      message: formatSquareError(error),
      data: null
    };
  }
};

// Test 3: Create and retrieve a test customer
export const testCustomerOperations = async () => {
  try {
    // Create a test customer
    const createRequest = {
      givenName: 'Test',
      familyName: 'Customer',
      emailAddress: `test${Date.now()}@example.com`,
      // Remove phone number as it's causing validation issues
      phoneNumber: "+1-212-555-4240",
      note: 'Test customer created for API testing'
    };
    
    console.log('Creating test customer...');
    const createResponse = await customersApi.createCustomer(createRequest);
    console.log('Customer created:', createResponse);
    
    const customerId = createResponse.result.customer.id;
    
    // Retrieve the customer
    console.log('Retrieving customer:', customerId);
    const retrieveResponse = await customersApi.getCustomer(customerId);
    
    return {
      success: true,
      message: 'Customer operations successful!',
      data: {
        customerId: retrieveResponse.result.customer.id,
        email: retrieveResponse.result.customer.emailAddress,
        name: `${retrieveResponse.result.customer.givenName} ${retrieveResponse.result.customer.familyName}`,
        createdAt: retrieveResponse.result.customer.createdAt,
      }
    };
  } catch (error) {
    return {
      success: false,
      message: formatSquareError(error),
      data: null
    };
  }
};

// Test 4: List catalog items (services)
export const testCatalogItems = async () => {
  try {
    console.log('Fetching catalog items...');
    
    const response = await catalogApi.listCatalog(
      undefined, // cursor
      'ITEM' // types
    );
    
    const items = response.result.objects || [];
    
    return {
      success: true,
      message: `Found ${items.length} catalog items`,
      data: {
        itemCount: items.length,
        items: items.slice(0, 5).map(item => ({
          id: item.id,
          name: item.itemData?.name,
          description: item.itemData?.description,
          variations: item.itemData?.variations?.length || 0
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: formatSquareError(error),
      data: null
    };
  }
};

// Test 5: Check team members (for bookings)
export const testTeamMembers = async (locationId) => {
  try {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    console.log('Checking team members API...');
    
    // Team search API is not available in SDK v43
    // Return a message indicating this limitation
    return {
      success: false,
      message: 'Team member search not available in current SDK version - requires Square API update',
      data: {
        note: 'Team functionality requires Square Appointments or higher tier plan'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: formatSquareError(error),
      data: null
    };
  }
};

// Test 6: Check bookings availability
export const testBookingsApi = async (locationId) => {
  try {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    console.log('Testing Bookings API availability...');
    
    // Bookings API requires additional setup in Square dashboard
    return {
      success: false,
      message: 'Bookings API requires setup in Square dashboard - Appointments feature needed',
      data: {
        note: 'To enable bookings: 1) Enable Square Appointments, 2) Set up staff members, 3) Configure services'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: formatSquareError(error),
      data: null
    };
  }
};

// Run all tests
export const runAllTests = async (locationId) => {
  const tests = [
    { name: 'Connection', fn: testConnection },
    { name: 'Location Details', fn: () => testLocationDetails(locationId) },
    { name: 'Customer Operations', fn: testCustomerOperations },
    { name: 'Catalog Items', fn: testCatalogItems },
    { name: 'Team Members', fn: () => testTeamMembers(locationId) },
    { name: 'Bookings API', fn: () => testBookingsApi(locationId) },
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`Running test: ${test.name}`);
    const result = await test.fn();
    results.push({
      testName: test.name,
      ...result
    });
  }
  
  return results;
};