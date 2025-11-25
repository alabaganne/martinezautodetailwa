'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2, DollarSign } from 'lucide-react';

interface ChargeResult {
  bookingId: string;
  success: boolean;
  paymentId?: string;
  fullAmount?: string;
  noShowFeeAmount?: string;
  feePercentage?: number;
  currency?: string;
  error?: string;
}

interface NoShowCheckResponse {
  message: string;
  noShowBookings: number;
  chargeResults: ChargeResult[];
  timestamp: string;
}

const NoShowCheck: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NoShowCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/cron/no-show-check', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amountCents: string, currency: string = 'USD') => {
    const amount = parseInt(amountCents, 10) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">No-Show Fee Check</h3>
            <p className="text-sm text-gray-500">
              Check for no-show bookings (48+ hours past) and charge 30% fee
            </p>
          </div>
        </div>
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4" />
              Run Check
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-gray-800">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">Check Completed</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Found <strong>{result.noShowBookings}</strong> no-show booking(s)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>

          {result.chargeResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Charge Results:</h4>
              {result.chargeResults.map((charge, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    charge.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {charge.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-mono text-gray-600">
                        {charge.bookingId.slice(0, 8)}...
                      </span>
                    </div>
                    {charge.success && charge.noShowFeeAmount && (
                      <span className="text-sm font-medium text-green-700">
                        {formatCurrency(charge.noShowFeeAmount, charge.currency)} charged
                      </span>
                    )}
                  </div>
                  {charge.error && (
                    <p className="mt-1 text-xs text-red-600">{charge.error}</p>
                  )}
                  {charge.success && charge.fullAmount && (
                    <p className="mt-1 text-xs text-gray-500">
                      {charge.feePercentage}% of {formatCurrency(charge.fullAmount, charge.currency)} service
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.noShowBookings === 0 && (
            <p className="text-sm text-gray-500 italic">
              No bookings require no-show fee processing at this time.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NoShowCheck;
