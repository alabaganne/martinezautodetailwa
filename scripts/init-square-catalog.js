#!/usr/bin/env node

/**
 * Initialize Square Catalog with car wash services
 * Creates categories, items, and variations
 * Usage: node init-square-catalog.js generate|clear|verify
 */

const { config } = require('dotenv');
const { SquareClient, SquareEnvironment } = require('square');
const readline = require('readline');
const crypto = require('crypto');
const { program } = require('commander');
const serviceData = require('./car-wash-services.json');

// Load environment variables
config({ path: '.env.local' });

// SKU for tracking car wash services
const CAR_WASH_SERVICE_SKU = 'CAR-WASH-SERVICE';

// Initialize Square client
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

// Detect environment based on token
const environment = accessToken.startsWith('EAAA') 
  ? SquareEnvironment.Sandbox 
  : SquareEnvironment.Production;

const client = new SquareClient({
  token: accessToken,
  environment,
  userAgentDetail: 'car-wash-catalog-init'
});

/**
 * Retrieve the location
 * @returns {Location}
 */
async function retrieveLocation() {
  try {
    const response = await client.locations.list();
    
    if (!response.locations || response.locations.length === 0) {
      throw new Error('No locations found');
    }
    
    const location = response.locations[0];
    console.log(`📍 Using location: ${location.name} (${location.id})`);
    console.log(`💱 Currency: ${location.currency}`);
    return location;
  } catch (error) {
    if (error.statusCode === 401) {
      console.error('Unauthorized error - verify that your access token is valid');
    }
    console.error('Failed to retrieve location:', error.message);
    throw error;
  }
}

/**
 * Create team members for the car wash
 * @param {String} locationId
 * @returns {String[]} array of team member IDs
 */
async function createTeamMembers(locationId) {
  const teamMembers = [
    {
      givenName: 'John',
      familyName: 'Washer',
      emailAddress: 'john.washer@carwash-example.com',
    },
    {
      givenName: 'Jane',
      familyName: 'Detailer',
      emailAddress: 'jane.detailer@carwash-example.com',
    },
    {
      givenName: 'Mike',
      familyName: 'Cleaner',
      emailAddress: 'mike.cleaner@carwash-example.com',
    }
  ];
  
  const teamMemberIds = [];
  
  try {
    for (const memberData of teamMembers) {
      try {
        const response = await client.teamMembers.createTeamMember({
          idempotencyKey: crypto.randomUUID(),
          teamMember: {
            ...memberData,
            assignedLocations: {
              assignmentType: 'EXPLICIT_LOCATIONS',
              locationIds: [locationId],
            },
            status: 'ACTIVE'
          },
        });
        
        const { teamMember } = response;
        teamMemberIds.push(teamMember.id);
        console.log(`   ✅ Created team member: ${teamMember.givenName} ${teamMember.familyName}`);
      } catch (memberError) {
        console.error(`   ⚠️  Failed to create ${memberData.givenName} ${memberData.familyName}:`, memberError.message);
      }
    }
    
    console.log(`✅ Created ${teamMemberIds.length} team members`);
  } catch (error) {
    console.error('Creating team members failed:', error.message);
  }
  
  return teamMemberIds;
}

/**
 * Search for active team members at the location
 * @param {String} locationId
 * @returns {TeamMember[]}
 */
async function searchActiveTeamMembers(locationId) {
  try {
    const response = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE',
        },
      },
    });
    
    return response.teamMembers || [];
  } catch (error) {
    console.error(`Searching for team members failed:`, error.message);
    return [];
  }
}

/**
 * Process catalog objects for batch upsert
 * @param {Location} location
 * @param {String[]} teamMemberIds
 * @returns {Object[]} catalog objects ready for batch upsert
 */
function processCatalogObjects(location, teamMemberIds) {
  // Load the catalog data directly - it's already in the right format
  const catalogObjects = JSON.parse(JSON.stringify(serviceData)); // Deep clone to avoid mutation
  
  // Process each object to add runtime values
  catalogObjects.forEach(obj => {
    // Process items with variations
    if (obj.type === 'ITEM' && obj.itemData?.variations) {
      obj.itemData.variations.forEach(variation => {
        // Convert amount to BigInt
        if (variation.itemVariationData?.priceMoney?.amount) {
          variation.itemVariationData.priceMoney.amount = BigInt(variation.itemVariationData.priceMoney.amount);
          // Update currency based on location
          variation.itemVariationData.priceMoney.currency = location.currency || 'USD';
        }
        // Convert serviceDuration to BigInt
        if (variation.itemVariationData?.serviceDuration) {
          variation.itemVariationData.serviceDuration = BigInt(variation.itemVariationData.serviceDuration);
        }
        // Add team member IDs if available
        if (teamMemberIds.length > 0) {
          variation.itemVariationData.teamMemberIds = teamMemberIds;
        }
      });
    }
  });
  
  return catalogObjects;
}

