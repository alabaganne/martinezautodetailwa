'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  XCircle,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';
import type { AppointmentRowProps } from '@/lib/types/admin';
import { formatPriceFromCents, calculatePercentage } from '@/lib/utils/currency';
import { formatDurationMinutes, formatDateShort, formatTime } from '@/lib/utils/booking';
import { isNoShowEligible, hasBeenCharged, extractCardInfo } from '@/lib/utils/noShow';
import { getCustomerName } from '@/lib/utils/customer';
import { NO_SHOW_FEE_PERCENTAGE } from '@/lib/constants/admin';

/**
 * Get status badge colors (UI-specific, kept internal)
 */
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'DECLINED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_SELLER':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'NO_SHOW':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Individual appointment row card with actions
 * Displays appointment details, customer info, and allows actions (cancel, charge no-show)
 */
export default function AppointmentRow({
  booking,
  onCancel,
  onChargeNoShow,
  isCharging,
}: AppointmentRowProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    setIsCancelling(true);
    try {
      await onCancel(booking.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleChargeNoShow = async () => {
    setShowDropdown(false);
    await onChargeNoShow(booking.id);
  };

  const noShowEligible = isNoShowEligible(booking);
  const alreadyCharged = hasBeenCharged(booking);
  const isActive = booking.status === 'ACCEPTED' || booking.status === 'PENDING';
  const cardInfo = extractCardInfo(booking.customerNote);
  const customerName = getCustomerName(booking);
  const serviceAmount = booking.serviceAmount;
  const noShowFee = serviceAmount ? calculatePercentage(serviceAmount.amountCents, NO_SHOW_FEE_PERCENTAGE) : null;
  const serviceDetails = booking.serviceDetails;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          {/* Left section: Customer & Booking info */}
          <div className="flex-1 min-w-0">
            {/* Customer Name - Prominent */}
            <div className="flex items-center gap-2 mb-1">
              <User size={18} className="text-brand-600" />
              <h3 className="text-lg font-semibold text-gray-900">{customerName}</h3>
            </div>

            {/* Service Info */}
            {serviceDetails && (
              <p className="text-sm text-gray-600 mb-2 ml-6">
                {serviceDetails.serviceName || 'Service'}
                {serviceDetails.durationMinutes && ` • ${formatDurationMinutes(serviceDetails.durationMinutes)}`}
              </p>
            )}

            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {/* Status badge */}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}
              >
                {booking.status.replace(/_/g, ' ')}
              </span>

              {/* No-show eligible badge with fee amount */}
              {noShowEligible && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  No-Show Eligible{noShowFee ? ` (${formatPriceFromCents(noShowFee)})` : ''}
                </span>
              )}

              {/* Already charged badge */}
              {alreadyCharged && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <DollarSign size={12} />
                  Fee Charged
                </span>
              )}

              {/* Card on file badge */}
              {cardInfo && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <CreditCard size={12} />
                  {cardInfo.brand} •••• {cardInfo.lastFour}
                </span>
              )}

              {/* Booking ID */}
              <span className="text-xs text-gray-500">#{booking.id.slice(-8)}</span>
            </div>

            {/* Contact info */}
            {booking.customer && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {booking.customer.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      {booking.customer.phone}
                    </div>
                  )}
                  {booking.customer.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={14} className="text-gray-400" />
                      {booking.customer.email}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date & Time & Price */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {formatDateShort(booking.startAt)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                {formatTime(booking.startAt)}
              </div>
              {serviceAmount && (
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-900">{formatPriceFromCents(serviceAmount.amountCents)}</span>
                </div>
              )}
            </div>

            {/* Customer note */}
            {booking.customerNote && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700 border border-gray-100">
                {booking.customerNote.split('|').slice(0, 3).map((note, index) => (
                  <div key={index} className="truncate">
                    {note.trim()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right section: Actions dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Actions"
            >
              <MoreVertical size={20} className="text-gray-500" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {/* Charge No-Show Fee */}
                {noShowEligible && (
                  <button
                    onClick={handleChargeNoShow}
                    disabled={isCharging}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCharging ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <DollarSign size={16} />
                    )}
                    Charge No-Show Fee
                  </button>
                )}

                {alreadyCharged && (
                  <div className="px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                    <Check size={16} />
                    Fee Already Charged
                  </div>
                )}

                {/* Cancel booking */}
                {isActive && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowCancelModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    Cancel Booking
                  </button>
                )}

                {!noShowEligible && !alreadyCharged && !isActive && (
                  <div className="px-4 py-2 text-sm text-gray-400">No actions available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-base font-semibold mb-3">Cancel Booking</h3>
            <p className="text-sm text-gray-600 mb-3">Reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              placeholder="Enter reason..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
