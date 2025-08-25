#!/usr/bin/env node

/**
 * View Square Team Members
 * Usage: node view-team.js
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
  token: accessToken,
  environment,
});


/**
 * List active team members
 */
async function listTeamMembers() {
  try {
    const response = await client.teamMembers.search({
      query: {
        filter: {
          status: 'ACTIVE'
        }
      }
    });
    
    const teamMembers = response.teamMembers || [];
    console.log(`Found ${teamMembers.length} active team members:`);
    
    console.log('teamMembers', teamMembers);
    
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('👥 Square Team Members Viewer');
  console.log(`🔧 Environment: ${environment === SquareEnvironment.Sandbox ? 'Sandbox' : 'Production'}`);
  console.log('━'.repeat(40));
  console.log();
  
  await listTeamMembers();
}

// Run the script
main();