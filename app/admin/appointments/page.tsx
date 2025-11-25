'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBookings } from '@/hooks/useBookings';
import AdminHeader from '@/components/admin/AdminHeader';
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
	RefreshCw,
	ChevronDown,
	Filter,
} from 'lucide-react';
import { Booking, BookingStatus } from '@/lib/types/admin';

const NO_SHOW_WINDOW_HOURS = 48;

type FilterOption = 'all' | 'no-show-eligible' | 'accepted' | 'pending' | 'cancelled';

interface AppointmentRowProps {
	booking: Booking & { sellerNote?: string };
	onCancel: (bookingId: string, reason: string) => Promise<void>;
	onChargeNoShow: (bookingId: string) => Promise<void>;
	isCharging: boolean;
}

const isNoShowEligible = (booking: Booking & { sellerNote?: string }): boolean => {
	// Must be ACCEPTED status
	if (booking.status !== 'ACCEPTED') return false;

	// Must be 48+ hours past start time
	const startTime = new Date(booking.startAt);
	const now = new Date();
	const hoursPast = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
	if (hoursPast < NO_SHOW_WINDOW_HOURS) return false;

	// Must have card on file
	if (!booking.sellerNote?.includes('Card ID:')) return false;

	// Must not have already been charged
	if (booking.sellerNote?.includes('No-show fee charged:')) return false;

	return true;
};

const hasBeenCharged = (booking: Booking & { sellerNote?: string }): boolean => {
	return booking.sellerNote?.includes('No-show fee charged:') ?? false;
};

const extractCardInfo = (customerNote?: string): { brand: string; lastFour: string } | null => {
	if (!customerNote) return null;

	// Format: "Visa ending in 1234" or "Mastercard ending in 5678"
	const cardMatch = customerNote.match(/(\w+)\s+ending\s+in\s+(\d{4})/i);
	if (cardMatch) {
		return {
			brand: cardMatch[1],
			lastFour: cardMatch[2],
		};
	}
	return null;
};

const getCustomerName = (booking: Booking): string => {
	if (booking.customer?.givenName || booking.customer?.familyName) {
		return `${booking.customer.givenName || ''} ${booking.customer.familyName || ''}`.trim();
	}
	return 'Unknown Customer';
};

