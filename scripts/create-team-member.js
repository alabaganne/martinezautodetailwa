import { SquareClient, SquareEnvironment } from 'square';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
	try {
		const filePath = path.join(__dirname, 'team-members.json');
		const file = fs.readFileSync(filePath, 'utf-8');
		const data = JSON.parse(file);

		const client = new SquareClient({
			token: process.env.SQUARE_ACCESS_TOKEN,
			environment: SquareEnvironment.Sandbox,
		});

		console.log(`Creating ${data.length} team member(s) to Square...`);

		const response = await client.teamMembers.batchCreate({
			teamMembers: data
		});

		console.log('✅ Team members added successfully!');
		console.log('Response', response);
	} catch (error) {
		console.error('❌ Error creating team member(s):', error);
		process.exit(1);
	}
}

main();
