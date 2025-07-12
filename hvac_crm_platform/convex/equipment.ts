import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    lowStock: v.optional(v.boolean()),
    supplier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.search) {
      return await ctx.db
        .query("equipment")
        .withSearchIndex("search_equipment", (q) => 
          q.search("name", args.search!)
        )
        .collect();
    }

    let equipment;
    if (args.category) {
      equipment = await ctx.db
        .query("equipment")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .order("desc")
        .collect();
    } else {
      equipment = await ctx.db.query("equipment").order("desc").collect();
    }

    let filteredEquipment = equipment;

    if (args.lowStock) {
      filteredEquipment = equipment.filter(item => 
        item.minStock && item.quantity <= item.minStock
      );
    }

    if (args.supplier) {
      filteredEquipment = filteredEquipment.filter(item => 
        item.supplier === args.supplier
      );
    }

    return filteredEquipment;
  },
});

export const get = query({
  args: { id: v.id("equipment") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const equipment = await ctx.db.get(args.id);
    if (!equipment) return null;

    // Get photo URLs if they exist
    let photoUrl = null;
    let installationPhotoUrls: Array<{photoUrl: string, overlayData?: string}> = [];

    if (equipment.photoId) {
      photoUrl = await ctx.storage.getUrl(equipment.photoId);
    }

    if (equipment.installationPhotos) {
      installationPhotoUrls = await Promise.all(
        equipment.installationPhotos.map(async (photo) => ({
          photoUrl: await ctx.storage.getUrl(photo.photoId) || "",
          overlayData: photo.overlayData
        }))
      );
    }

    return {
      ...equipment,
      photoUrl,
      installationPhotoUrls,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.union(
      v.literal("split_ac"),
      v.literal("multi_split"),
      v.literal("vrf_system"),
      v.literal("heat_pump"),
      v.literal("thermostat"),
      v.literal("ductwork"),
      v.literal("filter"),
      v.literal("parts"),
      v.literal("tools"),
      v.literal("refrigerant")
    ),
    serialNumber: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    sellPrice: v.optional(v.number()),
    quantity: v.number(),
    minStock: v.optional(v.number()),
    supplier: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    specifications: v.optional(v.object({
      power: v.optional(v.string()),
      efficiency: v.optional(v.string()),
      warranty: v.optional(v.number()),
      dimensions: v.optional(v.string())
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const equipmentId = await ctx.db.insert("equipment", {
      ...args,
      createdBy: userId,
    });

    // Check if stock is low and create notification
    if (args.minStock && args.quantity <= args.minStock) {
      await ctx.db.insert("notifications", {
        userId,
        title: "Low Stock Alert",
        message: `${args.name} is running low (${args.quantity} remaining)`,
        type: "low_stock",
        priority: "medium",
        read: false,
        relatedId: equipmentId,
      });
    }

    return equipmentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("equipment"),
    name: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    sellPrice: v.optional(v.number()),
    quantity: v.optional(v.number()),
    minStock: v.optional(v.number()),
    supplier: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    specifications: v.optional(v.object({
      power: v.optional(v.string()),
      efficiency: v.optional(v.string()),
      warranty: v.optional(v.number()),
      dimensions: v.optional(v.string())
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const equipment = await ctx.db.get(id);
    
    if (!equipment) throw new Error("Equipment not found");

    await ctx.db.patch(id, updates);

    // Check for low stock after update
    if (updates.quantity !== undefined && equipment.minStock && updates.quantity <= equipment.minStock) {
      await ctx.db.insert("notifications", {
        userId,
        title: "Low Stock Alert",
        message: `${equipment.name} is running low (${updates.quantity} remaining)`,
        type: "low_stock",
        priority: "medium",
        read: false,
        relatedId: id,
      });
    }
  },
});

export const updateQuantity = mutation({
  args: {
    id: v.id("equipment"),
    quantity: v.number(),
    operation: v.union(v.literal("add"), v.literal("subtract"), v.literal("set")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const equipment = await ctx.db.get(args.id);
    if (!equipment) throw new Error("Equipment not found");

    let newQuantity: number;
    switch (args.operation) {
      case "add":
        newQuantity = equipment.quantity + args.quantity;
        break;
      case "subtract":
        newQuantity = Math.max(0, equipment.quantity - args.quantity);
        break;
      case "set":
        newQuantity = args.quantity;
        break;
    }

    await ctx.db.patch(args.id, { quantity: newQuantity });

    // Check for low stock
    if (equipment.minStock && newQuantity <= equipment.minStock) {
      await ctx.db.insert("notifications", {
        userId,
        title: "Low Stock Alert",
        message: `${equipment.name} is running low (${newQuantity} remaining)`,
        type: "low_stock",
        priority: "medium",
        read: false,
        relatedId: args.id,
      });
    }

    return newQuantity;
  },
});

export const addInstallationPhoto = mutation({
  args: {
    id: v.id("equipment"),
    photoId: v.id("_storage"),
    overlayData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const equipment = await ctx.db.get(args.id);
    if (!equipment) throw new Error("Equipment not found");

    const currentPhotos = equipment.installationPhotos || [];
    const newPhoto = {
      photoId: args.photoId,
      overlayData: args.overlayData,
    };

    await ctx.db.patch(args.id, {
      installationPhotos: [...currentPhotos, newPhoto],
    });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

export const getLowStockItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const equipment = await ctx.db.query("equipment").collect();
    
    return equipment.filter(item => 
      item.minStock && item.quantity <= item.minStock
    );
  },
});
