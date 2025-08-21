'use client'

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Car, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronRight,
  Search,
  ChevronLeft
} from 'lucide-react';
import { 
  useBookings,
  useBookingStats,
  useUpdateBookingStatus,
  useCancelBooking,
  useRefreshBookings
} from '@/hooks/useBookings';

interface Customer {
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  email_address?: string;
}

interface AppointmentSegment {
  durationMinutes?: number;
  serviceVariationId?: string;
  serviceVariationVersion?: string;
  service_variation_client_id?: string;
  teamMemberId?: string;
  anyTeamMember?: boolean;
  intermissionMinutes?: number;
}

interface Booking {
  id: string;
  startAt: string;
  status: string;
  customerId?: string;
  customerNote?: string;
  customer?: Customer;
  appointmentSegments?: AppointmentSegment[];
  locationId?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  allDay?: boolean;
  transitionTimeMinutes?: number;
  creatorDetails?: any;
  source?: string;
  locationType?: string;
}

interface BookingCardProps {
  booking: Booking;
  onStatusUpdate: (bookingId: string, newStatus: string) => Promise<void>;
  onCancel: (bookingId: string, reason: string) => Promise<void>;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onStatusUpdate, onCancel }) => {
  const [updating, setUpdating] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      case 'CANCELLED_BY_CUSTOMER':
      case 'CANCELLED_BY_SELLER': return 'bg-gray-100 text-gray-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const getDuration = () => {
    const minutes = booking.appointmentSegments?.[0]?.durationMinutes || 60;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
  };
  
  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    await onStatusUpdate(booking.id, newStatus);
    setUpdating(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="text-gray-400" size={16} />
          <span className="font-semibold text-gray-900">{formatTime(booking.startAt)}</span>
          <span className="text-gray-500 text-sm">({getDuration()})</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {booking.status.replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="space-y-2">
        {booking.customerNote && (
          <div className="flex items-center space-x-2 text-sm">
            <User size={14} className="text-gray-400" />
            <span className="text-gray-700">
              {booking.customerNote}
            </span>
          </div>
        )}
        
        {booking.customer && (
          <div className="flex items-center space-x-2 text-sm">
            <User size={14} className="text-gray-400" />
            <span className="text-gray-700">
              {booking.customer.given_name} {booking.customer.family_name}
            </span>
          </div>
        )}
        
        {booking.customer?.phone_number && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone size={14} className="text-gray-400" />
            <a href={`tel:${booking.customer.phone_number}`} className="text-blue-600 hover:underline">
              {booking.customer.phone_number}
            </a>
          </div>
        )}
        
        {booking.customer?.email_address && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail size={14} className="text-gray-400" />
            <a href={`mailto:${booking.customer.email_address}`} className="text-blue-600 hover:underline">
              {booking.customer.email_address}
            </a>
          </div>
        )}
        
        {booking.appointmentSegments?.[0] && (
          <div className="flex items-center space-x-2 text-sm">
            <Car size={14} className="text-gray-400" />
            <span className="text-gray-700">
              Service ID: {booking.appointmentSegments[0].serviceVariationId}
            </span>
          </div>
        )}
      </div>
      
      {booking.status === 'PENDING' && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => handleStatusChange('ACCEPTED')}
            disabled={updating}
            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={() => handleStatusChange('DECLINED')}
            disabled={updating}
            className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}
      
      {booking.status === 'ACCEPTED' && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => onCancel(booking.id, 'Cancelled by admin')}
            disabled={updating}
            className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'orange';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
    orange: 'bg-orange-100 text-orange-600'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default function AdminPage() {
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const itemsPerPage = 12; // Cards per page
  
  const { bookings, loading, error } = useBookings(filters);
  const stats = useBookingStats();
  const updateBookingStatus = useUpdateBookingStatus();
  const cancelBooking = useCancelBooking();
  const refreshBookings = useRefreshBookings();
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };
  
  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    const result = await updateBookingStatus(bookingId, newStatus);
    if (result.success) {
      // Optionally show success toast
    } else {
      console.error('Failed to update booking:', result.error);
    }
  };
  
  const handleCancel = async (bookingId: string, reason: string) => {
    const result = await cancelBooking(bookingId, reason);
    if (result.success) {
      // Optionally show success toast
    } else {
      console.error('Failed to cancel booking:', result.error);
    }
  };
  
  // Filter bookings based on search term
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: Booking) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        booking.customerNote?.toLowerCase().includes(search) ||
        booking.customer?.given_name?.toLowerCase().includes(search) ||
        booking.customer?.family_name?.toLowerCase().includes(search) ||
        booking.customer?.email_address?.toLowerCase().includes(search) ||
        booking.customer?.phone_number?.includes(search)
      );
    });
  }, [bookings, searchTerm]);
  
  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    filteredBookings.forEach((booking: Booking) => {
      const date = new Date(booking.startAt || (booking as any).start_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(booking);
    });
    return groups;
  }, [filteredBookings]);
  
  // Pagination
  const allDates = Object.keys(groupedBookings);
  const totalBookings = filteredBookings.length;
  const totalPages = Math.ceil(totalBookings / itemsPerPage);
  
  // Get paginated bookings
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredBookings.slice(start, end);
  }, [filteredBookings, currentPage, itemsPerPage]);
  
  // Re-group paginated bookings by date
  const paginatedGroupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    paginatedBookings.forEach((booking: Booking) => {
      const date = new Date(booking.startAt || (booking as any).start_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(booking);
    });
    return groups;
  }, [paginatedBookings]);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage all customer appointments</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="Total" 
          value={stats.total} 
          icon={Calendar} 
          color="blue" 
        />
        <StatsCard 
          title="Pending" 
          value={stats.pending} 
          icon={AlertCircle} 
          color="yellow" 
        />
        <StatsCard 
          title="Accepted" 
          value={stats.accepted} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatsCard 
          title="Declined" 
          value={stats.declined} 
          icon={XCircle} 
          color="red" 
        />
        <StatsCard 
          title="Cancelled" 
          value={stats.cancelled} 
          icon={XCircle} 
          color="gray" 
        />
        <StatsCard 
          title="No Show" 
          value={stats.noShow} 
          icon={AlertCircle} 
          color="orange" 
        />
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DECLINED">Declined</option>
            <option value="CANCELLED_BY_CUSTOMER">Cancelled by Customer</option>
            <option value="CANCELLED_BY_SELLER">Cancelled by Seller</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
      </div>
      
      {/* Bookings Cards */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">No bookings found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(paginatedGroupedBookings).map(([date, dateBookings]) => (
                <div key={date}>
                  <h3 className="font-semibold text-gray-900 mb-3">{date}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateBookings.map((booking: Booking) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking}
                        onStatusUpdate={handleStatusUpdate}
                        onCancel={handleCancel}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings} bookings
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}