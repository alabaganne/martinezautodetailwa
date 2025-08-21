import { serverCache } from './server-cache';

class CatalogCache {
  constructor() {
    // This class now acts as a compatibility layer for existing code
    // It delegates to the server cache
  }

  async initialize() {
    // Ensure server cache is initialized
    await serverCache.ensureInitialized();
  }

  async getDuration(serviceType, vehicleType) {
    return await serverCache.getServiceDuration(serviceType, vehicleType);
  }

  async getDurationInHours(serviceType, vehicleType) {
    return await serverCache.getServiceDurationHours(serviceType, vehicleType);
  }

  async getServiceInfo(serviceType, vehicleType) {
    return await serverCache.getServiceInfo(serviceType, vehicleType);
  }

  async getAllServices() {
    return await serverCache.getAllServices();
  }
}

// Create singleton instance for backward compatibility
export const catalogCache = new CatalogCache();