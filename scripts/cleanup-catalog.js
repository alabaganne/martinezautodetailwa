#!/usr/bin/env node

/**
 * Cleanup Square Catalog - Deletes ALL catalog objects
 * Usage: node cleanup-catalog.js
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

const client = new SquareClient({
  token: accessToken,
  environment: accessToken.startsWith('EAAA') ? SquareEnvironment.Sandbox : SquareEnvironment.Production
});

async function main() {
  try {
    // Get all catalog objects
    const listResponse = await client.catalog.list({});
    const objects = listResponse.objects || [];
    
    if (objects.length === 0) {
      console.log('No catalog objects to delete');
      return;
    }
    
    // Delete all objects
    const deleteResponse = await client.catalog.batchDelete({
      objectIds: objects.map(obj => obj.id)
    });
    
    console.log(`✅ Deleted ${deleteResponse.deletedObjectIds?.length || 0} catalog objects`);
    
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

main();