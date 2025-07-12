import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Warsaw districts for inventory tracking
const WARSAW_DISTRICTS = [
  'Śródmieście', 'Mokotów', 'Wilanów', 'Żoliborz',
  'Ursynów', 'Wola', 'Praga-Południe', 'Targówek'
];

// Stock thresholds by equipment category
const STOCK_THRESHOLDS = {
  split_ac: { min: 5, optimal: 15, max: 30 },
  multi_split: { min: 3, optimal: 10, max: 20 },
  vrf_system: { min: 2, optimal: 5, max: 10 },
  heat_pump: { min: 3, optimal: 8, max: 15 },
  thermostat: { min: 10, optimal: 25, max: 50 },
  ductwork: { min: 20, optimal: 50, max: 100 },
  filter: { min: 50, optimal: 100, max: 200 },
  parts: { min: 25, optimal: 75, max: 150 },
  tools: { min: 5, optimal: 10, max: 20 },
  refrigerant: { min: 10, optimal: 30, max: 60 }
};

// List inventory with advanced filtering
export const list = query({
  args: {
    district: v.optional(v.string()),
    category: v.optional(v.string()),
    lowStock: v.optional(v.boolean()),
    warehouseId: v.optional(v.id("warehouses")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let inventory;

    // Search functionality
    if (args.search) {
      inventory = await ctx.db
        .query("inventory")
        .withSearchIndex("search_inventory", (q) =>
          q.search("equipmentId", args.search!)
        )
        .collect();
    } else {
      inventory = await ctx.db.query("inventory").order("desc").collect();
    }

    // Apply filters
    let filteredInventory = inventory;

    if (args.district) {
      filteredInventory = filteredInventory.filter(item =>
        item.district === args.district
      );
    }

    if (args.warehouseId) {
      filteredInventory = filteredInventory.filter(item =>
        item.warehouseId === args.warehouseId
      );
    }

    if (args.lowStock) {
      filteredInventory = filteredInventory.filter(item =>
        item.quantity <= item.minStockLevel
      );
    }

    // Enrich with equipment details
    const enrichedInventory = await Promise.all(
      filteredInventory.map(async (item) => {
        const equipment = await ctx.db.get(item.equipmentId);
        const warehouse = await ctx.db.get(item.warehouseId);
        const supplier = await ctx.db.get(item.supplierId);

        return {
          ...item,
          equipment,
          warehouse,
          supplier,
          isLowStock: item.quantity <= item.minStockLevel,
          stockStatus: getStockStatus(item.quantity, item.minStockLevel, equipment?.category)
        };
      })
    );

    // Filter by category if specified
    if (args.category) {
      return enrichedInventory.filter(item =>
        item.equipment?.category === args.category
      );
    }

    return enrichedInventory;
  },
});

// Get inventory analytics
export const getInventoryAnalytics = query({
  args: {
    district: v.optional(v.string()),
    timeframe: v.optional(v.string()), // "week", "month", "quarter"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inventory = await ctx.db.query("inventory").collect();

    let filteredInventory = inventory;
    if (args.district) {
      filteredInventory = inventory.filter(item => item.district === args.district);
    }

    // Calculate analytics
    const totalItems = filteredInventory.length;
    const lowStockItems = filteredInventory.filter(item =>
      item.quantity <= item.minStockLevel
    ).length;

    const totalQuantity = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate total value (need equipment prices)
    const enrichedItems = await Promise.all(
      filteredInventory.map(async (item) => {
        const equipment = await ctx.db.get(item.equipmentId);
        return {
          ...item,
          equipment,
          value: equipment?.purchasePrice ? equipment.purchasePrice * item.quantity : 0
        };
      })
    );

    const totalValue = enrichedItems.reduce((sum, item) => sum + item.value, 0);

    // Category breakdown
    const categoryBreakdown = enrichedItems.reduce((acc, item) => {
      const category = item.equipment?.category || 'unknown';
      if (!acc[category]) {
        acc[category] = { quantity: 0, value: 0, items: 0 };
      }
      acc[category].quantity += item.quantity;
      acc[category].value += item.value;
      acc[category].items += 1;
      return acc;
    }, {} as Record<string, { quantity: number; value: number; items: number }>);

    // District breakdown
    const districtBreakdown = filteredInventory.reduce((acc, item) => {
      if (!acc[item.district]) {
        acc[item.district] = { quantity: 0, items: 0 };
      }
      acc[item.district].quantity += item.quantity;
      acc[item.district].items += 1;
      return acc;
    }, {} as Record<string, { quantity: number; items: number }>);

    return {
      summary: {
        totalItems,
        lowStockItems,
        totalQuantity,
        totalValue,
        lowStockPercentage: totalItems > 0 ? (lowStockItems / totalItems) * 100 : 0
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        ...data
      })),
      districtBreakdown: Object.entries(districtBreakdown).map(([district, data]) => ({
        district,
        ...data
      })),
      reorderAlerts: enrichedItems
        .filter(item => item.quantity <= item.minStockLevel && item.autoReorder)
        .map(item => ({
          equipmentId: item.equipmentId,
          equipmentName: item.equipment?.name || 'Unknown',
          currentQuantity: item.quantity,
          minStockLevel: item.minStockLevel,
          district: item.district,
          warehouse: item.warehouseId
        }))
    };
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
      v.literal("adjustment"),
      v.literal("transfer"),
      v.literal("damaged"),
      v.literal("returned")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const inventory = await ctx.db.get(args.id);
    if (!inventory) throw new Error("Inventory item not found");

    const newQuantity = Math.max(0, inventory.quantity + args.quantityChange);

    await ctx.db.patch(args.id, {
      quantity: newQuantity,
      lastUpdatedBy: userId,
      lastUpdatedVia: "web"
    });

    // Create inventory transaction log
    await ctx.db.insert("inventoryTransactions", {
      inventoryId: args.id,
      type: args.reason,
      quantityChange: args.quantityChange,
      previousQuantity: inventory.quantity,
      newQuantity,
      performedBy: userId,
      notes: args.notes || "",
      timestamp: Date.now()
    });

    // Check for low stock and create notification
    if (newQuantity <= inventory.minStockLevel) {
      const equipment = await ctx.db.get(inventory.equipmentId);
      await ctx.db.insert("notifications", {
        userId,
        title: "Low Stock Alert",
        message: `${equipment?.name || 'Equipment'} in ${inventory.district} is running low (${newQuantity} remaining)`,
        type: "inventory_alert",
        priority: "medium",
        read: false,
        relatedId: args.id,
      });

      // Auto-reorder if enabled
      if (inventory.autoReorder && equipment?.category) {
        const threshold = STOCK_THRESHOLDS[equipment.category as keyof typeof STOCK_THRESHOLDS];
        if (threshold) {
          const reorderQuantity = threshold.optimal - newQuantity;

          await ctx.db.insert("purchaseOrders", {
            supplierId: inventory.supplierId,
            equipmentId: inventory.equipmentId,
            quantity: reorderQuantity,
            status: "pending",
            requestedBy: userId,
            priority: "normal",
            deliveryLocation: inventory.warehouseId,
            notes: `Auto-reorder triggered for low stock in ${inventory.district}`,
            createdAt: Date.now()
          });

          await ctx.db.insert("notifications", {
            userId,
            title: "Auto-Reorder Created",
            message: `Purchase order for ${reorderQuantity} units of ${equipment.name} has been created`,
            type: "system",
            priority: "low",
            read: false,
            relatedId: inventory.equipmentId,
          });
        }
      }
    }

    return newQuantity;
  },
});

