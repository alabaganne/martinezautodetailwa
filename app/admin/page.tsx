'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useBookings, useUpdateBookingStatus, useCancelBooking, useRefreshBookings } from '@/hooks/useBookings';
import { useBookingFilters } from '@/hooks/useBookingFilters';
import { FilterType } from '@/types/booking';
import StatsCards from '@/components/admin/StatsCards';
import FilterBar, { DateFilterType } from '@/components/admin/FilterBar';
import GroupedBookingList from '@/components/admin/GroupedBookingList';
import LoadingSkeleton from '@/components/admin/LoadingSkeleton';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminDashboard() {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [searchQuery, setSearchQuery] = useState('');
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');
	const [activeStatFilter, setActiveStatFilter] = useState<FilterType>('all');

	const { bookings, loading: isLoading, error } = useBookings();
	const updateBookingStatus = useUpdateBookingStatus();
	const cancelBooking = useCancelBooking();
	const refreshBookings = useRefreshBookings();

	const { filteredBookings, bookingStats, filterDescription } = useBookingFilters({
		bookings: bookings || [],
		selectedDate,
		activeStatFilter,
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

	const handleStatFilterChange = (filter: FilterType) => {
		setActiveStatFilter(filter);
		// Reset search when changing stat filter
		if (filter !== activeStatFilter) {
			setSearchQuery('');
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
		<div>
			{/* Header */}
			<div className="mb-8">
				<div className="flex justify-between items-center mb-2">
					<h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
					<button
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
						<RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
						{isRefreshing ? 'Refreshing...' : 'Refresh'}
					</button>
				</div>
				<p className="text-gray-600">Manage your car wash appointments</p>
			</div>

			{/* Stats Cards */}
			<StatsCards stats={bookingStats} activeFilter={activeStatFilter} onFilterChange={handleStatFilterChange} isLoading={isLoading} />

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
				{(activeStatFilter !== 'all' || searchQuery) && (
					<button
						onClick={() => {
							setActiveStatFilter('all');
							setSearchQuery('');
						}}
						className="text-sm text-blue-600 hover:text-blue-700 font-medium">
						Clear all filters
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
					activeFilter={activeStatFilter}
					selectedDate={selectedDate}
					onClearFilters={() => {
						setActiveStatFilter('all');
						setSearchQuery('');
					}}
				/>
			)}
		</div>
	);
}
