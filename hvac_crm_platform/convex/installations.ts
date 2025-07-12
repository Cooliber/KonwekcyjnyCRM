import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    district: v.optional(v.string()),
    status: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let installations;
    
    if (args.district) {
      installations = await ctx.db
        .query("installations")
        .withIndex("by_district", (q) => q.eq("district", args.district!))
        .collect();
    } else if (args.status) {
      installations = await ctx.db
        .query("installations")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else {
      installations = await ctx.db.query("installations").collect();
    }

    // Filter by contact if specified
    if (args.contactId) {
      installations = installations.filter(installation => 
        installation.contactId === args.contactId
      );
    }

    // Add contact and job information
    return await Promise.all(
      installations.map(async (installation) => {
        const contact = await ctx.db.get(installation.contactId);
        const job = await ctx.db.get(installation.jobId);
        const equipment = await ctx.db.get(installation.equipmentId);
        
        return {
          ...installation,
          contact,
          job,
          equipment,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("installations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const installation = await ctx.db.get(args.id);
    if (!installation) return null;

    // Get related data
    const contact = await ctx.db.get(installation.contactId);
    const job = await ctx.db.get(installation.jobId);
    const equipment = await ctx.db.get(installation.equipmentId);

    // Get photos if they exist
    let photoUrls: string[] = [];
    if (installation.photos) {
      photoUrls = await Promise.all(
        installation.photos.map(async (photoId) => {
          const url = await ctx.storage.getUrl(photoId);
          return url || "";
        })
      );
    }

    return {
      ...installation,
      contact,
      job,
      equipment,
      photoUrls,
    };
  },
});

export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    jobId: v.id("jobs"),
    equipmentId: v.id("equipment"),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number()
    }),
    address: v.string(),
    district: v.string(),
    installationDate: v.number(),
    warrantyExpiry: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Calculate next service date (typically 1 year after installation)
    const nextServiceDue = new Date(args.installationDate);
    nextServiceDue.setFullYear(nextServiceDue.getFullYear() + 1);

    const installationId = await ctx.db.insert("installations", {
      ...args,
      status: "active",
      nextServiceDue: nextServiceDue.getTime(),
      createdBy: userId,
    });

    // Create a notification for the installation
    await ctx.db.insert("notifications", {
      userId,
      title: "New Installation Recorded",
      message: `Installation completed at ${args.address}`,
      type: "system",
      priority: "medium",
      read: false,
      relatedId: installationId,
    });

    return installationId;
  },
});

export const update = mutation({
  args: {
    id: v.id("installations"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("needs_service"),
      v.literal("warranty_expired"),
      v.literal("removed")
    )),
    lastServiceDate: v.optional(v.number()),
    nextServiceDue: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);

    // If status changed to needs_service, create notification
    if (updates.status === "needs_service") {
      const installation = await ctx.db.get(id);
      if (installation) {
        await ctx.db.insert("notifications", {
          userId,
          title: "Service Required",
          message: `Installation at ${installation.address} needs service`,
          type: "maintenance_due",
          priority: "medium",
          read: false,
          relatedId: id,
        });
      }
    }
  },
});

export const addPhoto = mutation({
  args: {
    id: v.id("installations"),
    photoId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const installation = await ctx.db.get(args.id);
    if (!installation) throw new Error("Installation not found");

    const currentPhotos = installation.photos || [];
    await ctx.db.patch(args.id, {
      photos: [...currentPhotos, args.photoId],
    });
  },
});

export const getByDistrict = query({
  args: { district: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("installations")
      .withIndex("by_district", (q) => q.eq("district", args.district))
      .collect();
  },
});

export const getServiceDue = query({
  args: {
    beforeDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const beforeDate = args.beforeDate || Date.now();
    
    const installations = await ctx.db
      .query("installations")
      .withIndex("by_next_service")
      .filter((q) => q.lte(q.field("nextServiceDue"), beforeDate))
      .collect();

    // Add contact information
    return await Promise.all(
      installations.map(async (installation) => {
        const contact = await ctx.db.get(installation.contactId);
        return { ...installation, contact };
      })
    );
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

export const getDistrictStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const installations = await ctx.db.query("installations").collect();
    
    // Group by district
    const districtStats: Record<string, any> = {};
    
    installations.forEach(installation => {
      const district = installation.district;
      if (!districtStats[district]) {
        districtStats[district] = {
          total: 0,
          active: 0,
          needsService: 0,
          warrantyExpired: 0,
          removed: 0,
        };
      }
      
      districtStats[district].total++;
      districtStats[district][installation.status.replace('_', '')]++;
    });

    return districtStats;
  },
});
