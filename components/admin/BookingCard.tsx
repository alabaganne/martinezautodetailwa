'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Car, 
  XCircle, 
  AlertCircle,
  Check
} from 'lucide-react';
import { Booking, BookingStatus } from '@/types/booking';

interface BookingCardProps {
  booking: Booking;
  onStatusUpdate: (bookingId: string, newStatus: string) => Promise<void>;
  onCancel: (bookingId: string, reason: string) => Promise<void>;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onStatusUpdate, onCancel }) => {
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case BookingStatus.ACCEPTED: 
        return 'bg-green-100 text-green-800 border-green-200';
      case BookingStatus.PENDING: 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case BookingStatus.DECLINED: 
        return 'bg-red-100 text-red-800 border-red-200';
      case BookingStatus.CANCELLED_BY_CUSTOMER:
      case BookingStatus.CANCELLED_BY_SELLER: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case BookingStatus.NO_SHOW: 
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case BookingStatus.ACCEPTED: 
        return <Check size={16} />;
      case BookingStatus.PENDING: 
        return <AlertCircle size={16} />;
      case BookingStatus.DECLINED:
      case BookingStatus.CANCELLED_BY_CUSTOMER:
      case BookingStatus.CANCELLED_BY_SELLER:
      case BookingStatus.NO_SHOW:
        return <XCircle size={16} />;
      default: 
        return <AlertCircle size={16} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  };

  const getTotalDuration = () => {
    if (!booking.appointmentSegments?.length) return 0;
    return booking.appointmentSegments.reduce((total, segment) => 
      total + (segment.durationMinutes || 0), 0
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      await onStatusUpdate(booking.id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }
    
    setUpdating(true);
    try {
      await onCancel(booking.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setUpdating(false);
    }
  };

  const isActive = booking.status === BookingStatus.ACCEPTED || booking.status === BookingStatus.PENDING;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4 flex flex-col h-full">
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span>{booking.status.replace(/_/g, ' ')}</span>
            </div>
            <span className="text-xs text-gray-500">#{booking.id.slice(-6)}</span>
          </div>
        </div>

        {/* Customer Info */}
        {booking.customer && (
          <div className="mb-3 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <User size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {booking.customer.given_name} {booking.customer.family_name}
              </span>
            </div>
            {booking.customer.phone_number && (
              <div className="flex items-center gap-1.5 mb-1">
                <Phone size={14} className="text-gray-400" />
                <span className="text-xs text-gray-600">{booking.customer.phone_number}</span>
              </div>
            )}
            {booking.customer.email_address && (
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-gray-400" />
                <span className="text-xs text-gray-600 truncate">{booking.customer.email_address}</span>
              </div>
            )}
          </div>
        )}

        {/* Appointment Details */}
        <div className="border-t border-gray-300 pt-3 mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">{formatTime(booking.startAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Car size={14} className="text-gray-400" />
              <span className="text-xs text-gray-600">{formatDuration(getTotalDuration())}</span>
            </div>
          </div>

          {booking.customerNote && (
            <div className="p-2 bg-blue-50 rounded text-xs text-blue-800 mb-2">
              <span className="font-medium">Note:</span> {booking.customerNote}
            </div>
          )}

          {/* Action Buttons */}
          {isActive && (
            <div className="flex gap-2">
              {booking.status === BookingStatus.PENDING && (
                <>
                  <button
                    onClick={() => handleStatusChange(BookingStatus.ACCEPTED)}
                    disabled={updating}
                    className="flex-1 px-2 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusChange(BookingStatus.DECLINED)}
                    disabled={updating}
                    className="flex-1 px-2 py-1.5 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={updating}
                className={`${booking.status === BookingStatus.PENDING ? '' : 'flex-1'} px-2 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-base font-semibold mb-3">Cancel Booking</h3>
            <p className="text-sm text-gray-600 mb-3">
              Reason for cancellation:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={updating || !cancelReason.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingCard;