import { teamMembersApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * GET /api/square/team
 * List team members
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Optional parameters
    const locationIds = searchParams.get('location_ids');
    const cursor = searchParams.get('cursor');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');
    
    const response = await teamMembersApi.search({
      query: {
        filter: {
          locationIds: locationIds ? locationIds.split(',') : undefined,
          status: status || undefined
        }
      },
      cursor: cursor || undefined,
      limit: limit ? parseInt(limit) : undefined
    });
    
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to fetch team members');
  }
}

/**
 * POST /api/square/team/search
 * Search team members with more complex filters
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const response = await teamMembersApi.search(body);
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to search team members');
  }
}