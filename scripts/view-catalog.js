#!/usr/bin/env node

/**
 * View Square Catalog for car wash services
 * Displays categories, items, and variations
 * Usage: node view-catalog.js
 */

const { config } = require('dotenv');
const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
config({ path: '.env.local' });

// Initialize Square client
let accessToken = process.env.SQUARE_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ SQUARE_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}

// Detect environment based on token
let environment = accessToken.startsWith('EAAA') 
  ? SquareEnvironment.Sandbox 
  : SquareEnvironment.Production;

accessToken = 'EAAAl7xq0Hh3Qj-5YGPND-_DrN8XqN5g9kqv8J00oHa5IVcoD9ogwuOqzSBdA3ih';
environment = SquareEnvironment.Production;

const client = new SquareClient({
  token: accessToken,
  environment,
  userAgentDetail: 'car-wash-catalog-init'
});

/**
 * Retrieve the location
 * @returns {Location}
 */
async function showLocation() {
  try {
    const {locations} = await client.locations.list();
    
    console.log('📍 Locations:', locations);
  } catch (error) {
    if (error.statusCode === 401) {
      console.error('Unauthorized error - verify that your access token is valid');
    }
    console.error('Failed to retrieve location:', error.message);
    throw error;
  }
}


/**
 * Verify the catalog was created correctly
 * @param {String} locationId
 */
async function showCatalog() {
  try {
    // Check categories
    const catalog = await client.catalog.list();
    
    console.log('📋 Catalog:', catalog);
  } catch (error) {
    console.error('Failed to verify catalog:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚗 Car Wash Catalog Viewer');
  console.log(`🔧 Environment: ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'}`);
  console.log('━'.repeat(40));
  
  try {
    showLocation();
    await showCatalog();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();