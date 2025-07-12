import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// List conversation channels for the current user
export const list = query({
  args: {
    type: v.optional(v.union(
      v.literal("general"),
      v.literal("technicians"),
      v.literal("sales"),
      v.literal("support"),
      v.literal("emergency"),
      v.literal("district"),
      v.literal("project"),
      v.literal("direct")
    )),
    district: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db.query("conversationChannels");

    // Filter by type if specified
    if (args.type) {
      query = ctx.db.query("conversationChannels").filter((q) => q.eq(q.field("type"), args.type!));
    }

    // Filter by district if specified
    if (args.district) {
      query = ctx.db.query("conversationChannels").filter((q) => q.eq(q.field("district"), args.district));
    }

    const allChannels = await query.collect();

    // Filter channels where user is a participant
    const userChannels = allChannels.filter(channel => 
      channel.participants.includes(userId) || !channel.isPrivate
    );

    // Get enhanced channel info
    const channelsWithInfo = await Promise.all(
      userChannels.map(async (channel) => {
        // Get recent message count
        const recentMessages = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channel.name))
          .order("desc")
          .take(1);

        // Get unread count for user
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channel.name))
          .filter((q) =>
            q.not(
              q.or(
                q.eq(q.field("senderId"), userId),
                q.eq(q.field("readBy"), [{ userId, readAt: 0, deliveredAt: 0 }])
              )
            )
          )
          .collect();

        // Get online participants (simplified - would need real presence tracking)
        const onlineParticipants = channel.participants.length; // Placeholder

        return {
          ...channel,
          lastMessage: recentMessages[0] || null,
          unreadCount: unreadMessages.length,
          onlineParticipants,
          isUserAdmin: channel.admins.includes(userId),
          canPost: channel.participants.includes(userId) || !channel.isPrivate
        };
      })
    );

    return channelsWithInfo.sort((a, b) => 
      (b.lastActivity || 0) - (a.lastActivity || 0)
    );
  },
});

// Create a new conversation channel
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("general"),
      v.literal("technicians"),
      v.literal("sales"),
      v.literal("support"),
      v.literal("emergency"),
      v.literal("district"),
      v.literal("project"),
      v.literal("direct")
    ),
    district: v.optional(v.string()),
    isPrivate: v.boolean(),
    participants: v.array(v.id("users")),
    allowFileSharing: v.optional(v.boolean()),
    allowVoiceNotes: v.optional(v.boolean()),
    autoDeleteAfter: v.optional(v.number()),
    linkedJobId: v.optional(v.id("jobs")),
    linkedContactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has permission to create channels
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile || !["admin", "manager"].includes(userProfile.role)) {
      throw new Error("Insufficient permissions to create channels");
    }

    // Ensure creator is in participants
    const participants = args.participants.includes(userId) 
      ? args.participants 
      : [...args.participants, userId];

    const channelId = await ctx.db.insert("conversationChannels", {
      name: args.name,
      description: args.description,
      type: args.type,
      district: args.district,
      isPrivate: args.isPrivate,
      participants,
      admins: [userId], // Creator is admin
      allowFileSharing: args.allowFileSharing ?? true,
      allowVoiceNotes: args.allowVoiceNotes ?? true,
      autoDeleteAfter: args.autoDeleteAfter,
      notificationLevel: "all",
      linkedJobId: args.linkedJobId,
      linkedContactId: args.linkedContactId,
      messageCount: 0,
      lastActivity: Date.now(),
      createdBy: userId,
    });

    // Send welcome message
    await ctx.db.insert("messages", {
      content: `Welcome to ${args.name}! ${args.description || ""}`,
      senderId: userId,
      channelId: args.name,
      type: "system",
      priority: "normal",
      readBy: [{
        userId,
        readAt: Date.now(),
        deliveredAt: Date.now()
      }],
    });

    // Notify participants about new channel
    await Promise.all(
      participants
        .filter(participantId => participantId !== userId)
        .map(participantId =>
          ctx.db.insert("notifications", {
            userId: participantId,
            title: "Added to Channel",
            message: `You've been added to ${args.name}`,
            type: "channel_invite",
            priority: "medium",
            read: false,
            relatedId: channelId,
            actionUrl: `/chat/${args.name}`
          })
        )
    );

    return channelId;
  },
});

