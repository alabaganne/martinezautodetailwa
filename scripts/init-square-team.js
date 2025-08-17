#!/usr/bin/env node

/**
 * Initialize Square Team Members for car wash appointments
 * Creates 3 team members to handle concurrent bookings
 */

const { config } = require('dotenv');
const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
config({ path: '.env.local' });

// Initialize Square client
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

const environment = accessToken.startsWith('EAAA') 
  ? SquareEnvironment.Sandbox 
  : SquareEnvironment.Production;

const client = new SquareClient({
  accessToken,
  environment,
  userAgentDetail: 'car-wash-team-init'
});

console.log(`🔧 Using ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'} environment`);

/**
 * Team member configuration
 */
const TEAM_MEMBERS = [
  {
    givenName: 'Bay 1',
    familyName: 'Technician',
    emailAddress: 'bay1@carwash.local',
    phoneNumber: '+21600000001',
    assignedLocations: {
      assignment_type: 'ALL_CURRENT_AND_FUTURE_LOCATIONS'
    }
  },
  {
    givenName: 'Bay 2',
    familyName: 'Technician',
    emailAddress: 'bay2@carwash.local',
    phoneNumber: '+21600000002',
    assignedLocations: {
      assignment_type: 'ALL_CURRENT_AND_FUTURE_LOCATIONS'
    }
  },
  {
    givenName: 'Bay 3',
    familyName: 'Technician',
    emailAddress: 'bay3@carwash.local',
    phoneNumber: '+21600000003',
    assignedLocations: {
      assignment_type: 'ALL_CURRENT_AND_FUTURE_LOCATIONS'
    }
  }
];

/**
 * Main initialization function
 */
async function initializeTeamMembers() {
  try {
    console.log('\n👥 Starting Team Members Initialization...\n');
    
    // Step 1: Get location
    console.log('1️⃣ Fetching location...');
    const locationsResponse = await client.locations.list();
    if (!locationsResponse.result?.locations?.length) {
      throw new Error('No locations found');
    }
    const location = locationsResponse.result.locations[0];
    console.log(`   ✅ Location: ${location.name} (${location.id})`);
    
    // Step 2: Check existing team members
    console.log('\n2️⃣ Checking existing team members...');
    const searchResponse = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [location.id],
          status: 'ACTIVE'
        }
      }
    });
    
    const existingMembers = searchResponse.result?.teamMembers || [];
    console.log(`   ℹ️  Found ${existingMembers.length} existing team members`);
    
    // Step 3: Create team members
    console.log('\n3️⃣ Creating team members...');
    const createdMembers = [];
    const errors = [];
    
    for (const memberData of TEAM_MEMBERS) {
      try {
        // Check if member already exists
        const existing = existingMembers.find(m => 
          m.givenName === memberData.givenName && 
          m.familyName === memberData.familyName
        );
        
        if (existing) {
          console.log(`   ⏭️  ${memberData.givenName} ${memberData.familyName} already exists (${existing.id})`);
          createdMembers.push(existing);
          continue;
        }
        
        // Create new team member
        const createResponse = await client.teamMembers.createTeamMember({
          idempotencyKey: `team-member-${memberData.givenName}-${memberData.familyName}-${Date.now()}`,
          teamMember: {
            ...memberData,
            status: 'ACTIVE'
          }
        });
        
        const newMember = createResponse.result.teamMember;
        createdMembers.push(newMember);
        console.log(`   ✅ Created ${newMember.givenName} ${newMember.familyName} (${newMember.id})`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create ${memberData.givenName} ${memberData.familyName}:`, error.message);
        errors.push({
          member: `${memberData.givenName} ${memberData.familyName}`,
          error: error.message
        });
      }
    }
    
    // Step 4: Display summary
    console.log('\n=== Team Members Initialization Complete ===\n');
    console.log('TEAM MEMBERS:');
    createdMembers.forEach(member => {
      console.log(`- ${member.givenName} ${member.familyName}: ${member.id}`);
    });
    
    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      errors.forEach(err => {
        console.log(`- ${err.member}: ${err.error}`);
      });
    }
    
    // Step 5: Important notes
    console.log('\n📌 IMPORTANT NEXT STEPS:');
    console.log('1. Log into your Square Dashboard');
    console.log('2. Navigate to Team > Team Members');
    console.log('3. For each team member:');
    console.log('   - Click on the member');
    console.log('   - Enable "Can be booked for appointments"');
    console.log('   - Set their working hours (Mon-Fri 9 AM - 5 PM)');
    console.log('   - Assign them to the services they can perform');
    console.log('\n⚠️  Team members must be made bookable in the Square Dashboard');
    console.log('    The API cannot enable booking capabilities directly.\n');
    
  } catch (error) {
    console.error('\n❌ Error during team initialization:', error.message);
    if (error.result?.errors) {
      error.result.errors.forEach(err => {
        console.error(`   - ${err.category}: ${err.detail}`);
      });
    }
    process.exit(1);
  }
}

// Run initialization
initializeTeamMembers();