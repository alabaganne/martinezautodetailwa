import { catalogCache } from '../square/lib/catalog-cache';

/**
 * GET /api/catalog
 * Fetch complete catalog data for user-side consumption
 */
export async function GET() {
  try {
    // Get all catalog data from cache
    const catalog = await catalogCache.getCatalog();
    
    // Structure the data for easy consumption
    const structuredCatalog = {
      categories: {},
      services: {},
      variations: {},
      serviceDurations: {},
      priceMap: {}
    };
    
    // Process categories
    catalog.categories.forEach(category => {
      structuredCatalog.categories[category.id] = {
        id: category.id,
        name: category.category_data.name,
        ordinal: category.category_data.ordinal || 0
      };
    });
    
    // Process items (services)
    catalog.items.forEach(item => {
      const itemData = item.item_data;
      const categoryId = itemData.category_id;
      
      structuredCatalog.services[item.id] = {
        id: item.id,
        name: itemData.name,
        description: itemData.description || '',
        categoryId: categoryId,
        categoryName: structuredCatalog.categories[categoryId]?.name || '',
        variations: []
      };
      
      // Process variations for this item
      if (itemData.variations) {
        itemData.variations.forEach(variation => {
          const variationData = variation.item_variation_data;
          
          structuredCatalog.variations[variation.id] = {
            id: variation.id,
            itemId: item.id,
            name: variationData.name,
            price: variationData.price_money ? {
              amount: variationData.price_money.amount,
              currency: variationData.price_money.currency,
              formatted: formatPrice(variationData.price_money.amount, variationData.price_money.currency)
            } : null,
            ordinal: variationData.ordinal || 0
          };
          
          // Add variation ID to service
          structuredCatalog.services[item.id].variations.push(variation.id);
          
          // Add to price map for quick lookup
          if (variationData.price_money) {
            const key = `${item.id}_${variation.id}`;
            structuredCatalog.priceMap[key] = variationData.price_money.amount;
          }
        });
      }
      
      // Extract duration from item name or description
      const duration = extractDuration(itemData.name);
      if (duration) {
        structuredCatalog.serviceDurations[item.id] = duration;
      }
    });
    
    // Add service type mapping based on naming convention
    const serviceTypeMap = {
      'Interior Only': 'interior',
      'Exterior Only': 'exterior',
      'Full Detail': 'full'
    };
    
    const vehicleTypeMap = {
      'SMALL CAR': 'small',
      'TRUCK': 'truck',
      'MINIVAN': 'minivan'
    };
    
    // Create a simplified service lookup
    const simplifiedServices = {};
    Object.values(structuredCatalog.services).forEach(service => {
      const serviceType = Object.entries(serviceTypeMap).find(([key]) => 
        service.name.includes(key)
      )?.[1];
      
      const vehicleType = vehicleTypeMap[service.categoryName];
      
      if (serviceType && vehicleType) {
        const key = `${vehicleType}_${serviceType}`;
        simplifiedServices[key] = {
          ...service,
          serviceType,
          vehicleType,
          duration: structuredCatalog.serviceDurations[service.id]
        };
      }
    });
    
    return Response.json({
      success: true,
      data: {
        ...structuredCatalog,
        simplifiedServices,
        serviceTypeMap,
        vehicleTypeMap
      },
      lastUpdated: catalogCache.lastFetched
    });
    
  } catch (error) {
    console.error('Failed to fetch catalog:', error);
    
    // Return a fallback catalog structure
    return Response.json({
      success: false,
      error: 'Failed to fetch catalog',
      data: getFallbackCatalog()
    }, { status: 500 });
  }
}

/**
 * Format price for display
 */
function formatPrice(amountInCents, currency) {
  if (currency === 'TND') {
    // Convert millimes to TND
    const tnd = amountInCents / 1000;
    return `${tnd.toFixed(0)} TND`;
  } else {
    // Default USD formatting
    const dollars = amountInCents / 100;
    return `$${dollars.toFixed(2)}`;
  }
}

/**
 * Extract duration from service name
 */
function extractDuration(name) {
  const matches = name.match(/(\d+)h\s*(?:(\d+)m)?/);
  if (matches) {
    const hours = parseInt(matches[1]) || 0;
    const minutes = parseInt(matches[2]) || 0;
    return hours * 60 + minutes; // Return total minutes
  }
  
  // Default durations based on service type
  if (name.includes('Interior Only')) return 210; // 3.5 hours
  if (name.includes('Exterior Only')) return 180; // 3 hours
  if (name.includes('Full Detail')) return 240; // 4 hours
  
  return 240; // Default 4 hours
}

/**
 * Fallback catalog for when Square API is unavailable
 */
function getFallbackCatalog() {
  return {
    categories: {
      'SMALL_CAR': { id: 'SMALL_CAR', name: 'Small Car', ordinal: 0 },
      'TRUCK': { id: 'TRUCK', name: 'Truck', ordinal: 1 },
      'MINIVAN': { id: 'MINIVAN', name: 'Minivan', ordinal: 2 }
    },
    services: {},
    variations: {},
    serviceDurations: {
      'interior_small': 210,
      'exterior_small': 180,
      'full_small': 240,
      'interior_truck': 270,
      'exterior_truck': 210,
      'full_truck': 300,
      'interior_minivan': 300,
      'exterior_minivan': 210,
      'full_minivan': 330
    },
    priceMap: {},
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