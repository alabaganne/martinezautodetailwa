#!/usr/bin/env node

/**
 * Seed test bookings for the car wash appointment system
 * Creates realistic bookings respecting business rules and capacity
 * Usage: node seed-bookings.js create|list|clear
 */

const { config } = require('dotenv');
const { SquareClient, SquareEnvironment } = require('square');
const { program } = require('commander');
const crypto = require('crypto');

// Load environment variables
config({ path: '.env.local' });

// Initialize Square client
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

// Detect environment
const environment = SquareEnvironment.Sandbox ;

const client = new SquareClient({
  token: accessToken,
  environment,
  userAgentDetail: 'car-wash-booking-seeder'
});

// Business Rules
const BUSINESS_RULES = {
  operatingDays: [1, 2, 3, 4, 5], // Monday to Friday
  dropOffTimes: ['08:00:00', '09:00:00'],
  pickupTime: '17:00:00', // 5 PM
  maxConcurrentServices: 3, // 3 bays
};

// Service durations in minutes
const SERVICE_DURATIONS = {
  'Interior Only': {
    'Small Car': 210, // 3.5h
    'Truck': 270,     // 4.5h
    'Minivan': 300    // 5h
  },
  'Exterior Only': {
    'Small Car': 180, // 3h
    'Truck': 210,     // 3.5h
    'Minivan': 210    // 3.5h
  },
  'Full Detail': {
    'Small Car': 240, // 4h
    'Truck': 300,     // 5h
    'Minivan': 330    // 5.5h
  }
};

// Test customer names (will be determined after environment is set)
const getTestCustomers = () => environment === SquareEnvironment.Production ? [
  { given: 'John', family: 'Smith', email: 'john.smith@test.com', phone: '+21612345601' },
  { given: 'Sarah', family: 'Johnson', email: 'sarah.j@test.com', phone: '+21612345602' },
  { given: 'Michael', family: 'Brown', email: 'mbrown@test.com', phone: '+21612345603' },
  { given: 'Emma', family: 'Davis', email: 'emma.d@test.com', phone: '+21612345604' },
  { given: 'David', family: 'Wilson', email: 'dwilson@test.com', phone: '+21612345605' },
  { given: 'Lisa', family: 'Garcia', email: 'lgarcia@test.com', phone: '+21612345606' },
  { given: 'James', family: 'Martinez', email: 'jmart@test.com', phone: '+21612345607' },
  { given: 'Maria', family: 'Anderson', email: 'manderson@test.com', phone: '+21612345608' },
  { given: 'Robert', family: 'Taylor', email: 'rtaylor@test.com', phone: '+21612345609' },
  { given: 'Jennifer', family: 'Thomas', email: 'jthomas@test.com', phone: '+21612345610' }
] : [
  { given: 'John', family: 'Smith', email: 'john.smith@test.com', phone: '+14155551001' },
  { given: 'Sarah', family: 'Johnson', email: 'sarah.j@test.com', phone: '+14155551002' },
  { given: 'Michael', family: 'Brown', email: 'mbrown@test.com', phone: '+14155551003' },
  { given: 'Emma', family: 'Davis', email: 'emma.d@test.com', phone: '+14155551004' },
  { given: 'David', family: 'Wilson', email: 'dwilson@test.com', phone: '+14155551005' },
  { given: 'Lisa', family: 'Garcia', email: 'lgarcia@test.com', phone: '+14155551006' },
  { given: 'James', family: 'Martinez', email: 'jmart@test.com', phone: '+14155551007' },
  { given: 'Maria', family: 'Anderson', email: 'manderson@test.com', phone: '+14155551008' },
  { given: 'Robert', family: 'Taylor', email: 'rtaylor@test.com', phone: '+14155551009' },
  { given: 'Jennifer', family: 'Thomas', email: 'jthomas@test.com', phone: '+14155551010' }
];

/**
 * Generate unique idempotency key
 */
function generateIdempotencyKey() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Get location ID
 */
async function getLocationId() {
  try {
    const response = await client.locations.list();
    
    if (response.result?.locations && response.result.locations.length > 0) {
      const location = response.result.locations[0];
      console.log(`📍 Using location: ${location.name} (${location.id})`);
      return location.id;
    }
    
    console.error('❌ No locations found in Square account');
    process.exit(1);
  } catch (error) {
    console.error('❌ Failed to fetch locations:', error.message);
    process.exit(1);
  }
}

/**
 * Get or create test customers
 */
