'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBookings, useUpdateBookingStatus, useCancelBooking, useRefreshBookings } from '@/hooks/useBookings';
import { useBookingFilters } from '@/hooks/useBookingFilters';
import FilterBar, { DateFilterType } from '@/components/admin/FilterBar';
import GroupedBookingList from '@/components/admin/GroupedBookingList';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminDashboard() {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [searchQuery, setSearchQuery] = useState('');
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');

	const { bookings, loading: isLoading, error } = useBookings();
	const updateBookingStatus = useUpdateBookingStatus();
	const cancelBooking = useCancelBooking();
	const refreshBookings = useRefreshBookings();

	const { filteredBookings, filterDescription } = useBookingFilters({
		bookings: bookings || [],
		selectedDate,
		searchQuery,
		dateFilterType,
	});

	const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
		try {
			const result = await updateBookingStatus(bookingId, newStatus);
			if (!result.success) {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('Failed to update booking status:', error);
			throw error;
		}
	};

	const handleCancel = async (bookingId: string, reason: string) => {
		try {
			const result = await cancelBooking(bookingId, reason);
			if (!result.success) {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('Failed to cancel booking:', error);
			throw error;
		}
	};

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refreshBookings();
		} catch (error) {
			console.error('Failed to refresh bookings:', error);
		} finally {
			setIsRefreshing(false);
		}
	};


	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
				<h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Bookings</h2>
				<p className="text-red-600">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
				<button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
					Try Again
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Enhanced Header with Gradient */}
			<div className="relative mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 shadow-lg">
				<div className="relative z-10">
					<div className="flex justify-between items-start">
						<div>
							<h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
							<p className="text-blue-100 text-lg">Manage your car wash appointments</p>
							<div className="mt-4 text-sm text-blue-200">
								{new Date().toLocaleDateString('en-US', { 
									weekday: 'long', 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric' 
								})}
							</div>
						</div>
						<button
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-white/20">
							<RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
							{isRefreshing ? 'Refreshing...' : 'Refresh'}
						</button>
					</div>
				</div>
				{/* Decorative pattern */}
				<div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
			</div>

			{/* Filter Bar */}
			<FilterBar
				selectedDate={selectedDate}
				onDateChange={setSelectedDate}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				dateFilterType={dateFilterType}
				onDateFilterTypeChange={setDateFilterType}
			/>

			{/* Filter Description */}
			<div className="mb-4 flex justify-between items-center">
				<p className="text-sm text-gray-600">{filterDescription}</p>
				{searchQuery && (
					<button
						onClick={() => {
							setSearchQuery('');
						}}
						className="text-sm text-blue-600 hover:text-blue-700 font-medium">
						Clear search
					</button>
				)}
			</div>

			{/* Bookings List */}
			{isLoading ? (
				<LoadingSkeleton count={3} />
			) : filteredBookings.length > 0 ? (
				<GroupedBookingList bookings={filteredBookings} onStatusUpdate={handleStatusUpdate} onCancel={handleCancel} />
			) : (
				<EmptyState
					searchQuery={searchQuery}
					activeFilter={'all'}
					selectedDate={selectedDate}
					onClearFilters={() => {
						setSearchQuery('');
					}}
				/>
			)}
		</div>
	);
}
