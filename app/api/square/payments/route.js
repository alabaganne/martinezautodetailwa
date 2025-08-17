import { paymentsApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * POST /api/square/payments
 * Create a payment
 * 
 * Request body should include:
 * {
 *   source_id: "token_from_square_web_payments_sdk",
 *   idempotency_key: "unique_key",
 *   amount_money: {
 *     amount: 1000,
 *     currency: "USD"
 *   },
 *   location_id: "location_id",
 *   // Optional fields:
 *   reference_id: "booking_id",
 *   note: "Payment note",
 *   customer_id: "customer_id"
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.source_id) {
      return handleSquareError(
        { message: 'source_id is required for payment' },
        'Missing payment source'
      );
    }
    
    if (!body.idempotency_key) {
      // Generate one if not provided
      body.idempotency_key = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (!body.amount_money) {
      return handleSquareError(
        { message: 'amount_money is required for payment' },
        'Missing payment amount'
      );
    }
    
    const response = await paymentsApi.create(body);
    
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to process payment');
  }
}

/**
 * GET /api/square/payments
 * List payments
 * 
 * Query parameters:
 * - begin_time: Start of time range
 * - end_time: End of time range
 * - sort_order: ASC or DESC
 * - cursor: Pagination cursor
 * - location_id: Filter by location
 * - limit: Maximum number of results
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const beginTime = searchParams.get('begin_time');
    const endTime = searchParams.get('end_time');
    const sortOrder = searchParams.get('sort_order');
    const cursor = searchParams.get('cursor');
    const locationId = searchParams.get('location_id');
    const limit = searchParams.get('limit');
    
    const response = await paymentsApi.list(
      beginTime,
      endTime,
      sortOrder,
      cursor,
      locationId,
      undefined, // total
      undefined, // last4
      undefined, // cardBrand
      limit ? parseInt(limit) : undefined
    );
    
    return successResponse(response.result || response);
  } catch (error) {
    return handleSquareError(error, 'Failed to fetch payments');
  }
}