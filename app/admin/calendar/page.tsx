'use client';

import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { Calendar, Clock, User, Car, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Booking } from '@/lib/types/admin';

interface DayInfo {
	date: Date;
	isCurrentMonth: boolean;
}

export default function CalendarPage() {
	const [selectedDate, setSelectedDate] = useState(new Date());

	const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
	const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

	const { bookings = [], loading } = useBookings({
		startDate: startOfMonth.toISOString(),
		endDate: endOfMonth.toISOString(),
	});

  console.log('bookings:', bookings);

	const getDaysInMonth = (): DayInfo[] => {
		const days: DayInfo[] = [];
		const year = selectedDate.getFullYear();
		const month = selectedDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startPadding = firstDay.getDay();

		// Add padding days from previous month
		for (let i = startPadding - 1; i >= 0; i--) {
			const date = new Date(year, month, -i);
			days.push({ date, isCurrentMonth: false });
		}

		// Add days of current month
		for (let i = 1; i <= lastDay.getDate(); i++) {
			const date = new Date(year, month, i);
			days.push({ date, isCurrentMonth: true });
		}

		// Add padding days from next month
		const endPadding = 42 - days.length; // 6 weeks * 7 days
		for (let i = 1; i <= endPadding; i++) {
			const date = new Date(year, month + 1, i);
			days.push({ date, isCurrentMonth: false });
		}

		return days;
	};

	const getBookingsForDate = (date: Date): Booking[] => {
		const dateStr = date.toISOString().split('T')[0];
		return bookings.filter((booking: any) => {
			// Handle both camelCase and snake_case property names
			const startTime = booking.startAt || booking.start_at;

			// Safely check if startTime exists and is a string
			if (!startTime || typeof startTime !== 'string') {
				return false;
			}
			return startTime.startsWith(dateStr);
		});
	};

	const formatMonthYear = (): string => {
		return selectedDate.toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric',
		});
	};

	const navigateMonth = (direction: number): void => {
		const newDate = new Date(selectedDate);
		newDate.setMonth(newDate.getMonth() + direction);
		setSelectedDate(newDate);
	};

	const isToday = (date: Date): boolean => {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	};

	const formatTime = (dateString: string): string => {
		try {
			return new Date(dateString).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			});
		} catch {
			return '';
		}
	};

	const formatTimeShort = (dateString: string): string => {
		try {
			return new Date(dateString).toLocaleTimeString('en-US', {
				hour: 'numeric',
				hour12: true,
			});
		} catch {
			return '';
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="flex items-center justify-center h-64">
					<Calendar className="animate-pulse text-gray-400" size={48} />
				</div>
			</div>
		);
	}

	const days = getDaysInMonth();

	return (
		<div className="min-h-screen">
			{/* Enhanced Header with Gradient */}
			<div className="relative mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 shadow-lg">
				<div className="relative z-10">
					<div className="flex justify-between items-start">
						<div>
							<h1 className="text-4xl font-bold text-white mb-2">Calendar View</h1>
							<p className="text-blue-100 text-lg">View and manage bookings in calendar format</p>
							<div className="mt-4 text-sm text-blue-200">
								{new Date().toLocaleDateString('en-US', { 
									weekday: 'long', 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric' 
								})}
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<button 
								onClick={() => setSelectedDate(new Date())}
								className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/20 font-medium"
							>
								Today
							</button>
						</div>
					</div>
				</div>
				{/* Decorative pattern */}
				<div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
			</div>

			{/* Calendar Controls with Enhanced Styling */}
			<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-blue-100/30 pointer-events-none"></div>
				<div className="relative flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<button 
							onClick={() => navigateMonth(-1)} 
							className="p-2.5 hover:bg-blue-50 rounded-xl transition-all duration-200 group" 
							aria-label="Previous month"
						>
							<ChevronLeft className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
						</button>
						<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
							{formatMonthYear()}
						</h2>
						<button 
							onClick={() => navigateMonth(1)} 
							className="p-2.5 hover:bg-blue-50 rounded-xl transition-all duration-200 group" 
							aria-label="Next month"
						>
							<ChevronRight className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
						</button>
					</div>
					<div className="text-sm text-gray-600 font-medium">
						<span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
							{bookings.length} total bookings
						</span>
					</div>
				</div>
			</div>

			{/* Calendar Grid with Enhanced Styling */}
			<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
				<div className="grid grid-cols-7">
					{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
						<div key={day} className={`px-3 py-4 bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-200 text-center ${idx < 6 ? 'border-r' : ''}`}>
							<span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{day}</span>
						</div>
					))}
				</div>

				<div className="grid grid-cols-7">
					{days.map(({ date, isCurrentMonth }, index) => {
						const dayBookings = getBookingsForDate(date);
						const hasBookings = dayBookings.length > 0;

						return (
							<div
								key={index}
								className={`min-h-[100px] p-2 border-b border-gray-200 ${index % 7 < 6 ? 'border-r' : ''} ${
									!isCurrentMonth ? 'bg-gray-50' : 'bg-white'
								} ${isToday(date) ? 'bg-blue-50' : ''}`}>
								<div className="flex justify-between items-start mb-1">
									<span
										className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'} ${isToday(date) ? 'text-blue-600' : ''}`}>
										{date.getDate()}
									</span>
									{hasBookings && (
										<span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
											{dayBookings.length}
										</span>
									)}
								</div>

								{hasBookings && (
									<div className="space-y-1">
										{dayBookings.slice(0, 3).map((booking: any) => {
											// Handle both camelCase and snake_case property names
											const startTime = booking.startAt || booking.start_at;
											const timeStr = startTime ? formatTime(startTime) : '';
											const shortTimeStr = startTime ? formatTimeShort(startTime) : '';

											return (
												<div
													key={booking.id}
													className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
													title={`${timeStr} - ${booking.customerNote}`}>
													{shortTimeStr} - {booking.customerNote || 'No note'}
												</div>
											);
										})}
										{dayBookings.length > 3 && <div className="text-xs text-gray-500 pl-1">+{dayBookings.length - 3} more</div>}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Legend */}
			<div className="mt-6 flex items-center space-x-6 text-sm text-gray-600">
				<div className="flex items-center space-x-2">
					<div className="w-4 h-4 bg-blue-50 border border-gray-300 rounded"></div>
					<span>Today</span>
				</div>
				<div className="flex items-center space-x-2">
					<div className="w-4 h-4 bg-blue-100 rounded"></div>
					<span>Has Bookings</span>
				</div>
			</div>
		</div>
	);
}
