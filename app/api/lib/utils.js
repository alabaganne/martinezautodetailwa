import { NextResponse } from 'next/server';

/**
 * Helper function to handle BigInt serialization in Square API responses
 * Square API returns BigInt values that can't be serialized directly to JSON
 */
export function serializeSquareResponse(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

/**
 * Standard error response handler for Square API errors
 */
export function handleSquareError(error, defaultMessage = 'An error occurred') {
  console.error('Square API Error:', error);
  
  // Handle Square API errors with proper status codes
  if (error.result?.errors) {
    return NextResponse.json(
      { errors: error.result.errors },
      { status: error.statusCode || 400 }
    );
  }
  
  // Handle other errors
  return NextResponse.json(
    { 
      error: error.message || defaultMessage,
      details: error.body || undefined 
    },
    { status: error.statusCode || 500 }
  );
}

/**
 * Standard success response handler
 */
export function successResponse(data) {
  return NextResponse.json(serializeSquareResponse(data));
}