async function getOrCreateCustomers(locationId) {
  const customers = [];
  const testCustomers = getTestCustomers();
  
  for (const testCustomer of testCustomers.slice(0, 5)) { // Use first 5 customers
    try {
      // Search for existing customer by email
      const searchResponse = await client.customers.search({
        filter: {
          emailAddress: {
            exact: testCustomer.email
          }
        }
      });
      
      if (searchResponse.result?.customers?.length > 0) {
        customers.push(searchResponse.result.customers[0]);
        console.log(`✓ Found existing customer: ${testCustomer.given} ${testCustomer.family}`);
      } else {
        // Create new customer
        const createResponse = await client.customers.create({
          idempotencyKey: generateIdempotencyKey(),
          givenName: testCustomer.given,
          familyName: testCustomer.family,
          emailAddress: testCustomer.email,
          phoneNumber: testCustomer.phone,
          referenceId: `test-${testCustomer.given.toLowerCase()}-${Date.now()}`
        });
        
        if (createResponse.result?.customer) {
          customers.push(createResponse.result.customer);
          console.log(`✓ Created customer: ${testCustomer.given} ${testCustomer.family}`);
        } else if (createResponse.customer) {
          // Sometimes the response is directly on the object
          customers.push(createResponse.customer);
          console.log(`✓ Created customer: ${testCustomer.given} ${testCustomer.family}`);
        } else {
          console.log('Unexpected customer creation response:', createResponse);
        }
      }
    } catch (error) {
      console.error(`Failed to get/create customer ${testCustomer.given}:`, error.message);
    }
  }
  
  return customers;
}

/**
 * Get team members (bay technicians)
 */
async function getTeamMembers() {
  try {
    // Use the searchTeamMembers API
    const response = await client.teamMembers.search({
      query: {
        filter: {
          status: 'ACTIVE'
        }
      }
    });
    
    const allTeamMembers = response.teamMembers || [];
    
    // Filter to get only non-owner team members (bay technicians)
    const teamMembers = allTeamMembers.filter(
      tm => !tm.isOwner
    );
    
    console.log(`✓ Found ${teamMembers.length} team member(s)`);
    teamMembers.forEach(tm => {
      console.log(`  - ${tm.givenName} ${tm.familyName || ''} (${tm.id})`);
    });
    return teamMembers;
  } catch (error) {
    console.error('Failed to get team members:', error.message);
    return [];
  }
}

/**
 * Get catalog items and variations
 */
async function getCatalogItems() {
  try {
    const response = await client.catalog.list('ITEM');
    
    const items = response.data || [];
    console.log(`Found ${items.length} catalog items`);
    
    // Organize by category and service type
    const catalog = {};
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = item.itemData?.name.toUpperCase() || '';
      const variations = item.itemData?.variations || [];
      
      // Parse name to get vehicle type and service type
      let vehicleType = null;
      let serviceType = null;
      
      if (name.includes('SMALL CAR')) vehicleType = 'Small Car';
      else if (name.includes('TRUCK')) vehicleType = 'Truck';
      else if (name.includes('MINIVAN')) vehicleType = 'Minivan';
      
      if (name.includes('INTERIOR ONLY')) serviceType = 'Interior Only';
      else if (name.includes('EXTERIOR ONLY')) serviceType = 'Exterior Only';
      else if (name.includes('FULL DETAIL')) serviceType = 'Full Detail';
      
      // Debug: If service type is still null, let's see why
      if (vehicleType && !serviceType) {
        console.log(`  Warning: Found vehicle type ${vehicleType} but no service type in: "${name}"`);
      }
      
      if (vehicleType && serviceType) {
        if (!catalog[vehicleType]) catalog[vehicleType] = {};
        catalog[vehicleType][serviceType] = {
          itemId: item.id,
          variations: variations.map(v => ({
            id: v.id,
            name: v.itemVariationData?.name || 'Standard',
            price: v.itemVariationData?.priceMoney?.amount || 0
          }))
        };
        console.log(`  Added: ${vehicleType} - ${serviceType}`);
      }
    }
    
    console.log('✓ Loaded catalog items');
    return catalog;
  } catch (error) {
    console.error('Failed to get catalog:', error.message);
    return {};
  }
}

/**
 * Generate booking schedule for the next few days
 */
