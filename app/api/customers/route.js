import { customersApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/square/customers
 * List all customers
 */
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);

		// Optional parameters
		const cursor = searchParams.get('cursor');
		const limit = searchParams.get('limit');
		const sortField = searchParams.get('sort_field');
		const sortOrder = searchParams.get('sort_order');

		const response = await customersApi.list({
			cursor: cursor || undefined,
			limit: limit ? parseInt(limit) : undefined,
			sortField: sortField || undefined,
			sortOrder: sortOrder || undefined,
		});

		return successResponse(response.result || response);
	} catch (error) {
		return handleSquareError(error, 'Failed to fetch customers');
	}
}

/**
 * POST /api/square/customers
 * Create a new customer
 */
export async function POST(request) {
	try {
		const body = await request.json();
		const response = await customersApi.create(body);
		return successResponse(response.result || response);
	} catch (error) {
		return handleSquareError(error, 'Failed to create customer');
	}
}

/**
 * DELETE /api/square/customers
 * Delete all customers
 * WARNING: This will permanently delete ALL customers
 */
//! This is a destructive operation that will permanently delete ALL customers from your Square account.
/*
export async function DELETE() {

	try {
		let cursor = undefined;
		let hasMore = true;
		const errors = [];

		// Fetch and delete all customers with pagination
		while (hasMore) {
			const listResponse = await customersApi.list({
				cursor: cursor,
				limit: 100, // Max allowed by Square API
			});

			const customers = listResponse.response.customers || [];

			let customerIds = customers.map((c) => c.id);

			customersApi.bulkDeleteCustomers({
				customerIds,
			});

			// Check if there are more customers to fetch
			cursor = listResponse.result?.cursor;
			hasMore = !!cursor;

			let deletedCount = customerIds.length;

			const response = successResponse({
				message: `Successfully deleted ${deletedCount} customers`,
				deletedCount,
				errors: errors.length > 0 ? errors : undefined,
			});
			return response;
		}
	} catch (error) {
		return handleSquareError(error, 'Failed to delete customers');
	}
}
*/