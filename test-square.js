// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { SquareClient, SquareEnvironment } = require('square');

// Check if token is available
if (!process.env.SQUARE_ACCESS_TOKEN) {
  console.error('❌ Error: SQUARE_ACCESS_TOKEN not found in environment variables');
  console.error('Please ensure .env.local file exists with SQUARE_ACCESS_TOKEN set');
  process.exit(1);
}

const token = process.env.SQUARE_ACCESS_TOKEN;
const isSandbox = token.startsWith('EAAA');

console.log('Testing Square SDK directly...');
console.log('Environment:', isSandbox ? 'sandbox' : 'production');
console.log('Token prefix:', token.substring(0, 4) + '...');

const client = new SquareClient({
  token: token,
  environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production
});

console.log('Client created, attempting API calls...');

// Function to serialize BigInt values
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// Get locations first
client.locations.list()
  .then(response => {
    console.log('\n✅ Locations retrieved successfully!');
    if (response.result && response.result.locations) {
      console.log('Location ID:', response.result.locations[0].id);
      console.log('Location Name:', response.result.locations[0].name);
    }
    
    // Now get categories
    console.log('\n📦 Fetching catalog categories...');
    return client.catalog.list();
  })
  .then(catalogResponse => {
    console.log('\n✅ Catalog retrieved!');
    
    // Serialize to handle BigInt
    const data = serializeBigInt(catalogResponse.result || catalogResponse);
    
    // Filter for categories only
    const categories = data.objects?.filter(obj => obj.type === 'CATEGORY') || [];
    
    console.log(`\nFound ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`- ${category.category_data?.name || category.categoryData?.name} (ID: ${category.id})`);
    });
    
    // Also show items grouped by category if any
    const items = data.objects?.filter(obj => obj.type === 'ITEM') || [];
    console.log(`\nFound ${items.length} items total`);
    
    if (items.length > 0) {
      console.log('\nItems by service type:');
      items.forEach(item => {
        const itemData = item.item_data || item.itemData;
        console.log(`- ${itemData?.name}: ${itemData?.description}`);
        if (itemData?.variations) {
          itemData.variations.forEach(variation => {
            const varData = variation.item_variation_data || variation.itemVariationData;
            const price = varData?.price_money || varData?.priceMoney;
            console.log(`  • ${varData?.name}: ${price?.amount / 1000} ${price?.currency}`);
          });
        }
      });
    }
  })
  .catch(error => {
    console.log('\n❌ Error:', error.statusCode || error.message);
    console.log('Body:', error.body ? JSON.stringify(error.body, null, 2) : 'No body');
  });