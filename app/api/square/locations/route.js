import { locationsApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/square/locations
 * List all Square locations
 */
export async function GET() {
  console.log('Fetching Square locations...');
  try {
    const response = await locationsApi.list();
    console.log('Locations API response:', response);
    return successResponse(response.result || response);
  } catch (error) {
    console.error('Locations API error:', error);
    return handleSquareError(error, 'Failed to fetch locations');
  }
}