/**
 * Create catalog items using batch upsert
 * @param {Object[]} catalogObjects
 */
async function createCatalog(catalogObjects) {
  try {
    const response = await client.catalog.batchUpsert({
      idempotencyKey: crypto.randomUUID(),
      batches: [{
        objects: catalogObjects
      }]
    });
    
    // Check for errors
    if (response.errors && response.errors.length > 0) {
      console.error('❌ Errors during catalog creation:');
      response.errors.forEach(error => {
        console.error(`   - ${error.category}: ${error.detail}`);
      });
      return null;
    }
    
    const createdCount = response.objects?.length || 0;
    console.log(`✅ Successfully created ${createdCount} catalog objects`);
    
    // Show ID mappings for categories
    if (response.idMappings && response.idMappings.length > 0) {
      console.log('\n📋 ID Mappings:');
      response.idMappings.forEach(mapping => {
        if (mapping.clientObjectId.includes('CAR') || 
            mapping.clientObjectId.includes('TRUCK') || 
            mapping.clientObjectId.includes('MINIVAN')) {
          console.log(`   ${mapping.clientObjectId} -> ${mapping.objectId}`);
        }
      });
    }
    
    return response;
  } catch (error) {
    console.error('Failed to create catalog:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.category}: ${err.detail}`);
      });
    }
    return null;
  }
}

/**
 * Search for catalog items with the car wash SKU
 * @param {String} locationId
 * @returns {CatalogObject[]}
 */
async function searchCarWashServices(locationId) {
  try {
    const response = await client.catalog.searchItems({
      enabledLocationIds: [locationId],
      productTypes: ['APPOINTMENTS_SERVICE'],
      textFilter: CAR_WASH_SERVICE_SKU,
    });
    
    return response.items || [];
  } catch (error) {
    console.error('Failed to search catalog items:', error.message);
    return [];
  }
}

/**
 * Delete all car wash service items
 * @param {String} locationId
 */
async function clearCarWashServices(locationId) {
  try {
    // Get all car wash service items
    const serviceItems = await searchCarWashServices(locationId);
    
    if (serviceItems.length === 0) {
      console.log('ℹ️  No car wash services to delete');
      return;
    }
    
    // Delete the items
    const response = await client.catalog.batchDelete({
      objectIds: serviceItems.map(item => item.id)
    });
    
    const deletedCount = response.deletedObjectIds?.length || 0;
    console.log(`✅ Deleted ${deletedCount} catalog items`);
  } catch (error) {
    console.error('Failed to clear car wash services:', error.message);
  }
}

/**
 * Delete all categories
 * @param {String} locationId
 */
async function clearCategories() {
  try {
    const response = await client.catalog.list({
      types: 'CATEGORY'
    });
    
    if (!response.objects || response.objects.length === 0) {
      console.log('ℹ️  No categories to delete');
      return;
    }
    
    // Filter for car wash categories
    const carWashCategories = response.objects.filter(obj => 
      obj.categoryData?.name === 'Small Car' ||
      obj.categoryData?.name === 'Truck' ||
      obj.categoryData?.name === 'Minivan'
    );
    
    if (carWashCategories.length === 0) {
      console.log('ℹ️  No car wash categories to delete');
      return;
    }
    
    const deleteResponse = await client.catalog.batchDelete({
      objectIds: carWashCategories.map(cat => cat.id)
    });
    
    const deletedCount = deleteResponse.deletedObjectIds?.length || 0;
    console.log(`✅ Deleted ${deletedCount} categories`);
  } catch (error) {
    console.error('Failed to clear categories:', error.message);
  }
}

/**
 * Deactivate team members for the location
 * @param {String} locationId
 */
async function deactivateTeamMembers(locationId) {
  try {
    const teamMembers = await searchActiveTeamMembers(locationId);
    
    // Filter for car wash team members
    const carWashMembers = teamMembers.filter(member => 
      member.emailAddress?.includes('carwash-example.com')
    );
    
    if (carWashMembers.length === 0) {
      console.log('ℹ️  No car wash team members to deactivate');
      return;
    }
    
    const teamMembersMap = carWashMembers.reduce((map, teamMember) => {
      map[teamMember.id] = {
        teamMember: {
          status: 'INACTIVE',
        },
      };
      return map;
    }, {});
    
    const response = await client.teamMembers.bulkUpdateTeamMembers({
      teamMembers: teamMembersMap
    });
    
    const deactivatedCount = Object.keys(response.teamMembers || {}).length;
    console.log(`✅ Deactivated ${deactivatedCount} team members`);
  } catch (error) {
    console.error('Failed to deactivate team members:', error.message);
  }
}

