// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { SquareClient, SquareEnvironment } = require('square');

const token = process.env.SQUARE_ACCESS_TOKEN;
const isSandbox = token.startsWith('EAAA');

console.log('Testing Square Catalog API directly...');

const client = new SquareClient({
  token: token,
  environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production
});

async function testCatalog() {
  try {
    // Test with search method
    console.log('\nTrying catalog.search()...');
    const searchResponse = await client.catalog.search({
      objectTypes: ['ITEM']
    });
    console.log('Full response:', JSON.stringify(searchResponse, null, 2));
    console.log('Objects found:', searchResponse.result?.objects?.length || 0);
    
    if (searchResponse.result?.objects?.length > 0) {
      console.log('First item:', searchResponse.result.objects[0].itemData?.name);
    }
  } catch (error) {
    console.error('Search error:', error);
  }
  
  try {
    // Test with list method
    console.log('\nTrying catalog.list()...');
    const listResponse = await client.catalog.list();
    console.log('Full response:', JSON.stringify(listResponse, null, 2));
    console.log('Objects found:', listResponse.result?.objects?.length || 0);
  } catch (error) {
    console.error('List error:', error);
  }
}

testCatalog();