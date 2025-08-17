# Square API Integration Guide for Car Wash Booking System

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Environments](#environments)
- [Core APIs](#core-apis)
- [Catalog Structure](#catalog-structure)
- [Implementation Best Practices](#implementation-best-practices)
- [Car Wash Specific Examples](#car-wash-specific-examples)

## Overview

Square API provides a comprehensive platform for managing bookings, payments, and catalog items. This guide focuses on implementing a car wash booking system using Square's Catalog and Bookings APIs with Square SDK v43.

## Authentication

### Access Token
Square uses OAuth 2.0 bearer tokens for API authentication.

```javascript
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production, // or SquareEnvironment.Sandbox
  userAgentDetail: 'car-wash-booking-system'
});
```

### Token Types
- **Sandbox Tokens**: Start with `EAAA` - for testing
- **Production Tokens**: For live transactions

## Environments

### Sandbox Environment
- Base URL: `https://connect.squareupsandbox.com`
- Dashboard: `https://squareupsandbox.com/dashboard`
- Use for development and testing
- No real money transactions

### Production Environment
- Base URL: `https://connect.squareup.com`
- Dashboard: `https://squareup.com/dashboard`
- Live transactions with real customers

### Environment Detection
```javascript
// Automatic environment detection based on token
const environment = accessToken.startsWith('EAAA') 
  ? SquareEnvironment.Sandbox 
  : SquareEnvironment.Production;
```

## Core APIs

### 1. Locations API
Retrieve business locations for multi-location support.

```javascript
// List locations - returns data directly (no .result wrapper)
const response = await client.locations.list();
const locations = response.locations; // Direct access
const location = locations[0];

// Response structure
{
  "locations": [
    {
      "id": "LGWK1MZK9Z7HD",
      "name": "Car Wash",
      "currency": "USD",
      "timezone": "America/Los_Angeles",
      "capabilities": ["CREDIT_CARD_PROCESSING"],
      "status": "ACTIVE",
      // ... other fields
    }
  ]
}
```

### 2. Catalog API
Manages service items, variations, and categories.

#### Key Objects:
- **Category**: Groups related items (e.g., "Small Car", "Truck")
- **Item**: A service offering (e.g., "Interior Cleaning")
- **ItemVariation**: Pricing options (e.g., "Normal", "Very Dirty")

#### Batch Upsert (Creating/Updating):
```javascript
// Note: Method is batchUpsert, not batchUpsertCatalogObjects
const response = await client.catalog.batchUpsert({
  idempotencyKey: crypto.randomUUID(),
  batches: [{
    objects: [
      {
        type: "CATEGORY",
        id: "#SMALL_CAR",
        presentAtAllLocations: true,
        categoryData: {
          name: "Small Car"
        }
      },
      {
        type: "ITEM",
        id: "#SmallCarInterior",
        presentAtAllLocations: true,
        itemData: {
          name: "Small Car - Interior Only",
          description: "Complete interior cleaning",
          productType: "APPOINTMENTS_SERVICE",
          categories: [{ id: "#SMALL_CAR" }], // Array format!
          variations: [
            {
              type: "ITEM_VARIATION",
              id: "#SmallCarInteriorNormal",
              presentAtAllLocations: true,
              itemVariationData: {
                itemId: "#SmallCarInterior",
                name: "Normal",
                pricingType: "FIXED_PRICING",
                priceMoney: {
                  amount: BigInt(10000), // Must use BigInt!
                  currency: "USD"
                },
                serviceDuration: 12600000
              }
            }
          ]
        }
      }
    ]
  }]
});

// Response has direct properties (no .result)
const createdObjects = response.objects;
const errors = response.errors;
const idMappings = response.idMappings;
```

#### Searching Catalog Items:
```javascript
// Note: Method is searchItems, not searchCatalogItems
const response = await client.catalog.searchItems({
  enabledLocationIds: [locationId],
  productTypes: ['APPOINTMENTS_SERVICE'],
  textFilter: 'CAR-WASH-SERVICE',
});

const items = response.items; // Direct access
```

#### Batch Delete:
```javascript
// Note: Method is batchDelete, not batchDeleteCatalogObjects
const response = await client.catalog.batchDelete({
  objectIds: ['ITEM_ID_1', 'ITEM_ID_2']
});

const deletedIds = response.deletedObjectIds; // Direct access
```

#### List Catalog:
```javascript
const response = await client.catalog.list({
  types: 'CATEGORY'
});

const objects = response.objects; // Direct access
```

### 3. Team API
Manages staff members who provide services.

```javascript
// Create team member
const response = await client.teamMembers.createTeamMember({
  idempotencyKey: crypto.randomUUID(),
  teamMember: {
    givenName: "John",
    familyName: "Doe",
    emailAddress: "john@example.com",
    assignedLocations: {
      assignmentType: "EXPLICIT_LOCATIONS",
      locationIds: [locationId]
    },
    status: 'ACTIVE'
  }
});

const teamMember = response.teamMember; // Direct access

// Search team members
const searchResponse = await client.teamMembers.search({
  query: {
    filter: {
      locationIds: [locationId],
      status: 'ACTIVE'
    }
  }
});

const teamMembers = searchResponse.teamMembers; // Direct access
```

### 4. Bookings API
Creates and manages appointments.

```javascript
const response = await client.bookings.createBooking({
  booking: {
    startAt: "2024-01-15T10:00:00Z",
    locationId: locationId,
    customerId: customerId,
    appointmentSegments: [{
      teamMemberId: teamMemberId,
      serviceVariationId: variationId,
      serviceVariationVersion: version
    }]
  }
});

const booking = response.booking; // Direct access
```

### 5. Customers API
Manages customer profiles and contact information.

```javascript
const response = await client.customers.createCustomer({
  givenName: "Jane",
  familyName: "Smith",
  emailAddress: "jane@example.com",
  phoneNumber: "+1234567890",
  referenceId: "CAR-WASH-APP" // For tracking
});

const customer = response.customer; // Direct access
```

## Catalog Structure

### Hierarchical Organization

```
Categories (Vehicle Types)
├── Small Car
│   ├── Interior Only Service
│   │   ├── Normal Variation ($100)
│   │   └── Very Dirty Variation ($150)
│   ├── Exterior Only Service
│   │   ├── Normal Variation ($80)
│   │   └── Very Dirty Variation ($130)
│   └── Full Detail Service
│       ├── Normal Variation ($170)
│       └── Very Dirty Variation ($220)
├── Truck
│   └── [Similar structure with different pricing]
└── Minivan
    └── [Similar structure with different pricing]
```

### Service Duration Guidelines

| Vehicle Type | Interior Only | Exterior Only | Full Detail |
|-------------|--------------|---------------|-------------|
| Small Car   | 3.5 hours    | 3 hours       | 4 hours     |
| Truck       | 4.5 hours    | 3.5 hours     | 5 hours     |
| Minivan     | 5 hours      | 3.5 hours     | 5.5 hours   |

### Pricing Structure (USD)

#### Small Car
- Interior Only: Normal $100, Very Dirty $150
- Exterior Only: Normal $80, Very Dirty $130
- Full Detail: Normal $170, Very Dirty $220

#### Truck (20% premium)
- Interior Only: Normal $120, Very Dirty $170
- Exterior Only: Normal $100, Very Dirty $150
- Full Detail: Normal $200, Very Dirty $250

#### Minivan (30% premium)
- Interior Only: Normal $130, Very Dirty $180
- Exterior Only: Normal $110, Very Dirty $160
- Full Detail: Normal $220, Very Dirty $270

## Implementation Best Practices

### 1. API Response Handling
**IMPORTANT**: Square SDK v43 returns data directly, NOT wrapped in a `result` property:

```javascript
// CORRECT - Direct property access
const response = await client.catalog.list();
const objects = response.objects || [];

// WRONG - Don't use .result
// const objects = response.result?.objects || [];
```

### 2. Money Amounts with BigInt
**CRITICAL**: All monetary amounts MUST use BigInt:

```javascript
// CORRECT
priceMoney: {
  amount: BigInt(10000), // $100.00 in cents
  currency: "USD"
}

// WRONG - Will cause API errors
priceMoney: {
  amount: 10000, // Number type not accepted
  currency: "USD"
}
```

### 3. Categories Structure
Items must reference categories using an array format:

```javascript
// CORRECT - Categories as array
itemData: {
  name: "Service Name",
  categories: [
    { id: "#CATEGORY_ID" }
  ],
  // ...
}

// WRONG - Don't use categoryId
itemData: {
  name: "Service Name",
  categoryId: "#CATEGORY_ID", // Deprecated format
  // ...
}
```

### 4. Variations Structure
Variations should be nested within items, not added separately:

```javascript
// CORRECT - Variations nested in item
{
  type: "ITEM",
  id: "#ITEM_ID",
  itemData: {
    name: "Item Name",
    variations: [
      {
        type: "ITEM_VARIATION",
        id: "#VARIATION_ID",
        itemVariationData: {
          // variation details
        }
      }
    ]
  }
}
```

### 5. Idempotency
Always use idempotency keys to prevent duplicate operations:

```javascript
const idempotencyKey = crypto.randomUUID();
```

### 6. Temporary IDs
Use temporary IDs (prefixed with #) for batch operations:

```javascript
const category = {
  type: "CATEGORY",
  id: "#SMALL_CAR",
  presentAtAllLocations: true,
  categoryData: {
    name: "Small Car"
  }
};
```

### 7. Error Handling

```javascript
try {
  const response = await client.catalog.batchUpsert(request);
  
  // Check for errors in response (direct access)
  if (response.errors && response.errors.length > 0) {
    response.errors.forEach(error => {
      console.error(`${error.category}: ${error.detail}`);
    });
    return;
  }
  
  // Process successful response
  const objects = response.objects;
  
} catch (error) {
  if (error.statusCode === 401) {
    console.error("Authentication failed - check access token");
  } else {
    console.error("API Error:", error.message);
  }
}
```

## Car Wash Specific Examples

### Creating a Complete Service Item

```javascript
function createCarWashService(vehicleType, serviceType, location) {
  const itemId = `#${vehicleType}_${serviceType}`.replace(/\s+/g, '_').toUpperCase();
  
  return {
    type: "ITEM",
    id: itemId,
    presentAtAllLocations: true,
    itemData: {
      name: `${vehicleType} - ${serviceType}`,
      description: getServiceDescription(serviceType),
      productType: "APPOINTMENTS_SERVICE",
      categories: [
        { id: `#${vehicleType.replace(/\s+/g, '_').toUpperCase()}` }
      ],
      variations: [
        createVariation(itemId, "Normal", getNormalPrice(vehicleType, serviceType), location),
        createVariation(itemId, "Very Dirty", getVeryDirtyPrice(vehicleType, serviceType), location)
      ]
    }
  };
}

function createVariation(itemId, condition, priceCents, location) {
  return {
    type: "ITEM_VARIATION",
    id: `${itemId}_${condition.replace(/\s+/g, '_').toUpperCase()}`,
    presentAtAllLocations: true,
    itemVariationData: {
      itemId: itemId,
      name: condition,
      sku: "CAR-WASH-SERVICE",
      pricingType: "FIXED_PRICING",
      priceMoney: {
        amount: BigInt(priceCents), // MUST use BigInt
        currency: location.currency || "USD"
      },
      availableForBooking: true,
      serviceDuration: getServiceDuration(itemId),
      teamMemberIds: [] // Will be set when team members are created
    }
  };
}
```

### Service Duration Calculation

```javascript
function getServiceDuration(serviceKey) {
  const durations = {
    'SMALL_CAR_INTERIOR': 12600000,    // 3.5 hours in milliseconds
    'SMALL_CAR_EXTERIOR': 10800000,    // 3 hours
    'SMALL_CAR_FULL': 14400000,        // 4 hours
    'TRUCK_INTERIOR': 16200000,        // 4.5 hours
    'TRUCK_EXTERIOR': 12600000,        // 3.5 hours
    'TRUCK_FULL': 18000000,            // 5 hours
    'MINIVAN_INTERIOR': 18000000,      // 5 hours
    'MINIVAN_EXTERIOR': 12600000,      // 3.5 hours
    'MINIVAN_FULL': 19800000           // 5.5 hours
  };
  
  return durations[serviceKey] || 10800000; // Default 3 hours
}
```

### Complete Initialization Example

```javascript
const { SquareClient, SquareEnvironment } = require('square');
const crypto = require('crypto');

async function initializeCatalog() {
  const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ACCESS_TOKEN.startsWith('EAAA') 
      ? SquareEnvironment.Sandbox 
      : SquareEnvironment.Production
  });
  
  // Get location
  const locationsResponse = await client.locations.list();
  const location = locationsResponse.locations[0]; // Direct access
  
  // Build catalog objects
  const catalogObjects = [
    // Categories
    { type: "CATEGORY", id: "#SMALL_CAR", presentAtAllLocations: true, categoryData: { name: "Small Car" }},
    { type: "CATEGORY", id: "#TRUCK", presentAtAllLocations: true, categoryData: { name: "Truck" }},
    { type: "CATEGORY", id: "#MINIVAN", presentAtAllLocations: true, categoryData: { name: "Minivan" }},
    
    // Items with variations
    {
      type: "ITEM",
      id: "#SMALL_CAR_INTERIOR",
      presentAtAllLocations: true,
      itemData: {
        name: "Small Car - Interior Only",
        description: "Complete interior cleaning",
        productType: "APPOINTMENTS_SERVICE",
        categories: [{ id: "#SMALL_CAR" }],
        variations: [
          {
            type: "ITEM_VARIATION",
            id: "#SMALL_CAR_INTERIOR_NORMAL",
            presentAtAllLocations: true,
            itemVariationData: {
              itemId: "#SMALL_CAR_INTERIOR",
              name: "Normal",
              sku: "CAR-WASH-SERVICE",
              pricingType: "FIXED_PRICING",
              priceMoney: {
                amount: BigInt(10000),
                currency: location.currency
              },
              serviceDuration: 12600000,
              availableForBooking: true
            }
          },
          {
            type: "ITEM_VARIATION",
            id: "#SMALL_CAR_INTERIOR_VERY_DIRTY",
            presentAtAllLocations: true,
            itemVariationData: {
              itemId: "#SMALL_CAR_INTERIOR",
              name: "Very Dirty",
              sku: "CAR-WASH-SERVICE",
              pricingType: "FIXED_PRICING",
              priceMoney: {
                amount: BigInt(15000),
                currency: location.currency
              },
              serviceDuration: 12600000,
              availableForBooking: true
            }
          }
        ]
      }
    }
    // ... more items
  ];
  
  // Batch upsert
  const response = await client.catalog.batchUpsert({
    idempotencyKey: crypto.randomUUID(),
    batches: [{ objects: catalogObjects }]
  });
  
  // Check results (direct access)
  if (response.errors && response.errors.length > 0) {
    console.error('Errors:', response.errors);
  } else {
    console.log('Created:', response.objects.length, 'objects');
    console.log('ID Mappings:', response.idMappings);
  }
}
```

## API Route Structure (Next.js App Router)

### Client Setup (`app/api/square/lib/client.js`)
```javascript
import { SquareClient, SquareEnvironment } from 'square';

const accessToken = process.env.SQUARE_ACCESS_TOKEN;

const environment = accessToken.startsWith('EAAA') 
  ? SquareEnvironment.Sandbox 
  : SquareEnvironment.Production;

const client = new SquareClient({
  token: accessToken,
  environment,
  userAgentDetail: 'car-wash-appointments'
});

// Export API instances
export const bookingsApi = client.bookings;
export const catalogApi = client.catalog;
export const customersApi = client.customers;
export const locationsApi = client.locations;
export const paymentsApi = client.payments;
export const teamMembersApi = client.teamMembers;

export default client;
```

### Route Handler Example (`app/api/square/catalog/route.js`)
```javascript
import { catalogApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

export async function GET(request) {
  try {
    const response = await catalogApi.list({});
    // Direct access - no .result
    return successResponse(response);
  } catch (error) {
    return handleSquareError(error, 'Failed to fetch catalog');
  }
}
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Verify access token and environment match
2. **Missing Location**: Ensure location exists in Square dashboard
3. **Currency Mismatch**: Check location.currency matches price currency
4. **BigInt Errors**: Ensure all money amounts use `BigInt()`
5. **Category Assignment**: Use `categories` array, not `categoryId`
6. **Response Access**: Access properties directly, not through `.result`

### Debug Tips

```javascript
// Enable verbose logging
if (process.env.DEBUG) {
  console.log('Request:', JSON.stringify(request, null, 2));
  // Note: Direct access to response
  console.log('Response:', JSON.stringify(response, null, 2));
}

// Check ID mappings after batch upsert
response.idMappings?.forEach(mapping => {
  console.log(`${mapping.clientObjectId} -> ${mapping.objectId}`);
});
```

## Square SDK v43 Method Reference

### Correct Method Names
| Operation | Correct Method | Incorrect (Old) Method |
|-----------|---------------|------------------------|
| Batch Create/Update | `catalog.batchUpsert()` | `catalog.batchUpsertCatalogObjects()` |
| Batch Delete | `catalog.batchDelete()` | `catalog.batchDeleteCatalogObjects()` |
| Search Items | `catalog.searchItems()` | `catalog.searchCatalogItems()` |
| Search Objects | `catalog.searchObjects()` | `catalog.searchCatalogObjects()` |

### Response Structure Changes
| API | v43 Response Access | Old SDK Access |
|-----|-------------------|----------------|
| Locations | `response.locations` | `response.result.locations` |
| Catalog List | `response.objects` | `response.result.objects` |
| Catalog Upsert | `response.objects`, `response.errors` | `response.result.objects` |
| Team Search | `response.teamMembers` | `response.result.teamMembers` |
| Customer Create | `response.customer` | `response.result.customer` |

## Resources

- [Square API Reference](https://developer.squareup.com/reference/square)
- [Square Catalog API Guide](https://developer.squareup.com/docs/catalog-api/what-it-does)
- [Square Bookings API Guide](https://developer.squareup.com/docs/appointments-api/what-it-does)
- [Square API Explorer](https://developer.squareup.com/explorer/square)
- [Square SDK for Node.js](https://github.com/square/square-nodejs-sdk)

---

*This guide accurately reflects Square SDK v43 behavior. Always refer to the official Square documentation for the most up-to-date information.*