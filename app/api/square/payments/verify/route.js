import { paymentsApi } from '../../lib/client';
import { successResponse, handleSquareError } from '../../lib/utils';

/**
 * POST /api/square/payments/verify
 * Verify a payment token before processing
 * 
 * Request body should include:
 * {
 *   source_id: "payment_token",
 *   verification_token: "verification_token", // For SCA
 *   amount: 10000, // Amount in cents
 *   billing_contact: {
 *     given_name: "John",
 *     family_name: "Doe",
 *     email: "john@example.com",
 *     phone: "5551234567",
 *     address_lines: ["123 Main St"],
 *     city: "City",
 *     state: "ST",
 *     country_code: "US"
 *   }
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.source_id) {
      return handleSquareError(
        { message: 'source_id is required for verification' },
        'Missing payment source'
      );
    }
    
    if (!body.amount) {
      return handleSquareError(
        { message: 'amount is required for verification' },
        'Missing amount'
      );
    }
    
    // Create verification details
    const verificationDetails = {
      amount: (body.amount / 100).toFixed(2), // Convert cents to dollars string
      currency_code: 'USD',
      intent: 'CHARGE',
      billing_contact: body.billing_contact || {
        given_name: '',
        family_name: '',
        email: '',
        phone: '',
        address_lines: [''],
        city: '',
        state: '',
        country_code: 'US'
      }
    };
    
    // For now, we'll just validate the token format
    // In production, you might want to perform additional verification
    // or create a test payment with $0 amount
    
    if (!body.source_id.startsWith('cnon:') && !body.source_id.startsWith('ccof:')) {
      return handleSquareError(
        { message: 'Invalid payment token format' },
        'Invalid token'
      );
    }
    
    // Return success with verification details
    return successResponse({
      verified: true,
      token: body.source_id,
      verification_token: body.verification_token,
      amount: body.amount,
      verification_details: verificationDetails
    });
    
  } catch (error) {
    return handleSquareError(error, 'Failed to verify payment');
  }
}

/**
 * GET /api/square/payments/verify
 * Get payment verification status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    
    if (!paymentId) {
      return handleSquareError(
        { message: 'payment_id is required' },
        'Missing payment ID'
      );
    }
    
    // Get payment details
    const response = await paymentsApi.get(paymentId);
    const payment = response.result?.payment;
    
    if (!payment) {
      return handleSquareError(
        { message: 'Payment not found' },
        'Payment not found'
      );
    }
    
    return successResponse({
      payment_id: payment.id,
      status: payment.status,
      amount: payment.amountMoney?.amount,
      currency: payment.amountMoney?.currency,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
      reference_id: payment.referenceId,
      verified: payment.status === 'COMPLETED' || payment.status === 'APPROVED'
    });
    
  } catch (error) {
    return handleSquareError(error, 'Failed to get payment status');
  }
}