#!/usr/bin/env node

/**
 * Set all item variation prices to 0 in Square Catalog
 * Usage: node scripts/set-prices-to-zero.js
 */

import { randomUUID } from 'crypto';
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
  userAgentDetail: 'set-prices-to-zero'
});

/**
 * Retrieve all catalog variations directly
 */
async function getAllCatalogVariations() {
  try {
    console.log('📋 Fetching catalog variations from Square...');
    
    const response = await client.catalog.search({
      objectTypes: ['ITEM_VARIATION'],
      includeDeletedObjects: false,
    });
    
    const variations = response.objects || [];
    console.log(`✓ Found ${variations.length} catalog variations`);
    
    return variations;
  } catch (error) {
    console.error('❌ Failed to fetch catalog variations:', error.message);
    throw error;
  }
}

/**
 * Retrieve all catalog items for display purposes
 */
async function getAllCatalogItems() {
  try {
    const response = await client.catalog.search({
      objectTypes: ['ITEM'],
      includeDeletedObjects: false,
    });
    
    return response.objects || [];
  } catch (error) {
    console.error('❌ Failed to fetch catalog items:', error.message);
    return [];
  }
}

/**
 * Prepare variation update objects
 */
function prepareVariationUpdates(variations) {
  const variationsToUpdate = [];
  
  for (const variation of variations) {
    // Only update variations that have a price set
    if (variation.itemVariationData?.priceMoney) {
      variationsToUpdate.push({
        type: 'ITEM_VARIATION',
        id: variation.id,
        version: variation.version, // Required for optimistic locking
        presentAtAllLocations: variation.presentAtAllLocations ?? true,
        itemVariationData: {
          itemId: variation.itemVariationData.itemId,
          name: variation.itemVariationData.name,
          sku: variation.itemVariationData.sku,
          availableForBooking: variation.itemVariationData.availableForBooking ?? true,
          pricingType: 'FIXED_PRICING',
          priceMoney: {
            amount: BigInt(0), // Set price to $0.00
            currency: variation.itemVariationData.priceMoney.currency || 'USD',
          },
          serviceDuration: variation.itemVariationData.serviceDuration,
        },
      });
    }
  }
  
  return variationsToUpdate;
}

/**
 * Update all variations using batch upsert
 */
async function updateVariations(variations) {
  if (variations.length === 0) {
    console.log('⚠️  No variations found to update');
    return;
  }
  
  console.log(`\n🔄 Updating ${variations.length} item variations...`);
  
  // Square API has a limit on batch size, so we'll process in batches of 100
  const batchSize = 100;
  let updatedCount = 0;
  let failedCount = 0;
  const failedVariations = [];
  
  for (let i = 0; i < variations.length; i += batchSize) {
    const batch = variations.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    console.log(`  Processing batch ${batchNumber} (${batch.length} variations)...`);
    
    try {
      const response = await client.catalog.batchUpsert({
        idempotencyKey: randomUUID(),
        batches: [
          {
            objects: batch,
          },
        ],
      });
      
      if (response.errors && response.errors.length > 0) {
        console.error(`  ⚠️  Some errors occurred in batch ${batchNumber}:`);
        response.errors.forEach((error, idx) => {
          const variation = batch[idx] || { id: 'unknown' };
          console.error(`    - ${variation.id}: ${error.code} - ${error.detail}`);
          failedVariations.push({ variation: variation.id, error: error.detail });
          failedCount++;
        });
        // Count successful ones
        updatedCount += batch.length - response.errors.length;
      } else {
        updatedCount += batch.length;
        console.log(`  ✓ Successfully updated ${batch.length} variations`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to process batch ${batchNumber}:`, error.message);
      if (error.errors) {
        error.errors.forEach(err => {
          console.error(`    - ${err.code}: ${err.detail}`);
        });
      }
      // Mark all in this batch as failed
      failedCount += batch.length;
      batch.forEach(v => {
        failedVariations.push({ variation: v.id, error: error.message });
      });
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully updated: ${updatedCount} variations`);
  if (failedCount > 0) {
    console.log(`   ❌ Failed: ${failedCount} variations`);
  }
  
  if (failedVariations.length > 0) {
    console.log(`\n⚠️  Failed variations:`);
    failedVariations.forEach(({ variation, error }) => {
      console.log(`   - ${variation}: ${error}`);
    });
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('💰 Set All Item Variation Prices to Zero');
  console.log(`🔧 Environment: ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'}`);
  console.log('━'.repeat(50));
  
  try {
    // Get all catalog variations
    const variations = await getAllCatalogVariations();
    
    // Get items for display purposes
    const items = await getAllCatalogItems();
    
    // Prepare variation updates
    const variationsToUpdate = prepareVariationUpdates(variations);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total variations found: ${variations.length}`);
    console.log(`   Variations to update: ${variationsToUpdate.length}`);
    
    if (variationsToUpdate.length === 0) {
      console.log('\n⚠️  No variations with prices found. Nothing to update.');
      return;
    }
    
    // Show what will be updated
    console.log('\n📝 Variations that will be updated:');
    for (const variation of variationsToUpdate) {
      // Try to find the item name from the itemId
      const itemId = variation.itemVariationData.itemId;
      const item = items.find(i => i.id === itemId);
      const itemName = item?.itemData?.name || 'Unknown';
      console.log(`   - ${itemName} > ${variation.itemVariationData.name} (${variation.id})`);
    }
    
    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will set all variation prices to $0.00');
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update variations
    await updateVariations(variationsToUpdate);
    
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.code}: ${err.detail}`);
      });
    }
    process.exit(1);
  }
}

// Run the script
main();

