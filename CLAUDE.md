# Square API Integration Reference

## Authentication

```javascript
const { SquareClient } = require('square');

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
});
```

## Core APIs

### 1. Locations API
```javascript
const response = await client.locations.list();
const locations = response.locations; // Direct access
```

### 2. Catalog API
```javascript
// List items
const response = await client.catalog.list();
const items = response.data || [];

// Batch Upsert
const response = await client.catalog.batchUpsert({
  idempotencyKey: crypto.randomUUID(),
  batches: [{
    objects: [{
      type: 'ITEM',
      id: '#SmallCarInterior',
      presentAtAllLocations: true,
      itemData: {
        name: 'Small Car - Interior Only',
        productType: 'APPOINTMENTS_SERVICE',
        categories: [{ id: '#SMALL_CAR' }],
        variations: [{
          type: 'ITEM_VARIATION',
          id: '#SmallCarInteriorNormal',
          presentAtAllLocations: true,
          itemVariationData: {
            itemId: '#SmallCarInterior',
            name: 'Normal',
            pricingType: 'FIXED_PRICING',
            priceMoney: {
              amount: BigInt(12000), // $120 in cents
              currency: 'USD',
            },
            serviceDuration: 12600000,
          },
        }],
      },
    }],
  }],
});
```

### 3. Customers API
```javascript
// Create
const response = await client.customers.create({
  idempotencyKey: crypto.randomUUID(),
  givenName: "John",
  familyName: "Doe",
  emailAddress: "john@example.com",
});
const customer = response.customer;

// Search
const response = await client.customers.search({
  filter: { emailAddress: { exact: 'john@example.com' } }
});
const customers = response.customers || [];
```

### 4. Bookings API
```javascript
const response = await client.bookings.create({
  booking: {
    customerId: customerId,
    startAt: "2024-01-15T10:00:00Z",
    locationId: locationId,
    customerNote: "Interior cleaning for sedan",
    appointmentSegments: [{
      durationMinutes: 210,
      teamMemberId: teamMemberId,
      serviceVariationId: variationId,
      serviceVariationVersion: BigInt(Date.now())
    }]
  }
});
const booking = response.booking;
```

### 5. Team API
```javascript
const response = await client.teamMembers.search({
  query: { filter: { status: 'ACTIVE' } }
});
const teamMembers = response.teamMembers || [];
```

### Payment Flow
1. Customer fills booking details
2. Reviews booking summary
3. Enters payment information (new step)
4. Payment token generated via Web SDK
5. Payment authorized (not captured)
6. Booking created with payment reference
7. Confirmation shown with payment status


# To memorize
- remember to keep things simple and not to do anything i didn't type it for you to do.