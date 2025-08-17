import client from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/square/catalog
 * List catalog items
 * 
 * Query parameters:
 * - types: Comma-separated list of object types (ITEM, CATEGORY, etc.)
 * - cursor: Pagination cursor
 */
export async function GET(request) {
  try {
    const catalog = await client.catalog.list({});

    const catalogData = catalog.data;
    
    return successResponse(catalogData);
  } catch (error) {
    return handleSquareError(error, 'Failed to fetch catalog');
  }
}