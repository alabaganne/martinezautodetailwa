'use client'

import React, { useState } from 'react';
import { BookingFormData } from '@/contexts/BookingContext';
import { useLocation } from '@/contexts/LocationContext';
import { useCatalog } from '@/contexts/CatalogContext';
import { displayPrice } from '@/lib/utils/currency';
import { 
  PaymentForm, 
  CreditCard
} from 'react-square-web-payments-sdk';

interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  isActive?: boolean;
}

const Payment: React.FC<StepProps> = ({ formData, setFormData }) => {
  const { locationId, loading: locationLoading } = useLocation();
  const { selectedService } = useCatalog();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const noShowFee = selectedService ? selectedService.price * 0.35 : 0;

  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;

  const handlePaymentToken = async (token: any) => {
    try {
      setIsProcessing(true);
      setPaymentError(null);

      // Store payment token and card details in formData
      setFormData(prev => ({
        ...prev,
        paymentToken: token.token,
        cardLastFour: token.details?.card?.last4 || '',
        cardBrand: token.details?.card?.brand || ''
      }));

      // Payment token successfully stored
      console.log('Payment token stored:', token);
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError('Failed to process payment information. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (locationLoading) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
          Card on File
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </div>
    );
  }

  if (!applicationId || !locationId) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
          Card on File
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Payment configuration is missing. Please contact support.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
        Card on File
      </h2>

      <div className="space-y-6">
        {/* No-Show Policy Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">No-Show Protection Policy</p>
              <p className="mb-2">Your card is saved for security purposes only.</p>
              <ul className="space-y-1">
                <li>• Payment will be collected <strong>in-store after service</strong></li>
                <li>• If you miss your appointment without notice, a <strong>{displayPrice(noShowFee)} no-show fee</strong> (35% of service price) will be charged</li>
                <li>• No charges will be made at booking time</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Saved Card Display */}
        {formData.paymentToken && formData.cardLastFour && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">
                  {formData.cardBrand} ending in {formData.cardLastFour} saved for no-show protection
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    paymentToken: '',
                    cardLastFour: '',
                    cardBrand: ''
                  }));
                }}
                className="text-sm text-green-700 hover:text-green-900 underline"
              >
                Change card
              </button>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {(!formData.paymentToken || !formData.cardLastFour) && (
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <PaymentForm
              applicationId={applicationId}
              locationId={locationId}
              cardTokenizeResponseReceived={handlePaymentToken}
              createPaymentRequest={() => ({
                countryCode: 'US',
                currencyCode: 'USD',
                total: {
                  amount: '0',
                  label: 'Authorization Only'
                }
              })}
            >
                <CreditCard 
                  buttonProps={{
                    css: {
                      "[data-theme='dark'] &": {
                        backgroundColor: '#2563eb',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#1d4ed8'
                        }
                      },
                      backgroundColor: '#2563eb',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'white',
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.6 : 1,
                      '&:hover': {
                        backgroundColor: '#1d4ed8'
                      }
                    }
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Save Card for No-Show Protection'}
                </CreditCard>
            </PaymentForm>
          </div>
        )}

        {/* Payment in Store Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div className="text-sm text-green-800">
              <p className="font-semibold">Full payment of {displayPrice(selectedService?.price || 0)} will be collected in-store after service</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{paymentError}</p>
            </div>
          </div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center pt-4">
          <div className="flex items-center text-gray-500 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secured by Square</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;