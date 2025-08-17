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

const client = new SquareClient({
  token: token,
  environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production
});

async function fetchCatalog() {
  try {
    console.log('\n📦 Fetching catalog from API endpoints...');
    
    // Use the new API endpoints instead of SDK
    const response = await fetch('http://localhost:3000/api/square/catalog/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        object_types: ['CATEGORY', 'ITEM']
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ Catalog retrieved successfully!');
    console.log(`Found ${data.objects?.length || 0} objects`);
    
    // Separate categories and items
    const categories = data.objects?.filter(obj => obj.type === 'CATEGORY') || [];
    const items = data.objects?.filter(obj => obj.type === 'ITEM') || [];
    
    console.log(`\n📂 Categories: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`  - ${cat.category_data?.name || cat.id}`);
    });
    
    console.log(`\n📦 Items: ${items.length}`);
    items.forEach(item => {
      const itemData = item.item_data || item.itemData;
      console.log(`  - ${itemData?.name}: ${itemData?.description}`);
    });
    
    return data;
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('Make sure the server is running on port 3000');
  }
}

// Run the fetch
fetchCatalog();