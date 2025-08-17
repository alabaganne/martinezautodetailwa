#!/usr/bin/env node

/**
 * Cleanup Square Catalog - Deletes catalog items
 * Usage: 
 *   node cleanup-catalog.js          # Delete everything
 *   node cleanup-catalog.js --items  # Delete only items and variations (keep categories)
 */

const { config } = require('dotenv');
const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
config({ path: '.env.local' });

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

const environment = accessToken.startsWith('EAAA') 
  ? SquareEnvironment.Sandbox 
  : SquareEnvironment.Production;

const client = new SquareClient({
  token: accessToken,
  environment,
  userAgentDetail: 'car-wash-catalog-cleanup'
});

console.log(`🔧 Using ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'} environment`);

/**
 * Main cleanup function
 */
async function cleanupCatalog() {
  try {
    
    // Fetch all catalog objects
    let allObjects = [];
    let cursor = undefined;
    let hasMore = true;
    
    while (hasMore) {
      const response = await client.catalog.list({
        cursor: cursor
      });
      
      if (response.data) {
        allObjects = allObjects.concat(response.data);
      }
      
      cursor = response.cursor;
      hasMore = !!cursor;
    }
    
    console.log('allObjects', allObjects.length);
    // Keep only items and variations
    allObjects = allObjects.filter(obj => 
      obj.type === 'ITEM' || 
      obj.type === 'ITEM_VARIATION' ||
      obj.type === 'MODIFIER' ||
      obj.type === 'MODIFIER_LIST'
    );
    console.log(`   ✅ Found ${allObjects.length} items and variations to delete`);
    
    if (allObjects.length === 0) {
      console.log('\n✨ Nothing to delete.\n');
      return;
    }
    
    // Count by type
    const typeCounts = {};
    allObjects.forEach(obj => {
      typeCounts[obj.type] = (typeCounts[obj.type] || 0) + 1;
    });
    
    console.log('\n📊 Objects to delete:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    
    // Delete all objects
    console.log('\n🗑️  Deleting catalog objects...');
    
    const objectIds = allObjects.map(obj => obj.id);
    const deleteRequest = {
      objectIds: objectIds
    };
    
    try {
      const deleteResponse = await client.catalog.batchDelete(deleteRequest);
      
      if (deleteResponse.deletedObjectIds) {
        console.log(`   ✅ Successfully deleted ${deleteResponse.deletedObjectIds.length} objects`);
      }
      
      if (deleteResponse.deletedAt) {
        console.log(`   📅 Deleted at: ${new Date(deleteResponse.deletedAt).toLocaleString()}`);
      }
      
    } catch (deleteError) {
      console.error('❌ Error during deletion:', deleteError.message);
      if (deleteError.errors) {
        deleteError.errors.forEach(err => {
          console.error(`   - ${err.category}: ${err.detail}`);
        });
      }
    }
    
    console.log('\n✨ Catalog cleanup complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.category}: ${err.detail}`);
      });
    }
    process.exit(1);
  }
}

// Run cleanup
cleanupCatalog();