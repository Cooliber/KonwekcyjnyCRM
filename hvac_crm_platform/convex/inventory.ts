import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

/**
 * Enhanced Inventory Management System
 * Features: Stock tracking per Warsaw district, delivery route optimization, auto-reorder
 * Target: Efficient stock management with district-based optimization
 */

// Warsaw district warehouse priorities for stock allocation
const DISTRICT_WAREHOUSE_PRIORITY = {
  'Śródmieście': ['central_warehouse', 'mokotow_depot'],
  'Wilanów': ['mokotow_depot', 'ursynow_storage'],
  'Mokotów': ['mokotow_depot', 'central_warehouse'],
  'Żoliborz': ['central_warehouse', 'wola_storage'],
  'Ursynów': ['ursynow_storage', 'mokotow_depot'],
  'Wola': ['wola_storage', 'central_warehouse'],
  'Praga-Południe': ['praga_depot', 'central_warehouse'],
  'Targówek': ['praga_depot', 'wola_storage']
};

// Stock level thresholds by equipment category
const STOCK_THRESHOLDS = {
  'split_ac': { min: 5, optimal: 15, max: 30 },
  'multi_split': { min: 3, optimal: 10, max: 20 },
  'vrf_system': { min: 1, optimal: 3, max: 8 },
  'heat_pump': { min: 2, optimal: 8, max: 15 },
  'thermostat': { min: 10, optimal: 25, max: 50 },
  'ductwork': { min: 20, optimal: 50, max: 100 },
  'filter': { min: 50, optimal: 150, max: 300 },
  'parts': { min: 100, optimal: 300, max: 500 },
  'tools': { min: 5, optimal: 15, max: 25 },
  'refrigerant': { min: 10, optimal: 30, max: 60 }
};

