import { customersApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';

/**
 * GET /api/square/customers/[id]
 * Get a specific customer by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return handleSquareError(
        { message: 'Customer ID is required' },
        'Customer ID is required'
      );
    }
    
    const response = await customersApi.get({
      customerId: id
    });
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to fetch customer');
  }
}

/**
 * PUT /api/square/customers/[id]
 * Update a customer
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return handleSquareError(
        { message: 'Customer ID is required' },
        'Customer ID is required'
      );
    }
    
    const response = await customersApi.update(id, body);
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to update customer');
  }
}

/**
 * DELETE /api/square/customers/[id]
 * Delete a customer
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return handleSquareError(
        { message: 'Customer ID is required' },
        'Customer ID is required'
      );
    }
    
    const response = await customersApi.delete(id);
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to delete customer');
  }
}