/**
 * Verify the catalog was created correctly
 * @param {String} locationId
 */
async function verifyCatalog(locationId) {
  try {
    // Check categories
    const catResponse = await client.catalog.list({
      types: 'CATEGORY'
    });
    
    const categories = (catResponse.objects || []).filter(obj =>
      obj.categoryData?.name === 'Small Car' ||
      obj.categoryData?.name === 'Truck' ||
      obj.categoryData?.name === 'Minivan'
    );
    
    // Check items
    const items = await searchCarWashServices(locationId);
    
    // Check variations
    const varResponse = await client.catalog.list({
      types: 'ITEM_VARIATION'
    });
    
    const variations = (varResponse.objects || []).filter(obj =>
      obj.itemVariationData?.sku === CAR_WASH_SERVICE_SKU
    );
    
    console.log('\n📊 Catalog Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Service Items: ${items.length}`);
    console.log(`   Variations: ${variations.length}`);
    
    // Show category assignments
    let assignedCount = 0;
    items.forEach(item => {
      if (item.itemData?.categories && item.itemData.categories.length > 0) {
        assignedCount++;
      }
    });
    
    if (assignedCount === items.length) {
      console.log(`   ✅ All ${assignedCount} items are assigned to categories`);
    } else {
      console.log(`   ⚠️  Only ${assignedCount}/${items.length} items have category assignments`);
    }
    
    // Check team members
    const teamResponse = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    });
    
    const teamMembers = teamResponse.teamMembers || [];
    console.log(`   Team Members: ${teamMembers.length}`);
    
  } catch (error) {
    console.error('Failed to verify catalog:', error.message);
  }
}

// CLI Commands
program
  .name('init-square-catalog')
  .description('Initialize Square catalog with car wash services')
  .version('1.0.0');

program
  .command('generate')
  .description('Create categories, items, and variations for car wash services')
  .action(async () => {
    console.log('🚗 Car Wash Catalog Generator');
    console.log(`🔧 Environment: ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'}`);
    console.log('━'.repeat(40));
    
    try {
      // Get location
      const location = await retrieveLocation();
      
      // Check for existing team members or create new ones
      let teamMemberIds = [];
      const existingMembers = await searchActiveTeamMembers(location.id);
      
      if (existingMembers.length > 0) {
        console.log(`ℹ️  Found ${existingMembers.length} existing team members`);
        teamMemberIds = existingMembers.map(m => m.id);
      } else {
        console.log('📝 Creating team members...');
        teamMemberIds = await createTeamMembers(location.id);
      }
      
      if (teamMemberIds.length === 0) {
        console.log('⚠️  No team members available. Services will be created without staff assignment.');
      }
      
      // Process catalog objects
      console.log('\n🔨 Processing catalog structure...');
      const catalogObjects = processCatalogObjects(location, teamMemberIds);
      console.log(`   Prepared ${catalogObjects.length} catalog objects`);
      
      // Create catalog
      console.log('\n📤 Uploading to Square...');
      const response = await createCatalog(catalogObjects);
      
      if (response) {
        // Verify the catalog
        console.log('\n🔍 Verifying catalog...');
        await verifyCatalog(location.id);
        
        console.log('\n✨ Car wash catalog successfully created!');
      }
      
    } catch (error) {
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    }
  });

program
  .command('clear')
  .description('Remove all car wash services, categories, and deactivate team members')
  .action(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    console.log('🚗 Car Wash Catalog Cleaner');
    console.log(`🔧 Environment: ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'}`);
    console.log('━'.repeat(40));
    
    rl.question('\n⚠️  Are you sure you want to delete all car wash services and deactivate team members? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          const location = await retrieveLocation();
          
          console.log('\n🧹 Starting cleanup...');
          
          // Deactivate team members
          console.log('\n👥 Deactivating team members...');
          await deactivateTeamMembers(location.id);
          
          // Clear services
          console.log('\n🗑️  Deleting car wash services...');
          await clearCarWashServices(location.id);
          
          // Clear categories
          console.log('\n📁 Deleting categories...');
          await clearCategories();
          
          console.log('\n✨ Cleanup complete!');
        } catch (error) {
          console.error('\n❌ Fatal error:', error.message);
        }
      } else {
        console.log('❌ Cleanup cancelled');
      }
      
      rl.close();
    });
  });

program
  .command('verify')
  .description('Verify the current catalog structure')
  .action(async () => {
    console.log('🚗 Car Wash Catalog Verifier');
    console.log(`🔧 Environment: ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'}`);
    console.log('━'.repeat(40));
    
    try {
      const location = await retrieveLocation();
      await verifyCatalog(location.id);
    } catch (error) {
      console.error('\n❌ Fatal error:', error.message);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}