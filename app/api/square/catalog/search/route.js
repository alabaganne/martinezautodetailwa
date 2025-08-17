import { getSquareApiUrl } from '../../lib/client';
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
    
    // Use direct HTTP request for better control
    const token = process.env.SQUARE_ACCESS_TOKEN;
    const baseUrl = getSquareApiUrl();
    
    const response = await fetch(`${baseUrl}/v2/catalog/search`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        statusCode: response.status,
        result: errorData
      };
    }

    const searchResults = await response.json();
    return successResponse(searchResults);
  } catch (error) {
    return handleSquareError(error, 'Failed to search catalog');
  }
}