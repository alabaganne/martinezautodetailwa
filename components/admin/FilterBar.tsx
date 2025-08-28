'use client';

import React from 'react';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export type DateFilterType = 'all' | 'today' | 'week' | 'custom';

interface FilterBarProps {
	selectedDate: Date;
	onDateChange: (date: Date) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	dateFilterType?: DateFilterType;
	onDateFilterTypeChange?: (type: DateFilterType) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
	selectedDate,
	onDateChange,
	searchQuery,
	onSearchChange,
	dateFilterType = 'custom',
	onDateFilterTypeChange,
}) => {
	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const isToday = (date: Date) => {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	};

	const addDays = (date: Date, days: number) => {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	};

	const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newDate = new Date(e.target.value + 'T00:00:00');
		if (!isNaN(newDate.getTime())) {
			onDateChange(newDate);
		}
	};

	const getDateInputValue = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	return (
		<div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6 relative overflow-hidden">
			{/* Subtle gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-blue-100/30 pointer-events-none"></div>

			<div className="relative flex flex-col gap-4">
				{/* Row 1: Date Picker and Search */}
				<div className="flex flex-col md:flex-row gap-4">
					{/* Date Picker Section */}
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-3">
							<div className="p-1.5 bg-blue-100 rounded-lg">
								<Calendar className="text-blue-600" size={16} />
							</div>
							<span className="text-sm font-semibold text-gray-800">Date</span>
						</div>

						{/* Date Navigation */}
						<div className="flex items-center gap-1">
							<button
								onClick={() => {
									onDateChange(addDays(selectedDate, -1));
									onDateFilterTypeChange?.('custom');
								}}
								className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
								aria-label="Previous day">
								<ChevronLeft size={20} className="group-hover:text-blue-600 transition-colors group-disabled:text-gray-400" />
							</button>

							<div className="relative flex-1 max-w-[200px]">
								<input
									type="date"
									value={getDateInputValue(selectedDate)}
									onChange={(e) => {
										handleDateInputChange(e);
										onDateFilterTypeChange?.('custom');
									}}
									className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-gray-50 hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
								/>
							</div>

							<button
								onClick={() => {
									onDateChange(addDays(selectedDate, 1));
									onDateFilterTypeChange?.('custom');
								}}
								className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
								aria-label="Next day">
								<ChevronRight size={20} className="group-hover:text-blue-600 transition-colors group-disabled:text-gray-400" />
							</button>
						</div>
					</div>

					{/* Search Section */}
					<div className="flex-1 md:max-w-sm">
						<div className="flex items-center gap-2 mb-3">
							<div className="p-1.5 bg-purple-100 rounded-lg">
								<Search className="text-purple-600" size={16} />
							</div>
							<span className="text-sm font-semibold text-gray-800">Search</span>
						</div>

						<div className="relative group">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => onSearchChange(e.target.value)}
								placeholder="Search by name or phone..."
								className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200"
							/>
							<Search
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors"
								size={18}
							/>

							{searchQuery && (
								<button
									onClick={() => onSearchChange('')}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-all duration-200">
									✕
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Row 2: Filter Buttons */}
				<div>
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => {
								onDateFilterTypeChange?.('all');
							}}
							className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
								dateFilterType === 'all'
									? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
									: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
							}`}>
							All Bookings
						</button>
						<button
							onClick={() => {
								onDateFilterTypeChange?.('week');
							}}
							className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
								dateFilterType === 'week'
									? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
									: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
							}`}>
							This Week
						</button>
						<button
							onClick={() => {
								onDateChange(new Date());
								onDateFilterTypeChange?.('today');
							}}
							className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
								dateFilterType === 'today'
									? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
									: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
							}`}>
							Today
						</button>
						<button
							onClick={() => {
								onDateChange(addDays(new Date(), 1));
								onDateFilterTypeChange?.('custom');
							}}
							className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
								dateFilterType === 'custom' &&
								new Date(selectedDate.toDateString()).getTime() === new Date(addDays(new Date(), 1).toDateString()).getTime()
									? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
									: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
							}`}>
							Tomorrow
						</button>
					</div>

					{/* Selected Date Display */}
					<div className="mt-3 text-sm text-gray-600">
						{dateFilterType === 'all' ? (
							<span>
								Showing <span className="font-semibold text-gray-900">all bookings</span>
							</span>
						) : dateFilterType === 'week' ? (
							<span>
								Showing bookings for <span className="font-semibold text-gray-900">this week</span>
							</span>
						) : dateFilterType === 'today' ? (
							<span>
								Showing bookings for <span className="font-semibold text-gray-900">today</span>
							</span>
						) : (
							<span>
								Showing bookings for <span className="font-semibold text-gray-900">{formatDate(selectedDate)}</span>
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default FilterBar;
