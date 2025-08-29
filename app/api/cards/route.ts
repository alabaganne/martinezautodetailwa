import { cardsApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';

/**
 * POST /api/cards
 * Store a card on file for a customer
 * 
 * Required fields:
 * - customerId: Square customer ID
 * - paymentToken: Payment token from Square Web Payments SDK
 * 
 * Returns the stored card details
 */
interface StoreCardRequest {
  customerId: string;
  paymentToken: string;
}

export async function POST(request: Request) {
  try {
    const body: StoreCardRequest = await request.json();
    const { customerId, paymentToken } = body;

    if (!customerId || !paymentToken) {
      return new Response(
        JSON.stringify({ error: 'customerId and paymentToken are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate idempotency key for the request
    const idempotencyKey = `card-${customerId}-${Date.now()}`;

    // Store the card on file
    const response = await cardsApi.createCard({
      idempotencyKey,
      sourceId: paymentToken,
      card: {
        customerId,
      },
    });

    if (response.errors) {
      console.error('Failed to store card:', response.errors);
      return handleSquareError(response.errors[0], 'Failed to store card');
    }

    return successResponse(response.card);
  } catch (error) {
    console.error('Cards API error:', error);
    return handleSquareError(error, 'Failed to store card on file');
  }
}