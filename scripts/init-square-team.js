#!/usr/bin/env node

/**
 * Initialize Square Team Members
 * Usage: node init-square-team.js create|list
 */

const { config } = require('dotenv');
const { SquareClient, SquareEnvironment } = require('square');
const { program } = require('commander');
const teamData = require('./team-members.json');

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
  userAgentDetail: 'car-wash-team-init'
});

/**
 * Create team members using batch create
 */
async function createTeamMembers() {
  try {
    const response = await client.teamMembers.batchCreate({
      teamMembers: teamData
    });
    
    // Check for errors
    if (response.errors && response.errors.length > 0) {
      console.error('❌ Errors:');
      response.errors.forEach(error => {
        console.error(`   ${error.detail}`);
      });
      return;
    }
    
    // Display created team members
    const teamMembers = response.teamMembers || {};
    const count = Object.keys(teamMembers).length;
    console.log(`✅ Created ${count} team members`);
    
    Object.values(teamMembers).forEach(member => {
      if (member && member.givenName) {
        console.log(`   ${member.givenName} ${member.familyName}: ${member.id}`);
      }
    });
    
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

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
    
    teamMembers.forEach(member => {
      console.log(`   ${member.givenName} ${member.familyName}: ${member.id}`);
    });
    
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

// CLI Commands
program
  .name('init-square-team')
  .description('Manage Square team members')
  .version('1.0.0');

program
  .command('create')
  .description('Create team members from JSON')
  .action(createTeamMembers);

program
  .command('list')
  .description('List all active team members')
  .action(listTeamMembers);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}