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
			const { name, variations } = itemData;
			const lowerCaseName = name.toLowerCase();

			if (lowerCaseName.includes(vehicleType) && lowerCaseName.includes(serviceType)) {
				const variation = variations[isVeryDirty ? 1 : 0];
				const { itemVariationData } = variation;

				return {
					name: itemData.name,
					vehicleType,
					serviceType,
					duration: parseInt(itemVariationData.serviceDuration),
					price: itemVariationData.priceMoney.amount / 100,
					serviceVariationId: variation.id,
				};
			}
		}

		return null;
	};

	const calculatePrice = (vehicleType?: string, serviceType?: string, isVeryDirty: boolean = false): number => {
		if (!vehicleType && !serviceType) {
			return selectedService.price;
		}

		const service = getService(vehicleType, serviceType, isVeryDirty);
		return service ? service.price : null;
	};

	const getServiceDuration = (vehicleType?: string, serviceType?: string, isVeryDirty: boolean = false): number => {
		if (!vehicleType && !serviceType) {
			return selectedService.duration; // duration in milliseconds here
		}

		const service = getService(vehicleType, serviceType, isVeryDirty);
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