function generateBookingSchedule() {
  const schedule = [];
  const today = new Date();
  const daysToBook = [];
  
  // Find next 7 weekdays
  const weekdays = [];
  let checkDate = new Date(today);
  checkDate.setDate(checkDate.getDate() + 1); // Start from tomorrow
  
  while (weekdays.length < 7) {
    if (BUSINESS_RULES.operatingDays.includes(checkDate.getDay())) {
      weekdays.push(new Date(checkDate));
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  // Select 4 random days from the 7 weekdays
  const selectedIndices = new Set();
  while (selectedIndices.size < 4) {
    selectedIndices.add(Math.floor(Math.random() * weekdays.length));
  }
  
  [...selectedIndices].sort().forEach(index => {
    daysToBook.push(weekdays[index]);
  });
  
  // Generate bookings for each selected day
  const vehicleTypes = ['Small Car', 'Truck', 'Minivan'];
  const serviceTypes = ['Interior Only', 'Exterior Only', 'Full Detail'];
  let bayIndex = 0;
  
  daysToBook.forEach((date, dayIndex) => {
    const bookingsPerDay = dayIndex % 2 === 0 ? 3 : 2; // Alternate between 2 and 3 bookings
    const daySchedule = [];
    
    for (let i = 0; i < bookingsPerDay && i < BUSINESS_RULES.maxConcurrentServices; i++) {
      const dropOffTime = i < 2 ? '08:00:00' : '09:00:00'; // First 2 at 8 AM, rest at 9 AM
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const duration = SERVICE_DURATIONS[serviceType][vehicleType];
      
      const booking = {
        date: new Date(date),
        dropOffTime,
        vehicleType,
        serviceType,
        duration,
        bayNumber: (bayIndex % 3) + 1,
        customerIndex: Math.floor(Math.random() * 5) // Random customer from first 5
      };
      
      daySchedule.push(booking);
      bayIndex++;
    }
    
    schedule.push(...daySchedule);
  });
  
  return schedule;
}

/**
 * Create bookings in Square
 */
async function createBookings(schedule, customers, teamMembers, catalog, locationId) {
  const createdBookings = [];
  
  for (const booking of schedule) {
    try {
      const customer = customers[booking.customerIndex];
      const teamMember = teamMembers[booking.bayNumber - 1] || null;
      const catalogItem = catalog[booking.vehicleType]?.[booking.serviceType];
      
      if (!customer || !catalogItem) {
        console.log(`⚠️  Skipping booking: customer=${!!customer}, catalogItem=${!!catalogItem}`);
        console.log(`   Booking details: ${booking.vehicleType} ${booking.serviceType}, customerIndex=${booking.customerIndex}`);
        continue;
      }
      
      // Format start time
      const startAt = new Date(booking.date);
      const [hours, minutes] = booking.dropOffTime.split(':');
      startAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Prepare booking request
      const bookingRequest = {
        booking: {
          customerId: customer.id,
          startAt: startAt.toISOString(),
          locationId: locationId,
          customerNote: `Test booking - ${booking.vehicleType} ${booking.serviceType}`,
          appointmentSegments: [
            {
              durationMinutes: booking.duration,
              teamMemberId: teamMember.id,
              serviceVariationId: catalogItem.variations[0]?.id,
              serviceVariationVersion: BigInt(Date.now())
            }
          ]
        },
      };
      
      // Create the booking
      const response = await client.bookings.create(bookingRequest);
      
      if (response.booking) {
        createdBookings.push(response.booking);
        console.log(`✓ Created booking: ${booking.date.toDateString()} ${booking.dropOffTime} - ${customer.givenName} ${customer.familyName} - ${booking.vehicleType} ${booking.serviceType}`);
      }
    } catch (error) {
      console.error(`Failed to create booking:`, error.message);
    }
  }
  
  return createdBookings;
}

/**
 * List existing bookings
 */
async function listBookings(locationId) {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const response = await client.bookings.list(
      100,
      undefined,
      undefined,
      locationId,
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    const bookings = response.result?.bookings || [];
    
    console.log(`\n📅 Found ${bookings.length} upcoming bookings:\n`);
    
    bookings.forEach(booking => {
      const startAt = new Date(booking.startAt);
      const customer = booking.customerNote || 'Unknown';
      const status = booking.status;
      
      console.log(`  ${startAt.toDateString()} ${startAt.toLocaleTimeString()} - ${customer} - ${status}`);
    });
    
    return bookings;
  } catch (error) {
    console.error('Failed to list bookings:', error.message);
    return [];
  }
}

/**
 * Clear test bookings
 */
async function clearTestBookings(locationId) {
  try {
    const bookings = await listBookings(locationId);
    const testBookings = bookings.filter(b => 
      b.customerNote?.includes('Test booking')
    );
    
    if (testBookings.length === 0) {
      console.log('No test bookings to clear');
      return;
    }
    
    console.log(`\n🗑️  Clearing ${testBookings.length} test bookings...\n`);
    
    for (const booking of testBookings) {
      try {
        await client.bookings.cancel(booking.id, {
          bookingVersion: booking.version
        });
        console.log(`✓ Cancelled booking ${booking.id}`);
      } catch (error) {
        console.error(`Failed to cancel booking ${booking.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Failed to clear bookings:', error.message);
  }
}

// CLI commands
program
  .name('seed-bookings')
  .description('Seed test bookings for car wash appointments')
  .version('1.0.0');

program
  .command('create')
  .description('Create test bookings')
  .action(async () => {
    console.log('\n🚗 Car Wash Booking Seeder\n');
    console.log('Environment:', environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production');
    
    try {
      const locationId = await getLocationId();
      const catalog = await getCatalogItems();
      const teamMembers = await getTeamMembers(locationId);
      const customers = await getOrCreateCustomers(locationId);
      
      console.log('\n📅 Generating booking schedule...\n');
      const schedule = generateBookingSchedule();
      
      console.log(`Creating ${schedule.length} bookings...\n`);
      const createdBookings = await createBookings(schedule, customers, teamMembers, catalog, locationId);
      
      console.log(`\n✅ Successfully created ${createdBookings.length} bookings!`);
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List existing bookings')
  .action(async () => {
    console.log('\n📋 Listing Bookings\n');
    
    try {
      const locationId = await getLocationId();
      await listBookings(locationId);
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('clear')
  .description('Clear test bookings')
  .action(async () => {
    console.log('\n🗑️  Clearing Test Bookings\n');
    
    try {
      const locationId = await getLocationId();
      await clearTestBookings(locationId);
      console.log('\n✅ Test bookings cleared!');
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);