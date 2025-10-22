'use client';

import { cp } from 'fs';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CatalogObject, CatalogObjectType } from 'square/api';

interface ServiceInfo {
	name: string;
	vehicleType: string;
	serviceType: string;
	duration: number;
	price: number;
	serviceVariationId: string;
}

interface CatalogContextType {
	catalog: CatalogObject[] | null;
	loading: boolean;
	error: string | null;
	selectedService: ServiceInfo | null;
	setSelectedService: (service: ServiceInfo | null) => void;
	calculatePrice: (vehicleType?: string, serviceType?: string, isVeryDirty?: boolean) => number;
  getService: (vehicleType: string, serviceType: string, isVeryDirty?: boolean) => ServiceInfo;
	getServiceDuration: (vehicleType?: string, serviceType?: string) => number;
	formatDuration: (minutes: number) => string;
	refreshCatalog: () => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function useCatalog() {
	const context = useContext(CatalogContext);
	if (!context) {
		throw new Error('useCatalog must be used within a CatalogProvider');
	}
	return context;
}

interface CatalogProviderProps {
	children: ReactNode;
}

export function CatalogProvider({ children }: CatalogProviderProps) {
	const [catalog, setCatalog] = useState<CatalogObject[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);

	const vehicleTypeConfig: Record<string, { label: string; searchTerms: string[] }> = {
		car: {
			label: 'Car',
			searchTerms: ['car', ' - car'],
		},
		'suv-mini-van': {
			label: 'SUV / Mini Van',
			searchTerms: ['suv / mini van', 'suv mini van', 'mini van', 'minivan', 'suv'],
		},
		truck: {
			label: 'Truck',
			searchTerms: ['truck', ' - truck', 'small truck'],
		},
		'small-truck-suv': {
			label: 'Small truck & SUV',
			searchTerms: ['small truck & suv', 'small trucks & suv', 'small truck and suv', 'small suv & small truck'],
		},
	};

	const serviceTypeKeywordsMap: Record<string, string[]> = {
		'interior-detail-service': ['interior detail service', 'interior detail', 'interior service', 'interior', ' - interior'],
		'exterior-detail-service': ['exterior detail service', 'exterior detail', 'exterior service', 'exterior', ' - exterior'],
		'full-detail-package': ['full detail package', 'full detail', 'full detail service', 'interior & exterior detail'],
	};

	const matchesVehicleType = (vehicleType: string, comparison: string): boolean => {
		if (!vehicleType) return false;
		const config = vehicleTypeConfig[vehicleType.toLowerCase()];
		const searchTerms = config?.searchTerms ?? [vehicleType.toLowerCase()];
		return searchTerms.some((term) => comparison.includes(term.toLowerCase()));
	};

	const getVehicleDisplayName = (vehicleType: string): string => {
		if (!vehicleType) return vehicleType;
		return vehicleTypeConfig[vehicleType.toLowerCase()]?.label ?? vehicleType;
	};

	const matchesServiceType = (serviceType: string, comparison: string): boolean => {
		if (!serviceType) return true;
		const keywords = serviceTypeKeywordsMap[serviceType.toLowerCase()] ?? [serviceType.toLowerCase()];
		return keywords.some((keyword) => comparison.includes(keyword));
	};

	const findVariation = (variations: any[], veryDirty: boolean) => {
		if (!Array.isArray(variations) || variations.length === 0) {
			return null;
		}

		const targetVariation = variations.find((variation) => {
			const variationData = variation?.itemVariationData ?? {};
			const variationName = (variationData.name ?? '').toLowerCase();
			const ordinalRaw = variationData.ordinal;
			const ordinal = typeof ordinalRaw === 'number' ? ordinalRaw : parseInt(ordinalRaw ?? '', 10);
			const isVeryDirtyVariation = variationName.includes('very dirty') || ordinal === 2;
			const isRegularVariation =
				variationName.includes('regular') || ordinal === 1 || (!isVeryDirtyVariation && !variationName.includes('very dirty'));
			return veryDirty ? isVeryDirtyVariation : isRegularVariation;
		});

		if (targetVariation) {
			return targetVariation;
		}

		return variations[veryDirty ? variations.length - 1 : 0];
	};

	useEffect(() => {
		fetchCatalog();
	}, []);

	const fetchCatalog = async () => {
		try {
			setLoading(true);
			const response = await fetch('/api/catalog?types=ITEM');
			const data = await response.json();

			if (data.data && Array.isArray(data.data) && data.data.length > 0) {
				setCatalog(data.data);
			} else {
				setError('Using offline catalog data');
			}
		} catch (err) {
			console.error('Failed to fetch catalog:', err);
			setError('Failed to load catalog');
		} finally {
			setLoading(false);
		}
	};

	const getService = (vehicleType: string, serviceType: string, isVeryDirty: boolean = false): ServiceInfo | null => {
		if (!catalog) return null;

		for (let i = 0; i < catalog.length; i++) {
			const item: any = catalog[i];
			const { itemData } = item;
			const { name, variations } = itemData || {};
			if (!name || !variations) {
				continue;
			}
			const lowerCaseName = name.toLowerCase();

			if (!matchesVehicleType(vehicleType, lowerCaseName) || !matchesServiceType(serviceType, lowerCaseName)) {
				continue;
			}

			const variation = findVariation(variations, isVeryDirty);
			if (!variation) {
				continue;
			}

			const { itemVariationData } = variation;
			const { priceMoney, serviceDuration } = itemVariationData || {};
			if (!priceMoney) {
				continue;
			}

			const durationMs = typeof serviceDuration === 'number' ? serviceDuration : parseInt(serviceDuration ?? '0', 10);
			const amount = typeof priceMoney.amount === 'number' ? priceMoney.amount : parseInt(priceMoney.amount ?? '0', 10);

			return {
				name: itemData.name,
				vehicleType: getVehicleDisplayName(vehicleType),
				serviceType,
				duration: durationMs,
				price: amount / 100,
				serviceVariationId: variation.id,
			};
		}

		return null;
	};

	const calculatePrice = (vehicleType?: string, serviceType?: string, isVeryDirty: boolean = false): number => {
		if (!vehicleType && !serviceType) {
			return selectedService?.price ?? 0;
		}

		const service = vehicleType && serviceType ? getService(vehicleType, serviceType, isVeryDirty) : null;
		return service ? service.price : 0;
	};

	const getServiceDuration = (vehicleType?: string, serviceType?: string, isVeryDirty: boolean = false): number => {
		if (!vehicleType && !serviceType) {
			return selectedService?.duration ?? 0; // duration in milliseconds here
		}

		const service = vehicleType && serviceType ? getService(vehicleType, serviceType, isVeryDirty) : null;
		return service ? service.duration : 0;
	};

	const formatDuration = (milliseconds: number): string => {
		if (typeof milliseconds !== 'number') {
			throw new Error('milliseconds is not a number');
		}

		// Convert milliseconds to minutes
		const totalMinutes = Math.floor(milliseconds / (1000 * 60));
		
		const hours = Math.floor(totalMinutes / 60);
		const mins = totalMinutes % 60;
		
		if (mins === 0) {
			return `${hours}h`;
		}
		return `${hours}h ${mins}m`;
	};

	const value: CatalogContextType = {
		catalog,
		loading,
		error,
		selectedService,
		setSelectedService,
		calculatePrice,
    getService,
		getServiceDuration,
		formatDuration,
		refreshCatalog: fetchCatalog,
	};

	return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