// Join a channel
export const join = mutation({
  args: {
    channelId: v.id("conversationChannels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    if (channel.isPrivate) {
      throw new Error("Cannot join private channel without invitation");
    }

    if (channel.participants.includes(userId)) {
      throw new Error("Already a member of this channel");
    }

    await ctx.db.patch(args.channelId, {
      participants: [...channel.participants, userId],
      lastActivity: Date.now()
    });

    // Send join message
    await ctx.db.insert("messages", {
      content: `joined the channel`,
      senderId: userId,
      channelId: channel.name,
      type: "system",
      priority: "normal",
      readBy: [{
        userId,
        readAt: Date.now(),
        deliveredAt: Date.now()
      }],
    });

    return true;
  },
});

// Leave a channel
export const leave = mutation({
  args: {
    channelId: v.id("conversationChannels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    if (!channel.participants.includes(userId)) {
      throw new Error("Not a member of this channel");
    }

    const newParticipants = channel.participants.filter(id => id !== userId);
    const newAdmins = channel.admins.filter(id => id !== userId);

    await ctx.db.patch(args.channelId, {
      participants: newParticipants,
      admins: newAdmins,
      lastActivity: Date.now()
    });

    // Send leave message
    await ctx.db.insert("messages", {
      content: `left the channel`,
      senderId: userId,
      channelId: channel.name,
      type: "system",
      priority: "normal",
      readBy: [{
        userId,
        readAt: Date.now(),
        deliveredAt: Date.now()
      }],
    });

    return true;
  },
});

// Get Warsaw district channels
export const getDistrictChannels = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const districtChannels = await ctx.db
      .query("conversationChannels")
      .withIndex("by_type", (q) => q.eq("type", "district"))
      .collect();

    // Warsaw districts with their characteristics
    const warsawDistricts = [
      { name: "Śródmieście", affluence: 9, urgencyMultiplier: 1.5 },
      { name: "Wilanów", affluence: 8, urgencyMultiplier: 1.4 },
      { name: "Mokotów", affluence: 7, urgencyMultiplier: 1.3 },
      { name: "Żoliborz", affluence: 7, urgencyMultiplier: 1.2 },
      { name: "Ursynów", affluence: 6, urgencyMultiplier: 1.1 },
      { name: "Wola", affluence: 6, urgencyMultiplier: 1.0 },
      { name: "Praga-Południe", affluence: 4, urgencyMultiplier: 0.9 },
      { name: "Targówek", affluence: 4, urgencyMultiplier: 0.8 },
    ];

    return warsawDistricts.map(district => {
      const channel = districtChannels.find(ch => ch.district === district.name);
      return {
        ...district,
        hasChannel: !!channel,
        channelId: channel?._id,
        isParticipant: channel?.participants.includes(userId) || false
      };
    });
  },
});

// Auto-create district channels for Warsaw
export const createDistrictChannels = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check admin permissions
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile || userProfile.role !== "admin") {
      throw new Error("Admin permissions required");
    }

    const warsawDistricts = [
      "Śródmieście", "Wilanów", "Mokotów", "Żoliborz", 
      "Ursynów", "Wola", "Praga-Południe", "Targówek"
    ];

    const createdChannels = [];

    for (const district of warsawDistricts) {
      // Check if channel already exists
      const existingChannel = await ctx.db
        .query("conversationChannels")
        .filter((q) => 
          q.and(
            q.eq(q.field("type"), "district"),
            q.eq(q.field("district"), district)
          )
        )
        .first();

      if (!existingChannel) {
        // Get technicians for this district
        const districtTechnicians = await ctx.db
          .query("userProfiles")
          .filter((q) =>
            q.and(
              q.eq(q.field("role"), "technician"),
              q.eq(q.field("serviceAreas"), [district])
            )
          )
          .collect();

        const participants = [userId, ...districtTechnicians.map(t => t.userId)];

        const channelId = await ctx.db.insert("conversationChannels", {
          name: `district-${district.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Communication channel for ${district} district technicians`,
          type: "district",
          district,
          isPrivate: false,
          participants,
          admins: [userId],
          allowFileSharing: true,
          allowVoiceNotes: true,
          notificationLevel: "all",
          messageCount: 0,
          lastActivity: Date.now(),
          createdBy: userId,
        });

        createdChannels.push({ district, channelId });
      }
    }

    return createdChannels;
  },
});