// Get inventory with district-based filtering
export const list = query({
  args: {
    district: v.optional(v.string()),
    category: v.optional(v.string()),
    lowStock: v.optional(v.boolean()),
    warehouseId: v.optional(v.id("warehouses")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("inventory");
    
    if (args.district) {
      query = query.filter(q => q.eq(q.field("district"), args.district));
    }
    
    if (args.warehouseId) {
      query = query.filter(q => q.eq(q.field("warehouseId"), args.warehouseId));
    }

    const inventoryItems = await query.take(args.limit || 100);

    // Enhance with equipment and warehouse data
    const enhancedItems = await Promise.all(
      inventoryItems.map(async (item) => {
        const equipment = await ctx.db.get(item.equipmentId);
        const warehouse = await ctx.db.get(item.warehouseId);
        const supplier = item.supplierId ? await ctx.db.get(item.supplierId) : null;
        
        // Calculate stock status
        const threshold = equipment ? STOCK_THRESHOLDS[equipment.category] : null;
        const stockStatus = threshold ? getStockStatus(item.quantity, threshold) : 'unknown';
        
        return {
          ...item,
          equipment,
          warehouse,
          supplier,
          stockStatus,
          threshold,
          needsReorder: item.quantity <= item.minStockLevel
        };
      })
    );

    // Filter by category if specified
    let filteredItems = enhancedItems;
    if (args.category) {
      filteredItems = enhancedItems.filter(item => item.equipment?.category === args.category);
    }

    // Filter by low stock if specified
    if (args.lowStock) {
      filteredItems = filteredItems.filter(item => item.needsReorder);
    }

    return filteredItems;
  },
});

// Update inventory quantity
export const updateQuantity = mutation({
  args: {
    id: v.id("inventory"),
    quantityChange: v.number(),
    reason: v.union(
      v.literal("restock"),
      v.literal("usage"),
      v.literal("transfer"),
      v.literal("adjustment"),
      v.literal("return")
    ),
    notes: v.optional(v.string()),
    jobId: v.optional(v.id("jobs"))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inventoryItem = await ctx.db.get(args.id);
    if (!inventoryItem) throw new Error("Inventory item not found");

    const newQuantity = Math.max(0, inventoryItem.quantity + args.quantityChange);
    
    await ctx.db.patch(args.id, {
      quantity: newQuantity,
      lastUpdatedBy: userId,
      lastUpdatedVia: "web"
    });

    // Log inventory movement
    await ctx.db.insert("integrationLogs", {
      service: "maps",
      action: "inventory_movement",
      status: "success",
      data: JSON.stringify({
        inventoryId: args.id,
        previousQuantity: inventoryItem.quantity,
        newQuantity,
        quantityChange: args.quantityChange,
        reason: args.reason,
        notes: args.notes,
        jobId: args.jobId,
        district: inventoryItem.district
      }),
      relatedId: args.id
    });

    // Check if reorder is needed
    if (newQuantity <= inventoryItem.minStockLevel && inventoryItem.autoReorder) {
      await ctx.scheduler.runAfter(0, internal.inventory.triggerAutoReorder, {
        inventoryId: args.id
      });
    }

    // Trigger workflow for low stock alerts
    if (newQuantity <= inventoryItem.minStockLevel) {
      await ctx.scheduler.runAfter(0, internal.workflows.executeWorkflows, {
        triggerEvent: "EQUIPMENT_LOW_STOCK",
        entityId: args.id,
        entityType: "inventory",
        entityData: {
          ...inventoryItem,
          quantity: newQuantity,
          equipment: await ctx.db.get(inventoryItem.equipmentId)
        }
      });
    }

    return args.id;
  },
});

// Transfer stock between warehouses
export const transferStock = mutation({
  args: {
    fromInventoryId: v.id("inventory"),
    toWarehouseId: v.id("warehouses"),
    quantity: v.number(),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const fromInventory = await ctx.db.get(args.fromInventoryId);
    if (!fromInventory) throw new Error("Source inventory not found");

    if (fromInventory.quantity < args.quantity) {
      throw new Error("Insufficient stock for transfer");
    }

    const toWarehouse = await ctx.db.get(args.toWarehouseId);
    if (!toWarehouse) throw new Error("Destination warehouse not found");

    // Check if destination inventory exists
    const existingToInventory = await ctx.db
      .query("inventory")
      .filter(q => q.and(
        q.eq(q.field("equipmentId"), fromInventory.equipmentId),
        q.eq(q.field("warehouseId"), args.toWarehouseId)
      ))
      .first();

    // Update source inventory
    await ctx.db.patch(args.fromInventoryId, {
      quantity: fromInventory.quantity - args.quantity,
      lastUpdatedBy: userId,
      lastUpdatedVia: "web"
    });

    // Update or create destination inventory
    if (existingToInventory) {
      await ctx.db.patch(existingToInventory._id, {
        quantity: existingToInventory.quantity + args.quantity,
        lastUpdatedBy: userId,
        lastUpdatedVia: "web"
      });
    } else {
      await ctx.db.insert("inventory", {
        equipmentId: fromInventory.equipmentId,
        warehouseId: args.toWarehouseId,
        quantity: args.quantity,
        minStockLevel: fromInventory.minStockLevel,
        lastRestocked: Date.now(),
        supplierId: fromInventory.supplierId,
        autoReorder: fromInventory.autoReorder,
        district: toWarehouse.district,
        lastUpdatedBy: userId,
        lastUpdatedVia: "web"
      });
    }

    // Log transfer
    await ctx.db.insert("integrationLogs", {
      service: "maps",
      action: "inventory_transfer",
      status: "success",
      data: JSON.stringify({
        fromInventoryId: args.fromInventoryId,
        toWarehouseId: args.toWarehouseId,
        quantity: args.quantity,
        reason: args.reason,
        fromDistrict: fromInventory.district,
        toDistrict: toWarehouse.district
      }),
      relatedId: args.fromInventoryId
    });

    return { success: true };
  },
});

// Get stock availability for job planning
export const getStockAvailability = query({
  args: {
    equipmentIds: v.array(v.id("equipment")),
    district: v.string(),
    requiredQuantities: v.array(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const availability = [];
    
    for (let i = 0; i < args.equipmentIds.length; i++) {
      const equipmentId = args.equipmentIds[i];
      const requiredQuantity = args.requiredQuantities[i];
      
      // Get preferred warehouses for the district
      const preferredWarehouses = DISTRICT_WAREHOUSE_PRIORITY[args.district as keyof typeof DISTRICT_WAREHOUSE_PRIORITY] || [];
      
      let availableQuantity = 0;
      const warehouseStock = [];
      
      // Check stock in preferred order
      for (const warehouseName of preferredWarehouses) {
        const warehouse = await ctx.db
          .query("warehouses")
          .filter(q => q.eq(q.field("name"), warehouseName))
          .first();
        
        if (warehouse) {
          const inventory = await ctx.db
            .query("inventory")
            .filter(q => q.and(
              q.eq(q.field("equipmentId"), equipmentId),
              q.eq(q.field("warehouseId"), warehouse._id)
            ))
            .first();
          
          if (inventory) {
            warehouseStock.push({
              warehouse: warehouse.name,
              district: warehouse.district,
              available: inventory.quantity,
              distance: calculateDistanceToDistrict(warehouse.district, args.district)
            });
            availableQuantity += inventory.quantity;
          }
        }
      }
      
      availability.push({
        equipmentId,
        requiredQuantity,
        availableQuantity,
        sufficient: availableQuantity >= requiredQuantity,
        warehouseStock: warehouseStock.sort((a, b) => a.distance - b.distance)
      });
    }
    
    return availability;
  },
});

// Generate delivery route optimization
export const optimizeDeliveryRoute = action({
  args: {
    deliveries: v.array(v.object({
      warehouseId: v.id("warehouses"),
      jobId: v.id("jobs"),
      equipmentIds: v.array(v.id("equipment")),
      quantities: v.array(v.number())
    })),
    date: v.string()
  },
  handler: async (ctx, args) => {
    const deliveryPoints = [];
    
    for (const delivery of args.deliveries) {
      const warehouse = await ctx.runQuery(internal.inventory.getWarehouse, {
        id: delivery.warehouseId
      });
      
      const job = await ctx.runQuery(internal.inventory.getJob, {
        id: delivery.jobId
      });
      
      if (warehouse && job) {
        deliveryPoints.push({
          id: `delivery_${delivery.jobId}`,
          type: 'delivery',
          warehouseCoords: warehouse.coordinates,
          jobCoords: job.location || { lat: 52.2297, lng: 21.0122 }, // Default to Warsaw center
          district: job.district || warehouse.district,
          priority: job.priority || 'medium',
          estimatedDuration: 30, // 30 minutes per delivery
          equipmentCount: delivery.equipmentIds.length
        });
      }
    }
    
    // Simple route optimization (in production, would use advanced algorithms)
    const optimizedRoute = optimizeDeliveryPoints(deliveryPoints);
    
    // Calculate route metrics
    const totalDistance = calculateTotalDistance(optimizedRoute);
    const totalDuration = optimizedRoute.reduce((sum, point) => sum + point.estimatedDuration, 0);
    const efficiency = calculateRouteEfficiency(optimizedRoute);
    
    return {
      route: optimizedRoute,
      totalDistance,
      totalDuration,
      efficiency,
      estimatedCost: totalDistance * 2.5 + totalDuration * 1.2, // PLN
      optimizedAt: Date.now()
    };
  },
});

// Get inventory analytics
export const getInventoryAnalytics = query({
  args: {
    district: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("inventory");
    
    if (args.district) {
      query = query.filter(q => q.eq(q.field("district"), args.district));
    }
    
    const inventoryItems = await query.collect();
    
    // Get equipment data for categorization
    const enhancedItems = await Promise.all(
      inventoryItems.map(async (item) => {
        const equipment = await ctx.db.get(item.equipmentId);
        return { ...item, equipment };
      })
    );
    
    // Calculate analytics
    const analytics = {
      totalItems: enhancedItems.length,
      totalValue: enhancedItems.reduce((sum, item) => 
        sum + (item.quantity * (item.equipment?.sellPrice || 0)), 0
      ),
      lowStockItems: enhancedItems.filter(item => 
        item.quantity <= item.minStockLevel
      ).length,
      byCategory: {} as Record<string, { count: number; totalQuantity: number; totalValue: number; lowStockCount: number }>,
      byDistrict: {} as Record<string, { count: number; totalQuantity: number; totalValue: number; lowStockCount: number }>,
      stockTurnover: 0,
      averageStockLevel: 0
    };
    
    // Group by category
    enhancedItems.forEach(item => {
      const category = item.equipment?.category || 'unknown';
      if (!analytics.byCategory[category]) {
        analytics.byCategory[category] = {
          count: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockCount: 0
        };
      }
      
      analytics.byCategory[category].count++;
      analytics.byCategory[category].totalQuantity += item.quantity;
      analytics.byCategory[category].totalValue += item.quantity * (item.equipment?.sellPrice || 0);
      
      if (item.quantity <= item.minStockLevel) {
        analytics.byCategory[category].lowStockCount++;
      }
    });
    
    // Group by district
    enhancedItems.forEach(item => {
      const district = item.district;
      if (!analytics.byDistrict[district]) {
        analytics.byDistrict[district] = {
          count: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockCount: 0
        };
      }
      
      analytics.byDistrict[district].count++;
      analytics.byDistrict[district].totalQuantity += item.quantity;
      analytics.byDistrict[district].totalValue += item.quantity * (item.equipment?.sellPrice || 0);
      
      if (item.quantity <= item.minStockLevel) {
        analytics.byDistrict[district].lowStockCount++;
      }
    });
    
    return analytics;
  },
});

// Internal queries for route optimization
export const getWarehouse = query({
  args: { id: v.id("warehouses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getJob = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Internal mutation for auto-reorder
export const triggerAutoReorder = internalMutation({
  args: {
    inventoryId: v.id("inventory")
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db.get(args.inventoryId);
    if (!inventory) return;
    
    const equipment = await ctx.db.get(inventory.equipmentId);
    if (!equipment) return;
    
    const threshold = STOCK_THRESHOLDS[equipment.category];
    const reorderQuantity = threshold ? threshold.optimal - inventory.quantity : 10;
    
    // Create reorder notification
    const managers = await ctx.db
      .query("userProfiles")
      .filter(q => q.or(
        q.eq(q.field("role"), "admin"),
        q.eq(q.field("role"), "manager")
      ))
      .collect();
    
    for (const manager of managers) {
      await ctx.db.insert("notifications", {
        userId: manager.userId,
        title: `🔄 Auto-Reorder Triggered - ${equipment.name}`,
        message: `Stock level critical in ${inventory.district}. Suggested reorder: ${reorderQuantity} units`,
        type: "inventory_alert",
        priority: "high",
        read: false,
        relatedId: args.inventoryId,
        actionUrl: `/inventory?id=${args.inventoryId}`,
        districtContext: {
          district: inventory.district,
          affluenceLevel: 5,
          priorityMultiplier: 1.0
        }
      });
    }
  },
});



// Helper functions
function getStockStatus(quantity: number, threshold: any): string {
  if (quantity <= threshold.min) return 'critical';
  if (quantity <= threshold.min * 1.5) return 'low';
  if (quantity >= threshold.optimal) return 'optimal';
  return 'adequate';
}

function calculateDistanceToDistrict(fromDistrict: string, toDistrict: string): number {
  // Simplified distance calculation between Warsaw districts
  const districtDistances: Record<string, Record<string, number>> = {
    'Śródmieście': { 'Mokotów': 5, 'Wilanów': 12, 'Żoliborz': 8, 'Ursynów': 15, 'Wola': 6, 'Praga-Południe': 10, 'Targówek': 15 },
    'Mokotów': { 'Śródmieście': 5, 'Wilanów': 8, 'Żoliborz': 12, 'Ursynów': 10, 'Wola': 10, 'Praga-Południe': 15, 'Targówek': 20 },
    // Add more district distances as needed
  };
  
  return districtDistances[fromDistrict]?.[toDistrict] || 10; // Default 10km
}

function optimizeDeliveryPoints(points: any[]): any[] {
  // Simple nearest neighbor optimization
  // In production, would use more sophisticated algorithms
  return points.sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder: Record<string, number> = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    }
    return a.district.localeCompare(b.district);
  });
}

function calculateTotalDistance(route: any[]): number {
  // Simplified distance calculation
  return route.length * 8; // Average 8km between points
}

function calculateRouteEfficiency(route: any[]): number {
  // Calculate efficiency based on district clustering and priority ordering
  let efficiency = 0.8; // Base efficiency
  
  // Bonus for district clustering
  const districts = route.map(point => point.district);
  const uniqueDistricts = new Set(districts);
  if (uniqueDistricts.size < districts.length * 0.7) {
    efficiency += 0.1; // 10% bonus for good clustering
  }
  
  return Math.min(efficiency, 1.0);
}
