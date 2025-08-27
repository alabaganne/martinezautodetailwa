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
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case BookingStatus.PENDING: 
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300';
      case BookingStatus.DECLINED: 
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300';
      case BookingStatus.CANCELLED_BY_CUSTOMER:
      case BookingStatus.CANCELLED_BY_SELLER: 
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300';
      case BookingStatus.NO_SHOW: 
        return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-300';
      default: 
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300';
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 p-5 flex flex-col h-full relative overflow-hidden group">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span>{booking.status.replace(/_/g, ' ').split(' ')[0]}</span>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">#{booking.id.slice(-6)}</span>
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
        <div className="border-t border-gray-200 pt-4 mt-auto">
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
            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg text-xs text-blue-800 mb-3 border border-blue-200">
              <span className="font-semibold">Note:</span> {booking.customerNote}
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
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusChange(BookingStatus.DECLINED)}
                    disabled={updating}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-lg text-xs font-bold hover:from-gray-600 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Decline
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={updating}
                className={`${booking.status === BookingStatus.PENDING ? '' : 'flex-1'} px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-bold hover:from-red-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer`}
              >
                Cancel
              </button>
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