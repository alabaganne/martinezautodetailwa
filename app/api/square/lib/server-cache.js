import { catalogApi, teamMembersApi } from './client';

class ServerCache {
  constructor() {
    this.catalog = {
      items: [],
      categories: [],
      services: {},  // Parsed service durations
      byId: {},      // Quick lookup by item ID
      initialized: false
    };
    
    this.teamMembers = {
      members: [],
      byId: {},
      byLocation: {},
      defaultId: null,
      initialized: false
    };
    
    this.initPromise = null;
    this.lastRefresh = null;
    this.refreshInterval = 3600000; // 1 hour in milliseconds
  }

  async initialize() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._performInitialization();
    await this.initPromise;
    this.lastRefresh = Date.now();
    
    return true;
  }

  async _performInitialization() {
    console.log('[ServerCache] Initializing server cache...');
    
    try {
      await Promise.all([
        this.loadCatalog(),
        this.loadTeamMembers()
      ]);
      
      console.log('[ServerCache] Server cache initialized successfully');
      console.log(`[ServerCache] Loaded ${Object.keys(this.catalog.services).length} services`);
      console.log(`[ServerCache] Loaded ${this.teamMembers.members.length} team members`);
    } catch (error) {
      console.error('[ServerCache] Failed to initialize cache:', error);
      // Load defaults if Square API fails
      this.loadDefaults();
    }
  }

  // ============ CATALOG METHODS ============

  async loadCatalog() {
    try {
      console.log('[ServerCache] Loading catalog from Square API...');
      
      const response = await catalogApi.list(undefined, 'ITEM,CATEGORY');
      const objects = response.result?.objects || [];
      
      // Reset catalog data
      this.catalog.items = [];
      this.catalog.categories = [];
      this.catalog.services = {};
      this.catalog.byId = {};
      
      // Process catalog objects
      objects.forEach(obj => {
        if (obj.type === 'CATEGORY') {
          this.catalog.categories.push(obj);
        } else if (obj.type === 'ITEM' && obj.itemData) {
          this.catalog.items.push(obj);
          this.catalog.byId[obj.id] = obj;
          
          // Parse service information
          this._parseServiceFromItem(obj);
        }
      });
      
      this.catalog.initialized = true;
      
      // If no services found, load defaults
      if (Object.keys(this.catalog.services).length === 0) {
        console.log('[ServerCache] No services found in catalog, loading defaults');
        this._loadDefaultServices();
      }
      
    } catch (error) {
      console.error('[ServerCache] Failed to load catalog:', error);
      this._loadDefaultServices();
      this.catalog.initialized = true;
    }
  }

  _parseServiceFromItem(item) {
    const itemData = item.itemData;
    const itemName = itemData.name?.toLowerCase() || '';
    
    // Determine service type
    let serviceType = null;
    if (itemName.includes('interior')) serviceType = 'interior';
    else if (itemName.includes('exterior')) serviceType = 'exterior';
    else if (itemName.includes('full')) serviceType = 'full';
    
    // Determine vehicle type
    let vehicleType = null;
    if (itemName.includes('small') || itemName.includes('car')) vehicleType = 'small';
    else if (itemName.includes('truck')) vehicleType = 'truck';
    else if (itemName.includes('minivan') || itemName.includes('van')) vehicleType = 'minivan';
    
    if (serviceType && vehicleType) {
      const key = `${serviceType}_${vehicleType}`;
      
      // Get duration from variations or use default
      let durationMinutes = this._getDefaultDuration(serviceType, vehicleType);
      let variationId = null;
      
      if (itemData.variations && itemData.variations.length > 0) {
        const variation = itemData.variations[0];
        variationId = variation.id;
        
        // Try to extract duration from variation data
        if (variation.itemVariationData?.serviceDuration) {
          durationMinutes = variation.itemVariationData.serviceDuration;
        }
      }
      
      this.catalog.services[key] = {
        itemId: item.id,
        variationId: variationId,
        name: itemData.name,
        serviceType,
        vehicleType,
        durationMinutes,
        durationHours: durationMinutes / 60
      };
    }
  }

  _loadDefaultServices() {
    const defaults = {
      'interior_small': { durationMinutes: 210, itemId: '63C3R73LAN5XXIDYPKOYX4GE' },
      'exterior_small': { durationMinutes: 180, itemId: 'RUTBVBVNYUVKFLD664QCAMLO' },
      'full_small': { durationMinutes: 240, itemId: '2YUDZ7737LEMGLEKK2ER76SS' },
      'interior_truck': { durationMinutes: 270, itemId: 'DXLVBL65CXRZBOPC7C5OLHJU' },
      'exterior_truck': { durationMinutes: 210, itemId: 'INXNRSXX3SDWVCDYMRYT6HQH' },
      'full_truck': { durationMinutes: 300, itemId: 'JLPPYYFCSNPM3XQ6KCYKUBHZ' },
      'interior_minivan': { durationMinutes: 300, itemId: 'AHEVPG7K5AQIVKBT7DUOLECG' },
      'exterior_minivan': { durationMinutes: 210, itemId: 'ZZPBS4JZIWWKRO35JHQW7OBP' },
      'full_minivan': { durationMinutes: 330, itemId: 'LTMB6IDA3LTZCDIQGE7IWLSD' },
    };
    
    Object.entries(defaults).forEach(([key, data]) => {
      const [serviceType, vehicleType] = key.split('_');
      this.catalog.services[key] = {
        ...data,
        serviceType,
        vehicleType,
        name: `${serviceType} - ${vehicleType}`,
        durationHours: data.durationMinutes / 60
      };
    });
  }

  _getDefaultDuration(serviceType, vehicleType) {
    const defaults = {
      'interior': { 'small': 210, 'truck': 270, 'minivan': 300 },
      'exterior': { 'small': 180, 'truck': 210, 'minivan': 210 },
      'full': { 'small': 240, 'truck': 300, 'minivan': 330 }
    };
    
    return defaults[serviceType]?.[vehicleType] || 240;
  }

  // ============ TEAM MEMBER METHODS ============

  async loadTeamMembers() {
    try {
      console.log('[ServerCache] Loading team members from Square API...');
      
      const response = await teamMembersApi.search({
        query: {
          filter: {
            status: 'ACTIVE'
          }
        },
        limit: 100
      });
      
      const members = response.result?.teamMembers || [];
      
      // Reset team member data
      this.teamMembers.members = members;
      this.teamMembers.byId = {};
      this.teamMembers.byLocation = {};
      
      // Build lookup structures
      members.forEach(member => {
        this.teamMembers.byId[member.id] = member;
        
        // Group by location
        if (member.assignedLocations) {
          member.assignedLocations.locationIds?.forEach(locationId => {
            if (!this.teamMembers.byLocation[locationId]) {
              this.teamMembers.byLocation[locationId] = [];
            }
            this.teamMembers.byLocation[locationId].push(member);
          });
        }
      });
      
      // Set default team member (first active member)
      if (members.length > 0) {
        this.teamMembers.defaultId = members[0].id;
      } else {
        // Use a default ID if no team members found
        this.teamMembers.defaultId = 'TM-DEFAULT';
      }
      
      this.teamMembers.initialized = true;
      
    } catch (error) {
      console.error('[ServerCache] Failed to load team members:', error);
      // Set default team member for fallback
      this.teamMembers.defaultId = 'TM-DEFAULT';
      this.teamMembers.members = [{
        id: 'TM-DEFAULT',
        givenName: 'Default',
        familyName: 'Team Member',
        status: 'ACTIVE'
      }];
      this.teamMembers.byId['TM-DEFAULT'] = this.teamMembers.members[0];
      this.teamMembers.initialized = true;
    }
  }

  // ============ PUBLIC ACCESS METHODS ============

  async ensureInitialized() {
    if (!this.catalog.initialized || !this.teamMembers.initialized) {
      await this.initialize();
    }
  }

  // Catalog access methods
  async getCatalogItems() {
    await this.ensureInitialized();
    return this.catalog.items;
  }

  async getCatalogCategories() {
    await this.ensureInitialized();
    return this.catalog.categories;
  }

  async getServiceInfo(serviceType, vehicleType) {
    await this.ensureInitialized();
    const key = `${serviceType}_${vehicleType}`;
    return this.catalog.services[key] || null;
  }

  async getServiceDuration(serviceType, vehicleType) {
    const service = await this.getServiceInfo(serviceType, vehicleType);
    return service?.durationMinutes || this._getDefaultDuration(serviceType, vehicleType);
  }

  async getServiceDurationHours(serviceType, vehicleType) {
    const minutes = await this.getServiceDuration(serviceType, vehicleType);
    return minutes / 60;
  }

  async getAllServices() {
    await this.ensureInitialized();
    return this.catalog.services;
  }

  // Team member access methods
  async getTeamMembers() {
    await this.ensureInitialized();
    return this.teamMembers.members;
  }

  async getTeamMember(id) {
    await this.ensureInitialized();
    return this.teamMembers.byId[id] || null;
  }

  async getDefaultTeamMemberId() {
    await this.ensureInitialized();
    return this.teamMembers.defaultId;
  }

  async getTeamMembersByLocation(locationId) {
    await this.ensureInitialized();
    return this.teamMembers.byLocation[locationId] || [];
  }

  // Refresh methods
  async refreshIfNeeded() {
    if (!this.lastRefresh || Date.now() - this.lastRefresh > this.refreshInterval) {
      await this.refresh();
    }
  }

  async refresh() {
    console.log('[ServerCache] Refreshing cache...');
    this.initPromise = null;
    await this.initialize();
  }

  // Default loading for fallback
  loadDefaults() {
    this._loadDefaultServices();
    
    // Load default team member
    this.teamMembers.defaultId = 'TM-DEFAULT';
    this.teamMembers.members = [{
      id: 'TM-DEFAULT',
      givenName: 'Default',
      familyName: 'Team Member',
      status: 'ACTIVE'
    }];
    this.teamMembers.byId['TM-DEFAULT'] = this.teamMembers.members[0];
    
    this.catalog.initialized = true;
    this.teamMembers.initialized = true;
  }
}

// Create singleton instance
export const serverCache = new ServerCache();

// Initialize cache on module load (non-blocking)
serverCache.initialize().catch(error => {
  console.error('[ServerCache] Failed to initialize on module load:', error);
});