// Transfer stock between warehouses
export const transferStock = mutation({
  args: {
    fromInventoryId: v.id("inventory"),
    toWarehouseId: v.id("warehouses"),
    quantity: v.number(),
    reason: v.string(),
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
    if (!toWarehouse) throw new Error("Target warehouse not found");

    // Update source inventory
    await ctx.db.patch(args.fromInventoryId, {
      quantity: fromInventory.quantity - args.quantity,
      lastUpdatedBy: userId,
      lastUpdatedVia: "web"
    });

    // Find or create target inventory
    const existingTargetInventory = await ctx.db
      .query("inventory")
      .withIndex("by_equipment", (q) => q.eq("equipmentId", fromInventory.equipmentId))
      .filter((q) => q.eq(q.field("warehouseId"), args.toWarehouseId))
      .first();

    if (existingTargetInventory) {
      // Update existing inventory
      await ctx.db.patch(existingTargetInventory._id, {
        quantity: existingTargetInventory.quantity + args.quantity,
        lastUpdatedBy: userId,
        lastUpdatedVia: "web"
      });
    } else {
      // Create new inventory record
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

    // Log transfer transactions
    await ctx.db.insert("inventoryTransactions", {
      inventoryId: args.fromInventoryId,
      type: "transfer",
      quantityChange: -args.quantity,
      previousQuantity: fromInventory.quantity,
      newQuantity: fromInventory.quantity - args.quantity,
      performedBy: userId,
      notes: `Transfer to ${toWarehouse.name}: ${args.reason}`,
      timestamp: Date.now()
    });

    const equipment = await ctx.db.get(fromInventory.equipmentId);
    await ctx.db.insert("notifications", {
      userId,
      title: "Stock Transfer Completed",
      message: `${args.quantity} units of ${equipment?.name || 'equipment'} transferred to ${toWarehouse.name}`,
      type: "system",
      priority: "low",
      read: false,
      relatedId: fromInventory.equipmentId,
    });

    return true;
  },
});

// Helper function to determine stock status
function getStockStatus(quantity: number, minStock: number, category?: string) {
  if (quantity <= minStock) return "low";

  if (category && STOCK_THRESHOLDS[category as keyof typeof STOCK_THRESHOLDS]) {
    const threshold = STOCK_THRESHOLDS[category as keyof typeof STOCK_THRESHOLDS];
    if (quantity >= threshold.optimal) return "optimal";
    if (quantity >= threshold.min) return "adequate";
  }

  return "adequate";
}