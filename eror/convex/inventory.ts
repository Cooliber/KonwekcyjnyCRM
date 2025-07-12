import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Inventory item schema definition
 */
export const inventorySchema = {
  name: v.string(),
  description: v.optional(v.string()),
  quantity: v.number(),
  reorderPoint: v.number(),
  unitPrice: v.number(),
  supplier: v.id("suppliers"),
  category: v.string(),
  lastUpdated: v.number(),
};

/**
 * Add a new inventory item
 */
export const add = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    reorderPoint: v.number(),
    unitPrice: v.number(),
    supplier: v.id("suppliers"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const newItemId = await ctx.db.insert("inventory", {
      ...args,
      lastUpdated: Date.now(),
    });
    return newItemId;
  },
});

/**
 * Update inventory quantity
 */
export const updateQuantity = mutation({
  args: {
    itemId: v.id("inventory"),
    quantityChange: v.number(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Inventory item not found");
    
    const newQuantity = item.quantity + args.quantityChange;
    await ctx.db.patch(args.itemId, {
      quantity: newQuantity,
      lastUpdated: Date.now(),
    });
    
    return newQuantity;
  },
});

/**
 * Get all low stock items
 */
export const getLowStock = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("inventory")
      .filter(q => q.lt(q.field("quantity"), q.field("reorderPoint")))
      .collect();
  },
});