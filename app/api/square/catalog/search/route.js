import client from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';

/**
 * POST /api/square/catalog/search
 * Search catalog items with advanced filtering
 * 
 * Request body:
 * {
 *   object_types: ["ITEM", "CATEGORY"],
 *   query: { ... },
 *   limit: 100,
 *   cursor: "...",
 *   include_related_objects: true
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const response = await client.catalog.searchObjects(body);
    return successResponse(response);
  } catch (error) {
    return handleSquareError(error, 'Failed to search catalog');
  }
}