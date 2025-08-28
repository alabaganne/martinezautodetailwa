'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Location {
  id: string;
  name: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
  phoneNumber?: string;
  businessHours?: any;
  timezone?: string;
  status?: string;
}

interface LocationContextType {
  location: Location | null;
  locationId: string | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/locations');
      const data = await response.json();

      if (data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
        // Get the first active location
        const activeLocation = data.locations.find((loc: Location) => 
          loc.status === 'ACTIVE'
        ) || data.locations[0];
        
        setLocation(activeLocation);
        setLocationId(activeLocation.id);
      } else {
        setError('No locations found');
      }
    } catch (err) {
      console.error('Failed to fetch location:', err);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  const value: LocationContextType = {
    location,
    locationId,
    loading,
    error,
    refreshLocation: fetchLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}