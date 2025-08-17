import { catalogApi, teamMembersApi, locationsApi } from '../lib/client';
import { successResponse, handleSquareError } from '../lib/utils';
import {
  VEHICLE_TYPES,
  SERVICE_TYPES,
  createCategoryObject,
  createItemObject,
  createVariationObjects,
  parseSquareResponse,
  updateClaudeMd
} from '@/lib/utils/squareInitHelpers';

/**
 * POST /api/square/init
 * Initialize Square catalog and team members
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { type = 'all' } = body; // 'catalog', 'team', or 'all'
    
    const results = {
      catalog: null,
      team: null,
      location: null
    };
    
    // Get location first
    const locationsResponse = await locationsApi.list();
    if (!locationsResponse.result?.locations?.length) {
      throw new Error('No locations found');
    }
    results.location = locationsResponse.result.locations[0];
    
    // Initialize catalog
    if (type === 'catalog' || type === 'all') {
      results.catalog = await initializeCatalog();
    }
    
    // Initialize team members
    if (type === 'team' || type === 'all') {
      results.team = await initializeTeamMembers(results.location.id);
    }
    
    return successResponse({
      message: 'Initialization complete',
      results
    });
    
  } catch (error) {
    return handleSquareError(error, 'Failed to initialize Square data');
  }
}

/**
 * GET /api/square/init/status
 * Check current initialization status
 */
export async function GET() {
  try {
    const status = {
      location: null,
      categories: [],
      services: [],
      teamMembers: []
    };
    
    // Get location
    const locationsResponse = await locationsApi.list();
    if (locationsResponse.result?.locations?.length) {
      const location = locationsResponse.result.locations[0];
      status.location = {
        id: location.id,
        name: location.name,
        currency: location.currency
      };
      
      // Get catalog items
      const catalogResponse = await catalogApi.list({});
      const objects = catalogResponse.result?.objects || [];
      
      // Categories
      status.categories = objects
        .filter(obj => obj.type === 'CATEGORY')
        .map(cat => ({
          id: cat.id,
          name: cat.categoryData?.name
        }));
      
      // Services
      status.services = objects
        .filter(obj => obj.type === 'ITEM')
        .map(item => ({
          id: item.id,
          name: item.itemData?.name,
          categoryId: item.itemData?.categoryId,
          variationCount: item.itemData?.variations?.length || 0
        }));
      
      // Team members
      const teamResponse = await teamMembersApi.search({
        query: {
          filter: {
            locationIds: [location.id],
            status: 'ACTIVE'
          }
        }
      });
      
      status.teamMembers = (teamResponse.result?.teamMembers || []).map(member => ({
        id: member.id,
        name: `${member.givenName} ${member.familyName}`,
        status: member.status
      }));
    }
    
    return successResponse(status);
    
  } catch (error) {
    return handleSquareError(error, 'Failed to check initialization status');
  }
}

/**
 * Initialize catalog helper
 */
async function initializeCatalog() {
  const catalogObjects = [];
  const tempIdMap = {
    categories: {},
    items: {},
    variations: {}
  };
  
  // Create categories
  Object.values(VEHICLE_TYPES).forEach(vehicleType => {
    const category = createCategoryObject(vehicleType.name);
    catalogObjects.push(category);
    tempIdMap.categories[category.id] = vehicleType.name;
  });
  
  // Create items and variations
  Object.values(VEHICLE_TYPES).forEach(vehicleType => {
    const categoryTempId = `#${vehicleType.name.replace(/\s+/g, '_').toUpperCase()}`;
    
    Object.values(SERVICE_TYPES).forEach(serviceType => {
      const item = createItemObject(vehicleType.name, serviceType.name, categoryTempId);
      const variations = createVariationObjects(
        item.id,
        vehicleType.name,
        serviceType.name,
        vehicleType.multiplier
      );
      
      item.item_data.variations = variations.map(v => ({ id: v.id }));
      catalogObjects.push(item);
      variations.forEach(v => catalogObjects.push(v));
      
      tempIdMap.items[item.id] = `${vehicleType.name} - ${serviceType.name}`;
    });
  });
  
  // Batch upsert
  const idempotencyKey = `catalog-init-${Date.now()}`;
  const response = await catalogApi.batchUpsertCatalogObjects({
    idempotencyKey,
    batches: [{ objects: catalogObjects }]
  });
  
  if (response.result.errors?.length > 0) {
    throw new Error(`Catalog creation errors: ${JSON.stringify(response.result.errors)}`);
  }
  
  // Map IDs and update CLAUDE.md
  const idMapping = response.result.idMappings || [];
  idMapping.forEach(mapping => {
    if (tempIdMap.categories[mapping.clientObjectId]) {
      tempIdMap.categories[mapping.clientObjectId] = mapping.objectId;
    }
    if (tempIdMap.items[mapping.clientObjectId]) {
      tempIdMap.items[mapping.clientObjectId] = mapping.objectId;
    }
  });
  
  const results = parseSquareResponse(response.result, tempIdMap);
  await updateClaudeMd(results);
  
  return {
    created: response.result.objects?.length || 0,
    categories: results.categories.length,
    services: Object.values(results.services).flat().length,
    variations: Object.values(results.services).flat().reduce((acc, s) => acc + s.variations.length, 0)
  };
}

/**
 * Initialize team members helper
 */
async function initializeTeamMembers(locationId) {
  const TEAM_MEMBERS = [
    {
      givenName: 'Bay 1',
      familyName: 'Technician',
      emailAddress: 'bay1@carwash.local',
      phoneNumber: '+21600000001',
      assignedLocations: {
        assignment_type: 'ALL_CURRENT_AND_FUTURE_LOCATIONS'
      }
    },
    {
      givenName: 'Bay 2',
      familyName: 'Technician',
      emailAddress: 'bay2@carwash.local',
      phoneNumber: '+21600000002',
      assignedLocations: {
        assignment_type: 'ALL_CURRENT_AND_FUTURE_LOCATIONS'
      }
    },
    {
      givenName: 'Bay 3',
      familyName: 'Technician',
      emailAddress: 'bay3@carwash.local',
      phoneNumber: '+21600000003',
      assignedLocations: {
        assignment_type: 'ALL_CURRENT_AND_FUTURE_LOCATIONS'
      }
    }
  ];
  
  // Check existing team members
  const searchResponse = await teamMembersApi.search({
    query: {
      filter: {
        locationIds: [locationId],
        status: 'ACTIVE'
      }
    }
  });
  
  const existingMembers = searchResponse.result?.teamMembers || [];
  const created = [];
  const skipped = [];
  
  for (const memberData of TEAM_MEMBERS) {
    const existing = existingMembers.find(m => 
      m.givenName === memberData.givenName && 
      m.familyName === memberData.familyName
    );
    
    if (existing) {
      skipped.push(`${existing.givenName} ${existing.familyName}`);
      continue;
    }
    
    try {
      const createResponse = await teamMembersApi.createTeamMember({
        idempotencyKey: `team-${memberData.givenName}-${Date.now()}`,
        teamMember: {
          ...memberData,
          status: 'ACTIVE'
        }
      });
      
      const newMember = createResponse.result.teamMember;
      created.push(`${newMember.givenName} ${newMember.familyName}`);
    } catch (error) {
      console.error(`Failed to create ${memberData.givenName} ${memberData.familyName}:`, error);
    }
  }
  
  return {
    created: created.length,
    skipped: skipped.length,
    members: created.concat(skipped)
  };
}