'use client';

import React from 'react';
import { Check, Loader, Car } from 'lucide-react';
import { BookingFormData } from '@/contexts/BookingContext';

interface StepProps {
	formData: BookingFormData;
	setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
	isActive?: boolean;
}
import { useCatalog } from '@/contexts/CatalogContext';
import { displayPrice } from '@/lib/utils/currency';
import { AlertBox } from '@/components/common/AlertBox';

const SERVICES = [
	{ key: 'interior', name: 'Interior Only', icon: '🚗' },
	{ key: 'exterior', name: 'Exterior Only', icon: '✨' },
	{ key: 'full', name: 'Full Detail', icon: '💎' },
];

const VEHICLES = [
	{ key: 'small', name: 'Small Car' },
	{ key: 'truck', name: 'Truck' },
	{ key: 'minivan', name: 'Minivan' },
];

const ServiceSelection: React.FC<StepProps> = ({ formData, setFormData }) => {
	const { catalog, calculatePrice, getService, getServiceDuration, formatDuration, loading, setSelectedService } = useCatalog();

	// Local state for service and vehicle selection
	const [serviceType, setServiceType] = React.useState<string>('');
	const [vehicleType, setVehicleType] = React.useState<string>('');
	const [vehicleCondition, setVehicleCondition] = React.useState<'normal' | 'very-dirty'>('normal');

	const estimatedPrice =
		serviceType && vehicleType && vehicleCondition ? calculatePrice(vehicleType, serviceType, vehicleCondition === 'very-dirty') : 0;

	const duration = serviceType && vehicleType ? getServiceDuration(vehicleType, serviceType) : 0;

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader className="animate-spin mr-2" size={24} />
				<span className="text-gray-600">Loading services...</span>
			</div>
		);
	}

	return (
		<div className="text-gray-900">
			<h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Select Your Service</h2>

			{catalog ? (
				<>
					{/* Service Cards */}
					<div className="grid gap-5">
						{SERVICES.map((service) => {
							const price = calculatePrice('small', service.key, false);
							const isSelected = serviceType === service.key;

							return (
								<div
									key={service.key}
									onClick={() => {
										setServiceType(service.key);
										if (vehicleType) {
											const serviceInfo = getService(vehicleType, service.key, vehicleCondition === 'very-dirty');
											setSelectedService(serviceInfo);
											if (serviceInfo) {
												setFormData({ ...formData, serviceVariationId: serviceInfo.serviceVariationId });
											}
										}
									}}
									className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
										isSelected
											? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-[1.02]'
											: 'bg-white border-2 border-gray-200 hover:border-blue-300'
									}`}>
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className={`p-3 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-gradient-to-br from-blue-100 to-blue-200'}`}>
												<span className="text-3xl">{service.icon}</span>
											</div>
											<div>
												<h3 className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{service.name}</h3>
												<p className={isSelected ? 'text-blue-100' : 'text-gray-600'}>
													Starting at <span className="font-bold">{displayPrice(price)}</span>
												</p>
											</div>
										</div>
										{isSelected && (
											<div className="p-2 bg-white/20 rounded-full">
												<Check className="text-white" size={24} />
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Vehicle Type Selection */}
					<div className="mt-8">
						<h3 className="font-bold mb-4 text-lg text-gray-800">Vehicle Type</h3>
						<div className="grid grid-cols-3 gap-4">
							{VEHICLES.map((vehicle) => {
								const isSelected = vehicleType === vehicle.key;
								const priceAdjustment = serviceType
									? calculatePrice(vehicle.key, serviceType, vehicleCondition === 'very-dirty') -
									  calculatePrice('small', serviceType, vehicleCondition === 'very-dirty')
									: 0;

								return (
									<button
										key={vehicle.key}
										onClick={() => {
											setVehicleType(vehicle.key);
											if (serviceType) {
												const serviceInfo = getService(vehicle.key, serviceType, vehicleCondition === 'very-dirty');
												setSelectedService(serviceInfo);
												if (serviceInfo) {
													setFormData({ ...formData, serviceVariationId: serviceInfo.serviceVariationId });
												}
											}
										}}
										className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 relative ${
											isSelected
												? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-50'
												: 'border-2 border-gray-200 hover:border-blue-300 bg-white'
										}`}>
										<div className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{vehicle.name}</div>
										{serviceType && priceAdjustment > 0 && (
											<div className="text-xs text-blue-600 mt-2 font-medium">+{displayPrice(priceAdjustment)}</div>
										)}
										{isSelected && (
											<div className="absolute top-1 right-1">
												<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Vehicle Condition */}
					<div className="mt-8">
						<div className="group">
							<label className="flex items-center font-bold mb-4 text-lg text-gray-800">
								<div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-2">
									<Car className="w-4 h-4 text-blue-600" />
								</div>
								Vehicle Condition
							</label>
							<div className="grid grid-cols-2 gap-3">
								{[
									{ value: 'normal', label: 'Normal Condition', desc: 'Standard cleaning' },
									{ value: 'very-dirty', label: 'Very Dirty', desc: '+50 USD extra' },
								].map((option) => {
									const isSelected = vehicleCondition === option.value;
									return (
										<button
											key={option.value}
											type="button"
											onClick={() => {
												setVehicleCondition(option.value as 'normal' | 'very-dirty');
												if (serviceType && vehicleType) {
													const serviceInfo = getService(vehicleType, serviceType, option.value === 'very-dirty');
													setSelectedService(serviceInfo);
													if (serviceInfo) {
														setFormData({ ...formData, serviceVariationId: serviceInfo.serviceVariationId });
													}
												}
											}}
											className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
												isSelected
													? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-transparent'
													: 'bg-white border-2 border-gray-200 hover:border-blue-300'
											}`}>
											<div className={`font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{option.label}</div>
											<div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{option.desc}</div>
										</button>
									);
								})}
							</div>
							{vehicleCondition === 'very-dirty' && (
								<AlertBox variant="warning" message="Very dirty vehicles may require additional time and will incur an extra charge of 50 USD" />
							)}
						</div>
					</div>

					{/* Summary */}
					{serviceType && vehicleType && (
						<div className="mt-8 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl">
							<div className="flex justify-between items-center text-white">
								<span className="text-blue-100">Estimated Duration:</span>
								<span className="font-bold text-lg">{formatDuration(duration)}</span>
							</div>
							<div className="flex justify-between items-center mt-3 text-white">
								<span className="text-blue-100">Estimated Price:</span>
								<span className="font-bold text-2xl">{displayPrice(estimatedPrice)}</span>
							</div>
							<div className="mt-4 pt-4 border-t border-white/20">
								<p className="text-xs text-blue-100">✨ Payment collected after service completion</p>
							</div>
						</div>
					)}
				</>
			) : (
				<AlertBox message="Unable to retrieve the Catalog from Square." variant="error" />
			)}
		</div>
	);
};

export default ServiceSelection;
