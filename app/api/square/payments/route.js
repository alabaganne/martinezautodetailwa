import { paymentsApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * POST /api/square/payments
 * Create a payment with optional verification
 * 
 * Request body should include:
 * {
 *   source_id: "token_from_square_web_payments_sdk",
 *   verification_token: "verification_token_from_sdk", // Optional, for SCA
 *   idempotency_key: "unique_key",
 *   amount_money: {
 *     amount: 1000,
 *     currency: "USD"
 *   },
 *   location_id: "location_id",
 *   autocomplete: true, // Whether to capture immediately or just authorize
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
    
    // Add verification token if provided (for SCA)
    const paymentRequest = {
      ...body,
      source_id: body.source_id,
      idempotency_key: body.idempotency_key,
      amount_money: body.amount_money,
      location_id: body.location_id || process.env.SQUARE_LOCATION_ID,
      autocomplete: body.autocomplete !== false, // Default to true
      verification_token: body.verification_token,
      reference_id: body.reference_id,
      note: body.note,
      customer_id: body.customer_id
    };
    
    // Remove undefined fields
    Object.keys(paymentRequest).forEach(key => {
      if (paymentRequest[key] === undefined) {
        delete paymentRequest[key];
      }
    });
    
    const response = await paymentsApi.create(paymentRequest);
    
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