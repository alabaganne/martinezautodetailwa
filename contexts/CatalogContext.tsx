'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ServiceInfo {
  name: string;
  vehicleType: string;
  serviceType: string;
  duration: number;
  basePrice: number;
}

interface Category {
  id: string;
  name: string;
  ordinal: number;
}

interface CatalogData {
  categories: Record<string, Category>;
  simplifiedServices: Record<string, ServiceInfo>;
}

interface CatalogContextType {
  catalog: CatalogData | null;
  loading: boolean;
  error: string | null;
  calculatePrice: (vehicleType: string, serviceType: string, isVeryDirty?: boolean) => number;
  getServiceDuration: (vehicleType: string, serviceType: string) => number;
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
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/square/catalog?types=ITEM');
      const data = await response.json();
      
      if (data.success) {
        setCatalog(data.data);
      } else {
        setCatalog(getDefaultCatalog());
        setError('Using offline catalog data');
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      setError('Failed to load catalog');
      setCatalog(getDefaultCatalog());
    } finally {
      setLoading(false);
    }
  };

  const getService = (vehicleType: string, serviceType: string): ServiceInfo | null => {
    if (!catalog) return null;
    const key = `${vehicleType}_${serviceType}`;
    return catalog.simplifiedServices?.[key] || null;
  };

  const calculatePrice = (vehicleType: string, serviceType: string, isVeryDirty = false): number => {
    const service = getService(vehicleType, serviceType);
    
    if (!service) {
      // Fallback pricing from Square API defaults
      const basePrices: Record<string, number> = {
        interior: 120,
        exterior: 100,
        full: 200
      };
      const multipliers: Record<string, number> = {
        small: 1.0,
        truck: 1.2,
        minivan: 1.3
      };
      const basePrice = basePrices[serviceType] || 150;
      const multiplier = multipliers[vehicleType] || 1.0;
      const extra = isVeryDirty ? 50 : 0;
      return Math.round((basePrice * multiplier) + extra);
    }
    
    const basePrice = service.basePrice || 150;
    const extra = isVeryDirty ? 50 : 0;
    return basePrice + extra;
  };

  const getServiceDuration = (vehicleType: string, serviceType: string): number => {
    const service = getService(vehicleType, serviceType);
    return service?.duration || 240;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  const value: CatalogContextType = {
    catalog,
    loading,
    error,
    calculatePrice,
    getServiceDuration,
    formatDuration,
    refreshCatalog: fetchCatalog
  };

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
}

function getDefaultCatalog(): CatalogData {
  return {
    categories: {
      'SMALL': { id: 'SMALL', name: 'Small Car', ordinal: 0 },
      'TRUCK': { id: 'TRUCK', name: 'Truck', ordinal: 1 },
      'MINIVAN': { id: 'MINIVAN', name: 'Minivan', ordinal: 2 }
    },
    simplifiedServices: {
      'small_interior': { name: 'Interior Only', vehicleType: 'small', serviceType: 'interior', duration: 210, basePrice: 120 },
      'small_exterior': { name: 'Exterior Only', vehicleType: 'small', serviceType: 'exterior', duration: 180, basePrice: 100 },
      'small_full': { name: 'Full Detail', vehicleType: 'small', serviceType: 'full', duration: 240, basePrice: 200 },
      'truck_interior': { name: 'Interior Only', vehicleType: 'truck', serviceType: 'interior', duration: 270, basePrice: 144 },
      'truck_exterior': { name: 'Exterior Only', vehicleType: 'truck', serviceType: 'exterior', duration: 210, basePrice: 120 },
      'truck_full': { name: 'Full Detail', vehicleType: 'truck', serviceType: 'full', duration: 300, basePrice: 240 },
      'minivan_interior': { name: 'Interior Only', vehicleType: 'minivan', serviceType: 'interior', duration: 300, basePrice: 156 },
      'minivan_exterior': { name: 'Exterior Only', vehicleType: 'minivan', serviceType: 'exterior', duration: 210, basePrice: 130 },
      'minivan_full': { name: 'Full Detail', vehicleType: 'minivan', serviceType: 'full', duration: 330, basePrice: 260 }
    }
  };
}