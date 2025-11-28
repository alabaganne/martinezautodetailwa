'use client'

import React, { useEffect, useState } from 'react';
import { BookingFormData } from '@/contexts/BookingContext';
import { useLocation } from '@/contexts/LocationContext';
import { useCatalog } from '@/contexts/CatalogContext';
import { displayPrice } from '@/lib/utils/currency';
import { AlertBox } from '@/components/common/AlertBox';
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
  
  const isComplimentary = selectedService ? selectedService.price <= 0 : false;
  const servicePrice = selectedService ? selectedService.price : 0;
  const paymentAmountLabel = isComplimentary ? 'Complimentary' : displayPrice(servicePrice);
  const totalAmountString = servicePrice.toFixed(2);
  const paymentLabel = selectedService?.name ? `${selectedService.name} Payment` : 'Service Payment';

  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;

  useEffect(() => {
    setFormData(prev => {
      const requiresPayment = !isComplimentary;

      if (!requiresPayment) {
        if (
          prev.requiresPayment === false &&
          !prev.paymentToken &&
          !prev.cardLastFour &&
          !prev.cardBrand
        ) {
          return prev;
        }

        return {
          ...prev,
          requiresPayment: false,
          paymentToken: '',
          cardLastFour: '',
          cardBrand: ''
        } as BookingFormData;
      }

      if (prev.requiresPayment === true) {
        return prev;
      }

      return {
        ...prev,
        requiresPayment: true
      } as BookingFormData;
    });
  }, [isComplimentary, setFormData]);

  const handlePaymentToken = async (tokenResult: any) => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Check if tokenization was successful
      if (tokenResult.status !== 'OK') {
        const errorMessage = tokenResult.errors?.[0]?.message 
          || 'Card verification failed. Please check your card details and try again.';
        console.error('Tokenization failed:', tokenResult.errors);
        setPaymentError(errorMessage);
        return;
      }

      // Validate that we received a token
      if (!tokenResult.token) {
        console.error('No token received from Square');
        setPaymentError('Unable to process card. Please try again.');
        return;
      }

      // Store payment token and card details in formData
      setFormData(prev => ({
        ...prev,
        paymentToken: tokenResult.token,
        cardLastFour: tokenResult.details?.card?.last4 || '',
        cardBrand: tokenResult.details?.card?.brand || ''
      }));

      console.log('Payment token stored successfully');
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
          Payment
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </div>
    );
  }

  if (!applicationId || !locationId) {
    if (!isComplimentary) {
      return (
        <div>
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
            Payment
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Payment configuration is missing. Please contact support.
          </div>
        </div>
      );
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
        Payment
      </h2>

      <div className="space-y-6">
        {/* Payment Policy Notice */}
        {isComplimentary ? (
          <AlertBox
            variant="success"
            title="No Payment Required"
            message="This booking is complimentary, so you won't be charged or asked to enter card details."
          />
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Card on File for No-Show Protection</p>
                <p className="mb-2">Your card will be securely stored but not charged at booking.</p>
                <ul className="space-y-1">
                  <li>• <strong>Pay at service:</strong> {paymentAmountLabel}</li>
                  <li>• <strong>No-show fee:</strong> 30% of service amount charged if you miss your appointment without 24hr notice</li>
                  <li>• Card information processed securely by Square</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Saved Card Display */}
        {!isComplimentary && formData.paymentToken && formData.cardLastFour && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">
                  {formData.cardBrand} ending in {formData.cardLastFour} will be saved on file
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
        {!isComplimentary && (!formData.paymentToken || !formData.cardLastFour) && applicationId && locationId && (
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <PaymentForm
              applicationId={applicationId}
              locationId={locationId}
              cardTokenizeResponseReceived={handlePaymentToken}
              createPaymentRequest={() => ({
                countryCode: 'US',
                currencyCode: 'USD',
                total: {
                  amount: totalAmountString,
                  label: paymentLabel
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
                  {isProcessing ? 'Processing...' : 'Enter Payment Details'}
                </CreditCard>
            </PaymentForm>
          </div>
        )}

        {/* Payment Confirmation Notice */}
        {isComplimentary ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-sm text-green-800">
                <p className="font-semibold">No payment required for this appointment</p>
                <p className="text-xs text-green-700 mt-1">Confirm your booking to reserve your complimentary service.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Your card will be saved when you confirm your booking</p>
                <p className="text-xs text-blue-700 mt-1">You&apos;ll pay {paymentAmountLabel} when you arrive for service.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {!isComplimentary && paymentError && (
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
