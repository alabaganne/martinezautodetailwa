'use client';

import React, { useState } from 'react';
import { useBookingFilters } from '@/hooks/useBookingFilters';
import { useBookings } from '@/hooks/useBookings';
import FilterBar, { DateFilterType } from '@/components/admin/FilterBar';
import GroupedBookingList from '@/components/admin/GroupedBookingList';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import EmptyState from '@/components/admin/EmptyState';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminDashboard() {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [searchQuery, setSearchQuery] = useState('');
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');

	const { bookings, loading: isLoading, error, cancelBooking, refreshBookings } = useBookings();

	const { filteredBookings, filterDescription } = useBookingFilters({
		bookings: bookings || [],
		selectedDate,
		searchQuery,
		dateFilterType,
	});

	// Status update removed - only cancel is needed
	const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
		// Not implemented - only cancel is supported
		console.log('Status update not supported, only cancel');
	};

	const handleCancel = async (bookingId: string, reason: string) => {
		try {
			const result = await cancelBooking(bookingId, reason || 'Cancelled by admin');
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
			<AdminHeader 
				onRefresh={handleRefresh}
				isRefreshing={isRefreshing}
			/>

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
