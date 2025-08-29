import { randomUUID } from 'crypto';
import { SquareClient, SquareEnvironment } from 'square';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';

config({ path: '.env.local' });

// Convert specific fields to BigInt for Square API
function convertToBigInt(obj) {
	if (Array.isArray(obj)) {
		return obj.map(convertToBigInt);
	} else if (obj !== null && typeof obj === 'object') {
		const result = {};
		for (const [key, value] of Object.entries(obj)) {
			if (key === 'amount' && typeof value === 'string') {
				// Convert amount strings to BigInt
				result[key] = BigInt(value);
			} else if (key === 'serviceDuration' && typeof value === 'number') {
				// Convert serviceDuration numbers to BigInt
				result[key] = BigInt(value);
			} else {
				// Recursively process nested objects
				result[key] = convertToBigInt(value);
			}
		}
		return result;
	}
	return obj;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
	try {
		// Read the catalog.json file
		const catalogPath = path.join(__dirname, 'catalog.json');
		const catalogData = fs.readFileSync(catalogPath, 'utf-8');
		const catalogObjects = convertToBigInt(JSON.parse(catalogData));

		const client = new SquareClient({
			token: process.env.SQUARE_ACCESS_TOKEN,
			environment: SquareEnvironment.Sandbox,
		});

		console.log(`Uploading ${catalogObjects.length} catalog items to Square...`);

		const response = await client.catalog.batchUpsert({
			idempotencyKey: randomUUID(),
			batches: [
				{
					objects: catalogObjects,
				},
			],
		});

		console.log('✅ Catalog items uploaded successfully!');
		console.log(`Created/Updated ${response.objects?.length || 0} items`);
	} catch (error) {
		console.error('❌ Error creating catalog:', error);
		process.exit(1);
	}
}

main();