const AppointmentRow: React.FC<AppointmentRowProps> = ({
	booking,
	onCancel,
	onChargeNoShow,
	isCharging,
}) => {
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

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};

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

	return (
		<>
			<div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
				<div className="flex items-start justify-between gap-4">
					{/* Left section: Customer & Booking info */}
					<div className="flex-1 min-w-0">
						{/* Customer Name - Prominent */}
						<div className="flex items-center gap-2 mb-2">
							<User size={18} className="text-brand-600" />
							<h3 className="text-lg font-semibold text-gray-900">{customerName}</h3>
						</div>

						<div className="flex items-center gap-3 mb-3 flex-wrap">
							{/* Status badge */}
							<span
								className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}
							>
								{booking.status.replace(/_/g, ' ')}
							</span>

							{/* No-show eligible badge */}
							{noShowEligible && (
								<span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
									<AlertTriangle size={12} />
									No-Show Eligible
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

						{/* Date & Time */}
						<div className="flex flex-wrap gap-4 text-sm text-gray-600">
							<div className="flex items-center gap-1.5">
								<Calendar size={14} className="text-gray-400" />
								{formatDate(booking.startAt)}
							</div>
							<div className="flex items-center gap-1.5">
								<Clock size={14} className="text-gray-400" />
								{formatTime(booking.startAt)}
							</div>
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
};

export default function AppointmentsPage() {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [chargingBookingId, setChargingBookingId] = useState<string | null>(null);
	const [chargeResult, setChargeResult] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);
	const [filter, setFilter] = useState<FilterOption>('all');
	const [showFilterDropdown, setShowFilterDropdown] = useState(false);
	const filterRef = useRef<HTMLDivElement>(null);

	const { bookings, loading, error, cancelBooking, refreshBookings } = useBookings();

	// Close filter dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
				setShowFilterDropdown(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Auto-hide charge result after 5 seconds
	useEffect(() => {
		if (chargeResult) {
			const timer = setTimeout(() => setChargeResult(null), 5000);
			return () => clearTimeout(timer);
		}
	}, [chargeResult]);

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

	const handleChargeNoShow = async (bookingId: string) => {
		setChargingBookingId(bookingId);
		setChargeResult(null);

		try {
			const response = await fetch(`/api/bookings/${bookingId}/charge-no-show`, {
				method: 'POST',
				credentials: 'include',
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to charge no-show fee');
			}

			const feeAmount = (parseInt(data.noShowFeeAmount, 10) / 100).toFixed(2);
			setChargeResult({
				type: 'success',
				message: `Successfully charged $${feeAmount} no-show fee`,
			});

			// Refresh bookings to update the UI
			await refreshBookings();
		} catch (error) {
			setChargeResult({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to charge no-show fee',
			});
		} finally {
			setChargingBookingId(null);
		}
	};

	// Filter bookings
	const filteredBookings = bookings.filter((booking: any) => {
		switch (filter) {
			case 'no-show-eligible':
				return isNoShowEligible(booking);
			case 'accepted':
				return booking.status === 'ACCEPTED';
			case 'pending':
				return booking.status === 'PENDING';
			case 'cancelled':
				return (
					booking.status === 'CANCELLED_BY_CUSTOMER' ||
					booking.status === 'CANCELLED_BY_SELLER'
				);
			default:
				return true;
		}
	});

	// Sort by date (most recent first)
	const sortedBookings = [...filteredBookings].sort((a, b) => {
		return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
	});

	const filterLabels: Record<FilterOption, string> = {
		all: 'All Appointments',
		'no-show-eligible': 'No-Show Eligible',
		accepted: 'Accepted',
		pending: 'Pending',
		cancelled: 'Cancelled',
	};

	const noShowEligibleCount = bookings.filter((b: any) => isNoShowEligible(b)).length;

	if (error) {
		return (
			<div className="min-h-screen">
				<AdminHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />
				<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
					<h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Appointments</h2>
					<p className="text-red-600">{error}</p>
					<button
						onClick={handleRefresh}
						className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<AdminHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

			{/* Charge result notification */}
			{chargeResult && (
				<div
					className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
						chargeResult.type === 'success'
							? 'bg-green-50 border border-green-200 text-green-800'
							: 'bg-red-50 border border-red-200 text-red-800'
					}`}
				>
					{chargeResult.type === 'success' ? <Check size={20} /> : <XCircle size={20} />}
					{chargeResult.message}
				</div>
			)}

			{/* Header with filter */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
					<p className="text-sm text-gray-500 mt-1">
						{sortedBookings.length} appointment{sortedBookings.length !== 1 ? 's' : ''}
						{noShowEligibleCount > 0 && (
							<span className="ml-2 text-red-600 font-medium">
								({noShowEligibleCount} no-show eligible)
							</span>
						)}
					</p>
				</div>

				{/* Filter dropdown */}
				<div className="relative" ref={filterRef}>
					<button
						onClick={() => setShowFilterDropdown(!showFilterDropdown)}
						className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
					>
						<Filter size={16} className="text-gray-500" />
						<span className="text-sm font-medium">{filterLabels[filter]}</span>
						<ChevronDown size={16} className="text-gray-400" />
					</button>

					{showFilterDropdown && (
						<div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
							{(Object.keys(filterLabels) as FilterOption[]).map((option) => (
								<button
									key={option}
									onClick={() => {
										setFilter(option);
										setShowFilterDropdown(false);
									}}
									className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
										filter === option ? 'text-brand-600 font-medium' : 'text-gray-700'
									}`}
								>
									{filterLabels[option]}
									{option === 'no-show-eligible' && noShowEligibleCount > 0 && (
										<span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
											{noShowEligibleCount}
										</span>
									)}
									{filter === option && <Check size={16} />}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Appointments list */}
			{loading ? (
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex gap-2 mb-3">
										<div className="h-6 w-20 bg-gray-200 rounded-full" />
										<div className="h-6 w-24 bg-gray-200 rounded-full" />
									</div>
									<div className="h-5 w-40 bg-gray-200 rounded mb-2" />
									<div className="h-4 w-60 bg-gray-200 rounded" />
								</div>
								<div className="h-8 w-8 bg-gray-200 rounded" />
							</div>
						</div>
					))}
				</div>
			) : sortedBookings.length === 0 ? (
				<div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
					<div className="text-gray-400 mb-2">
						<Calendar size={48} className="mx-auto" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
					<p className="text-sm text-gray-500">
						{filter !== 'all'
							? `No ${filterLabels[filter].toLowerCase()} at this time.`
							: 'There are no appointments to display.'}
					</p>
					{filter !== 'all' && (
						<button
							onClick={() => setFilter('all')}
							className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium"
						>
							View all appointments
						</button>
					)}
				</div>
			) : (
				<div className="space-y-3">
					{sortedBookings.map((booking: any) => (
						<AppointmentRow
							key={booking.id}
							booking={booking}
							onCancel={handleCancel}
							onChargeNoShow={handleChargeNoShow}
							isCharging={chargingBookingId === booking.id}
						/>
					))}
				</div>
			)}
		</div>
	);
}
