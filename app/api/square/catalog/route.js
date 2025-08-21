import { catalogApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/square/catalog
 * List catalog items directly from Square API
 * 
 * Query parameters:
 * - types: Comma-separated list of object types (ITEM, CATEGORY, etc.)
 * - cursor: Pagination cursor
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const types = searchParams.get('types');
    const cursor = searchParams.get('cursor');
    
    const response = await catalogApi.list(
      cursor || undefined,
      types || undefined
    );
    
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to fetch catalog');
  }
}