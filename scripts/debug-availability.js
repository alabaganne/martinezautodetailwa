#!/usr/bin/env node

/**
 * Debug script to diagnose Square availability issues
 * Usage: node scripts/debug-availability.js
 */

import { SquareClient, SquareEnvironment } from 'square';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Initialize Square client
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

const environment = process.env.SQUARE_ENVIRONMENT === 'production'
  ? SquareEnvironment.Production
  : SquareEnvironment.Sandbox;

const client = new SquareClient({
  token: accessToken,
  environment,
  userAgentDetail: 'debug-availability'
});

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logJSON(obj) {
  console.log(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

/**
 * Get the default location
 */
async function getLocationId() {
  try {
    const { locations } = await client.locations.list();
    if (!locations || locations.length === 0) {
      throw new Error('No locations found');
    }
    return locations[0].id;
  } catch (error) {
    log(`❌ Failed to get location: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Get and analyze team members
 */
async function analyzeTeamMembers(locationId) {
  logSection('TEAM MEMBERS ANALYSIS');

  try {
    const { teamMembers } = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE',
        },
      },
    });

    log(`\nTotal active team members found: ${teamMembers?.length || 0}`, 'cyan');

    if (teamMembers && teamMembers.length > 0) {
      teamMembers.forEach((member, index) => {
        console.log(`\n--- Team Member ${index + 1} ---`);
        console.log(`ID: ${member.id}`);
        console.log(`Name: ${member.givenName} ${member.familyName || ''}`);
        console.log(`Email: ${member.emailAddress || 'N/A'}`);
        console.log(`Is Owner: ${member.isOwner ? 'Yes' : 'No'}`);
        console.log(`Status: ${member.status}`);
      });

      // Filter as done in the code
      const filtered = teamMembers.filter(tm => !tm.isOwner && tm.givenName.toLowerCase() !== 'strivehawk');
      log(`\n✅ Team members after filtering (excluding owner and 'strivehawk'): ${filtered.length}`, 'green');

      if (filtered.length > 0) {
        log(`   Using team member: ${filtered[0].givenName} (${filtered[0].id})`, 'green');
        return filtered[0].id;
      } else {
        log(`   ⚠️  No team members left after filtering!`, 'yellow');
        return null;
      }
    } else {
      log('❌ No active team members found!', 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error fetching team members: ${error.message}`, 'red');
    if (error.errors) {
      error.errors.forEach(err => {
        console.log(`   - ${err.code}: ${err.detail}`);
      });
    }
    return null;
  }
}

/**
 * Get catalog items and variations
 */
async function analyzeCatalog() {
  logSection('CATALOG ANALYSIS');

  try {
    // Get all items
    const itemsResponse = await client.catalog.search({
      objectTypes: ['ITEM'],
      includeDeletedObjects: false,
    });

    const items = itemsResponse.objects || [];
    log(`\nTotal catalog items: ${items.length}`, 'cyan');

    // Get all variations
    const variationsResponse = await client.catalog.search({
      objectTypes: ['ITEM_VARIATION'],
      includeDeletedObjects: false,
    });

    const variations = variationsResponse.objects || [];
    log(`Total catalog variations: ${variations.length}`, 'cyan');

    // Find variations available for booking
    const bookableVariations = variations.filter(v =>
      v.itemVariationData?.availableForBooking === true
    );

    log(`\n✅ Variations available for booking: ${bookableVariations.length}`, 'green');

    if (bookableVariations.length > 0) {
      console.log('\nFirst few bookable service variations:');
      bookableVariations.slice(0, 3).forEach(variation => {
        const itemId = variation.itemVariationData.itemId;
        const item = items.find(i => i.id === itemId);
        const itemName = item?.itemData?.name || 'Unknown Item';
        console.log(`\n- ${itemName} > ${variation.itemVariationData.name}`);
        console.log(`  ID: ${variation.id}`);
        const duration = variation.itemVariationData.serviceDuration;
        if (duration) {
          const durationMs = typeof duration === 'bigint' ? Number(duration) : duration;
          console.log(`  Duration: ${durationMs / 60000} minutes`);
        }
        const price = variation.itemVariationData.priceMoney?.amount;
        if (price) {
          const priceNum = typeof price === 'bigint' ? Number(price) : price;
          console.log(`  Price: $${priceNum / 100}`);
        }
      });

      return bookableVariations[0].id; // Return first bookable variation for testing
    } else {
      log('❌ No variations are marked as available for booking!', 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error fetching catalog: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Test availability for a specific date range
 */
async function testAvailability(locationId, serviceVariationId, year, month, day = null) {
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  const dateDesc = day ? `${monthName} ${day}, ${year}` : `${monthName} ${year}`;

  logSection(`TESTING AVAILABILITY FOR ${dateDesc}`);

  if (!serviceVariationId) {
    log('⚠️  No service variation ID provided - skipping test', 'yellow');
    return;
  }

  try {
    // Create date range
    const monthIndex = month - 1; // Convert to 0-indexed
    let startAt, endAt;

    if (day) {
      startAt = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0));
      endAt = new Date(Date.UTC(year, monthIndex, day + 1, 0, 0, 0));
    } else {
      // Test first week of month
      startAt = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
      endAt = new Date(Date.UTC(year, monthIndex, 8, 0, 0, 0)); // First week
    }

    log(`\nSearching from: ${startAt.toISOString()}`, 'cyan');
    log(`           to: ${endAt.toISOString()}`, 'cyan');

    const request = {
      query: {
        filter: {
          startAtRange: {
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString()
          },
          locationId: locationId,
          segmentFilters: [
            {
              serviceVariationId,
            },
          ],
        },
      },
    };

    log('\nAPI Request:', 'magenta');
    logJSON(request);

    const response = await client.bookings.searchAvailability(request);

    log('\nAPI Response:', 'magenta');
    logJSON(response);

    if (response.availabilities && response.availabilities.length > 0) {
      log(`\n✅ Found ${response.availabilities.length} available slots!`, 'green');

      // Show first few slots
      console.log('\nFirst 3 available slots:');
      response.availabilities.slice(0, 3).forEach((slot, i) => {
        const date = new Date(slot.startAt);
        console.log(`  ${i + 1}. ${date.toLocaleString()}`);
        console.log(`     Duration: ${slot.appointmentSegments?.[0]?.durationMinutes || 'N/A'} minutes`);
      });
    } else {
      log('\n❌ No availability found for this period!', 'red');

      if (response.errors && response.errors.length > 0) {
        console.log('\nErrors from Square:');
        response.errors.forEach(error => {
          console.log(`  - ${error.code}: ${error.detail}`);
        });
      }
    }
  } catch (error) {
    log(`\n❌ Error searching availability: ${error.message}`, 'red');
    if (error.errors) {
      error.errors.forEach(err => {
        console.log(`   - ${err.code}: ${err.detail}`);
      });
    }
  }
}

/**
 * Main debug function
 */
async function main() {
  log('🔍 SQUARE AVAILABILITY DEBUG TOOL', 'bright');
  log(`Environment: ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'}`, 'cyan');

  const now = new Date();
  log(`Current Date/Time: ${now.toString()}`, 'cyan');
  log(`Current UTC: ${now.toISOString()}`, 'cyan');

  try {
    // Get location
    logSection('LOCATION CHECK');
    const locationId = await getLocationId();
    log(`✅ Location ID: ${locationId}`, 'green');

    // Analyze team members
    const teamMemberId = await analyzeTeamMembers(locationId);

    // Analyze catalog
    const serviceVariationId = await analyzeCatalog();

    // Get current date info
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentDay = now.getDate();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    // Test availability for different scenarios

    // 1. Test today specifically
    await testAvailability(locationId, serviceVariationId, currentYear, currentMonth, currentDay);

    // 2. Test tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    await testAvailability(locationId, serviceVariationId, tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate());

    // 3. Test rest of current month
    await testAvailability(locationId, serviceVariationId, currentYear, currentMonth);

    // 4. Test next month
    await testAvailability(locationId, serviceVariationId, nextMonthYear, nextMonth);

    // Summary
    logSection('SUMMARY');

    if (!teamMemberId) {
      log('⚠️  ISSUE: No eligible team members found after filtering', 'yellow');
      log('   - Check if team members have availability configured in Square', 'yellow');
      log('   - Verify team members are not all owners or named "strivehawk"', 'yellow');
    }

    if (!serviceVariationId) {
      log('⚠️  ISSUE: No service variations are marked as available for booking', 'yellow');
      log('   - Check catalog items in Square Dashboard', 'yellow');
      log('   - Ensure variations have "availableForBooking" set to true', 'yellow');
    }

    if (teamMemberId && serviceVariationId) {
      log('\n📋 Next Steps:', 'cyan');
      log('1. Check Square Dashboard > Appointments > Availability', 'white');
      log('2. Verify team member schedules are configured', 'white');
      log('3. Check for blocked dates or holidays', 'white');
      log('4. Verify booking window settings (advance notice, max booking window)', 'white');
      log('5. Ensure services are assigned to team members with availability', 'white');
    }

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the debug script
main();