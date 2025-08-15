import {
  locationsApi,
  customersApi,
  catalogApi,
  bookingsApi,
  teamApi,
  formatSquareError,
  isSandboxMode
} from '@/lib/utils/squareClient';

// Test 1: Verify connection and credentials
export const testConnection = async () => {
  try {
    console.log('Testing Square API connection...');
    console.log('Environment:', isSandboxMode() ? 'Sandbox' : 'Production');
    
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
    
    const response = await locationsApi.retrieveLocation(locationId);
    
    return {
      success: true,
      message: 'Location details retrieved successfully!',
      data: {
        name: response.result.location.name,
        address: response.result.location.address,
        phoneNumber: response.result.location.phoneNumber,
        businessHours: response.result.location.businessHours,
        capabilities: response.result.location.capabilities,
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
      phoneNumber: '+15555551234',
      note: 'Test customer created for API testing'
    };
    
    console.log('Creating test customer...');
    const createResponse = await customersApi.createCustomer(createRequest);
    const customerId = createResponse.result.customer.id;
    
    // Retrieve the customer
    console.log('Retrieving customer:', customerId);
    const retrieveResponse = await customersApi.retrieveCustomer(customerId);
    
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
    console.log('Fetching team members...');
    
    const response = await teamApi.searchTeamMembers({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    });
    
    const teamMembers = response.result.teamMembers || [];
    
    return {
      success: true,
      message: `Found ${teamMembers.length} team members`,
      data: {
        memberCount: teamMembers.length,
        members: teamMembers.slice(0, 5).map(member => ({
          id: member.id,
          name: `${member.givenName || ''} ${member.familyName || ''}`.trim(),
          email: member.emailAddress,
          status: member.status
        }))
      }
    };
  } catch (error) {
    // Team API might not be available in some accounts
    if (error.statusCode === 403) {
      return {
        success: false,
        message: 'Team API not available (may need to upgrade Square account)',
        data: null
      };
    }
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
    
    // Try to list booking profiles
    const response = await bookingsApi.listBookingProfiles(
      undefined, // limit
      undefined, // cursor
      locationId
    );
    
    return {
      success: true,
      message: 'Bookings API is available!',
      data: {
        bookingProfiles: response.result.bookingProfiles?.length || 0,
        errors: response.result.errors
      }
    };
  } catch (error) {
    // Bookings API might require additional setup
    if (error.statusCode === 403 || error.statusCode === 404) {
      return {
        success: false,
        message: 'Bookings API not configured (need to set up in Square dashboard)',
        data: null
      };
    }
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