'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const CatalogContext = createContext({});

// Custom hook to use the catalog context
export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}

// Provider component
export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch catalog data on mount
  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/catalog');
      const data = await response.json();
      
      if (data.success) {
        setCatalog(data.data);
      } else {
        // Use fallback data if API fails
        setCatalog(data.data);
        setError('Using offline catalog data');
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      setError('Failed to load catalog');
      // Set a minimal fallback catalog
      setCatalog(getMinimalCatalog());
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get service details
  const getService = (vehicleType, serviceType) => {
    if (!catalog) return null;
    const key = `${vehicleType}_${serviceType}`;
    return catalog.simplifiedServices?.[key] || null;
  };

  // Helper function to calculate price
  const calculatePrice = (vehicleType, serviceType, isVeryDirty = false) => {
    const service = getService(vehicleType, serviceType);
    if (!service) {
      // Fallback pricing
      const basePrices = {
        interior: 120,
        exterior: 100,
        full: 200
      };
      const multipliers = {
        small: 1.0,
        truck: 1.2,
        minivan: 1.3
      };
      const basePrice = basePrices[serviceType] || 150;
      const multiplier = multipliers[vehicleType] || 1.0;
      const extra = isVeryDirty ? 50 : 0;
      return (basePrice * multiplier) + extra;
    }
    
    const basePrice = service.basePrice || 150;
    const extra = isVeryDirty ? 50 : 0;
    return basePrice + extra;
  };

  // Helper function to get service duration
  const getServiceDuration = (vehicleType, serviceType) => {
    const service = getService(vehicleType, serviceType);
    return service?.duration || 240; // Default 4 hours
  };

  // Helper function to format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  };

  // Helper function to get all services for a vehicle type
  const getVehicleServices = (vehicleType) => {
    if (!catalog) return [];
    
    const services = [];
    const serviceTypes = ['interior', 'exterior', 'full'];
    
    serviceTypes.forEach(serviceType => {
      const service = getService(vehicleType, serviceType);
      if (service) {
        services.push({
          ...service,
          type: serviceType,
          price: calculatePrice(vehicleType, serviceType),
          durationFormatted: formatDuration(service.duration)
        });
      }
    });
    
    return services;
  };

  // Helper to get all categories
  const getCategories = () => {
    if (!catalog) return [];
    return Object.values(catalog.categories || {}).sort((a, b) => a.ordinal - b.ordinal);
  };

  // Helper to refresh catalog
  const refreshCatalog = () => {
    fetchCatalog();
  };

  const value = {
    catalog,
    loading,
    error,
    getService,
    calculatePrice,
    getServiceDuration,
    formatDuration,
    getVehicleServices,
    getCategories,
    refreshCatalog
  };

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
}

// Minimal fallback catalog
function getMinimalCatalog() {
  return {
    categories: {
      'SMALL': { id: 'SMALL', name: 'Small Car', ordinal: 0 },
      'TRUCK': { id: 'TRUCK', name: 'Truck', ordinal: 1 },
      'MINIVAN': { id: 'MINIVAN', name: 'Minivan', ordinal: 2 }
    },
    simplifiedServices: {
      'small_interior': {
        name: 'Interior Only',
        vehicleType: 'small',
        serviceType: 'interior',
        duration: 210,
        basePrice: 120
      },
      'small_exterior': {
        name: 'Exterior Only',
        vehicleType: 'small',
        serviceType: 'exterior',
        duration: 180,
        basePrice: 100
      },
      'small_full': {
        name: 'Full Detail',
        vehicleType: 'small',
        serviceType: 'full',
        duration: 240,
        basePrice: 200
      },
      'truck_interior': {
        name: 'Interior Only',
        vehicleType: 'truck',
        serviceType: 'interior',
        duration: 270,
        basePrice: 144
      },
      'truck_exterior': {
        name: 'Exterior Only',
        vehicleType: 'truck',
        serviceType: 'exterior',
        duration: 210,
        basePrice: 120
      },
      'truck_full': {
        name: 'Full Detail',
        vehicleType: 'truck',
        serviceType: 'full',
        duration: 300,
        basePrice: 240
      },
      'minivan_interior': {
        name: 'Interior Only',
        vehicleType: 'minivan',
        serviceType: 'interior',
        duration: 300,
        basePrice: 156
      },
      'minivan_exterior': {
        name: 'Exterior Only',
        vehicleType: 'minivan',
        serviceType: 'exterior',
        duration: 210,
        basePrice: 130
      },
      'minivan_full': {
        name: 'Full Detail',
        vehicleType: 'minivan',
        serviceType: 'full',
        duration: 330,
        basePrice: 260
      }
    }
  };
}