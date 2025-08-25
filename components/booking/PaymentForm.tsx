'use client'

import React, { useState, useEffect } from 'react';
import {
  PaymentForm as SquarePaymentForm,
  CreditCard
} from 'react-square-web-payments-sdk';

interface PaymentFormProps {
  amount: number;
  onPaymentComplete: (token: string, verificationToken?: string) => void;
  onError: (error: Error) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  amount, 
  onPaymentComplete, 
  onError 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use state for environment variables to prevent hydration issues
  const [appId, setAppId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');

  useEffect(() => {
    // Set environment variables on client side only
    setAppId(process.env.NEXT_PUBLIC_SQUARE_APP_ID || '');
    setLocationId(process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '');
    setIsInitialized(true);
  }, []);

  const handleCardTokenizeResponse = async (token: any, verifiedBuyer: any) => {
    try {
      setIsProcessing(true);
      
      // Pass the payment token to parent component
      onPaymentComplete(
        token.token, 
        verifiedBuyer?.token
      );
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Wait for client-side initialization to prevent hydration mismatch
  if (!isInitialized) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-sm text-gray-600">Initializing payment form...</p>
        </div>
      </div>
    );
  }

  if (!appId || !locationId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Payment configuration is missing. Please contact support.
        </p>
        <p className="text-xs text-yellow-600 mt-2">
          App ID: {appId || 'Not configured'}
          <br />
          Location ID: {locationId || 'Not configured'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SquarePaymentForm
        applicationId={appId}
        locationId={locationId}
        cardTokenizeResponseReceived={handleCardTokenizeResponse}
      >
        {/* Card Payment */}
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Credit or Debit Card
          </h3>
          <CreditCard 
            buttonProps={{
              isLoading: isProcessing,
              css: {
                backgroundColor: '#3b82f6',
                fontSize: '16px',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#2563eb',
                },
                '&:disabled': {
                  backgroundColor: '#9ca3af',
                  cursor: 'not-allowed',
                },
              },
            }}
            style={{
              '.input-container': {
                borderColor: '#e5e7eb',
                borderRadius: '0.5rem',
              },
              '.message-text': {
                color: '#6b7280',
              },
              '.message-icon': {
                color: '#3b82f6',
              },
              'input': {
                fontSize: '16px',
              },
              'input::placeholder': {
                color: '#9ca3af',
              },
            }}
            callbacks={{
              cardBrandChanged: (event: any) => {
                // Handle card brand change if needed
                console.log('Card brand:', event.cardBrand);
              },
              postalCodeChanged: (event: any) => {
                // Handle postal code change if needed
                console.log('Postal code changed:', event.postalCode);
              },
              escape: () => {
                // Handle escape key if needed
                console.log('Escape pressed');
              },
              submit: () => {
                // This is called when the form is submitted
                console.log('Form submitted');
              }
            }}
          >
            {isProcessing ? 'Processing...' : `Pay ${(amount / 100).toFixed(2)} USD`}
          </CreditCard>
        </div>

        {/* Security Badge */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg flex items-center justify-center">
          <svg 
            className="w-5 h-5 text-green-600 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
          <span className="text-sm text-gray-600">
            Secure payment powered by Square
          </span>
        </div>
      </SquarePaymentForm>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-700">Processing payment...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;