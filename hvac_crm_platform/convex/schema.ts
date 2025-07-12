import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Enhanced Contact and Lead Management
  contacts: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    district: v.optional(v.string()), // Warsaw districts
    zipCode: v.optional(v.string()),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number()
    })),
    type: v.union(v.literal("lead"), v.literal("customer"), v.literal("vip")),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("proposal_sent"),
      v.literal("negotiation"),
      v.literal("won"),
      v.literal("lost")
    ),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    createdBy: v.id("users"),
    // AI Features
    transcriptionData: v.optional(v.object({
      originalText: v.string(),
      extractedData: v.object({
        deviceCount: v.optional(v.number()),
        roomCount: v.optional(v.number()),
        budget: v.optional(v.number()),
        urgency: v.optional(v.string()),
        preferredDate: v.optional(v.string())
      })
    })),
    affluenceScore: v.optional(v.number()), // AI-calculated 1-10
    dataCompletionLink: v.optional(v.string()),
    lastContactDate: v.optional(v.number()),
    // RODO Compliance
    gdprConsent: v.boolean(),
    marketingConsent: v.boolean(),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_district", ["district"])
    .index("by_assigned", ["assignedTo"])
    .searchIndex("search_contacts", {
      searchField: "name",
      filterFields: ["type", "status", "district"]
    }),

  // HVAC Equipment Inventory with Photo Integration
  equipment: defineTable({
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
    // Photo Integration
    photoId: v.optional(v.id("_storage")),
    installationPhotos: v.optional(v.array(v.object({
      photoId: v.id("_storage"),
      overlayData: v.optional(v.string()) // JSON for overlay positions
    }))),
    specifications: v.optional(v.object({
      power: v.optional(v.string()),
      efficiency: v.optional(v.string()),
      warranty: v.optional(v.number()),
      dimensions: v.optional(v.string())
    })),
    createdBy: v.id("users"),
  })
    .index("by_category", ["category"])
    .index("by_quantity", ["quantity"])
    .index("by_supplier", ["supplier"])
    .searchIndex("search_equipment", {
      searchField: "name",
      filterFields: ["category", "brand"]
    }),

  // Enhanced Service Jobs with Route Optimization
  jobs: defineTable({
    title: v.string(),
    description: v.string(),
    contactId: v.id("contacts"),
    type: v.union(
      v.literal("installation"),
      v.literal("repair"),
      v.literal("maintenance"),
      v.literal("inspection"),
      v.literal("emergency"),
      v.literal("warranty")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    status: v.union(
      v.literal("lead"),
      v.literal("quoted"),
      v.literal("approved"),
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("invoiced"),
      v.literal("paid"),
      v.literal("cancelled")
    ),
    scheduledDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    assignedTechnicians: v.array(v.id("users")),
    equipmentUsed: v.optional(v.array(v.object({
      equipmentId: v.id("equipment"),
      quantity: v.number()
    }))),
    laborCost: v.optional(v.number()),
    materialCost: v.optional(v.number()),
    totalCost: v.optional(v.number()),
    totalAmount: v.optional(v.number()), // Added missing totalAmount field
    notes: v.optional(v.string()),
    // Location data for mapping
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
      accuracy: v.optional(v.number())
    })),
    coordinates: v.optional(v.object({ // Alternative coordinates field
      lat: v.number(),
      lng: v.number()
    })),
    // Route Optimization
    routeOrder: v.optional(v.number()),
    travelTime: v.optional(v.number()),
    // Service History
    lastServiceDate: v.optional(v.number()),
    nextServiceDue: v.optional(v.number()),
    serviceHistory: v.optional(v.array(v.object({
      date: v.number(),
      type: v.string(),
      notes: v.string(),
      technicianId: v.id("users")
    }))),
    // AI Integration
    aiQuoteData: v.optional(v.object({
      transcriptId: v.optional(v.id("transcriptions")),
      estimatedCost: v.optional(v.number()),
      confidence: v.optional(v.number())
    })),
    createdBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_contact", ["contactId"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_next_service", ["nextServiceDue"])
    .searchIndex("search_jobs", {
      searchField: "title",
      filterFields: ["status", "type", "priority"]
    }),

  // Invoices & Payments with Dynamic Pricing
  invoices: defineTable({
    invoiceNumber: v.string(),
    contactId: v.id("contacts"),
    jobId: v.id("jobs"),
    issueDate: v.number(),
    dueDate: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("canceled")
    ),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      taxRate: v.number(),
      equipmentId: v.optional(v.id("equipment"))
    })),
    subtotal: v.number(),
    totalTax: v.number(),
    totalAmount: v.number(),
    paymentHistory: v.array(v.object({
      date: v.number(),
      amount: v.number(),
      method: v.string()
    })),
    // Route Efficiency Pricing
    routeEfficiency: v.optional(v.number()),
    efficiencyDiscount: v.optional(v.number()),
    // GDPR Compliance
    dataHandling: v.object({
      storageLocation: v.string(),
      retentionPeriod: v.number()
    })
  })
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_contact", ["contactId"])
    .searchIndex("search_invoices", {
      searchField: "invoiceNumber",
      filterFields: ["status", "jobId"]
    }),

  // Enhanced Inventory Management
  inventory: defineTable({
    equipmentId: v.id("equipment"),
    warehouseId: v.id("warehouses"),
    quantity: v.number(),
    minStockLevel: v.number(),
    lastRestocked: v.number(),
    supplierId: v.id("suppliers"),
    autoReorder: v.boolean(),
    // District-based stock tracking
    district: v.string(),
    // Mobility Features
    lastUpdatedBy: v.id("users"),
    lastUpdatedVia: v.union(
      v.literal("web"),
      v.literal("mobile"),
      v.literal("api")
    )
  })
    .index("by_equipment", ["equipmentId"])
    .index("by_warehouse", ["warehouseId"])
    .index("by_district", ["district"])
    .searchIndex("search_inventory", {
      searchField: "equipmentId",
      filterFields: ["warehouseId", "district"]
    }),

  // Warehouse Management
  warehouses: defineTable({
    name: v.string(),
    address: v.string(),
    district: v.string(),
    coordinates: v.object({ lat: v.number(), lng: v.number() }),
    capacity: v.number(),
    currentStock: v.number(),
    managerId: v.id("users")
  })
    .index("by_district", ["district"])
    .searchIndex("search_warehouses", {
      searchField: "name",
      filterFields: ["district"]
    }),

  // Dynamic Quotes with AI Integration
  quotes: defineTable({
    quoteNumber: v.string(),
    contactId: v.id("contacts"),
    jobId: v.optional(v.id("jobs")),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("draft"), 
      v.literal("sent"), 
      v.literal("viewed"),
      v.literal("accepted"), 
      v.literal("rejected"),
      v.literal("expired")
    ),
    validUntil: v.number(),
    // Dynamic Proposals
    proposals: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.string(),
      lineItems: v.array(v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        total: v.number(),
        type: v.union(v.literal("labor"), v.literal("material"), v.literal("equipment"))
      })),
      subtotal: v.number(),
      tax: v.optional(v.number()),
      total: v.number(),
      recommended: v.boolean()
    })),
    // Dynamic Link Features
    dynamicLink: v.optional(v.string()),
    linkViews: v.optional(v.number()),
    clientInteractions: v.optional(v.array(v.object({
      timestamp: v.number(),
      action: v.string(), // viewed, downloaded, signed
      proposalId: v.optional(v.string())
    }))),
    // Virtual Signing
    digitalSignature: v.optional(v.object({
      signedAt: v.number(),
      signatureData: v.string(),
      ipAddress: v.string()
    })),
    // AI Features
    aiGenerated: v.optional(v.boolean()),
    transcriptionSource: v.optional(v.id("transcriptions")),
    terms: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_contact", ["contactId"])
    .index("by_quote_number", ["quoteNumber"]),

  // Supplier ERP Integration
  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    website: v.optional(v.string()),
    category: v.union(
      v.literal("equipment"),
      v.literal("parts"),
      v.literal("tools"),
      v.literal("materials"),
      v.literal("services")
    ),
    paymentTerms: v.optional(v.string()),
    deliveryTime: v.optional(v.number()),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    // Pricing Integration
    priceList: v.optional(v.array(v.object({
      equipmentId: v.id("equipment"),
      price: v.number(),
      lastUpdated: v.number(),
      minQuantity: v.optional(v.number())
    }))),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_category", ["category"])
    .index("by_rating", ["rating"])
    .searchIndex("search_suppliers", {
      searchField: "name",
      filterFields: ["category"]
    }),

  // AI Transcription Processing
  transcriptions: defineTable({
    originalText: v.string(),
    audioFileId: v.optional(v.id("_storage")),
    contactId: v.optional(v.id("contacts")),
    jobId: v.optional(v.id("jobs")),
    // Extracted Data
    extractedData: v.object({
      customerName: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      deviceType: v.optional(v.string()),
      deviceCount: v.optional(v.number()),
      roomCount: v.optional(v.number()),
      budget: v.optional(v.number()),
      urgency: v.optional(v.string()),
      preferredDate: v.optional(v.string()),
      additionalNotes: v.optional(v.string())
    }),
    confidence: v.number(), // AI confidence score
    processed: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_contact", ["contactId"])
    .index("by_processed", ["processed"]),

  // OCR Document Processing
  ocrDocuments: defineTable({
    fileName: v.string(),
    fileId: v.id("_storage"),
    documentType: v.union(
      v.literal("invoice"),
      v.literal("receipt"),
      v.literal("contract"),
      v.literal("bank_statement"),
      v.literal("other")
    ),
    // Extracted Data
    extractedData: v.object({
      amount: v.optional(v.number()),
      date: v.optional(v.string()),
      vendor: v.optional(v.string()),
      description: v.optional(v.string()),
      paymentStatus: v.optional(v.string())
    }),
    processed: v.boolean(),
    confidence: v.number(),
    relatedContactId: v.optional(v.id("contacts")),
    relatedJobId: v.optional(v.id("jobs")),
    createdBy: v.id("users"),
  })
    .index("by_type", ["documentType"])
    .index("by_processed", ["processed"]),

  // Map Integration for Installations
  installations: defineTable({
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
    lastServiceDate: v.optional(v.number()),
    nextServiceDue: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("needs_service"),
      v.literal("warranty_expired"),
      v.literal("removed")
    ),
    photos: v.optional(v.array(v.id("_storage"))),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_district", ["district"])
    .index("by_status", ["status"])
    .index("by_next_service", ["nextServiceDue"]),

  // Enhanced Team Chat with Real-Time Threading and Warsaw District Features
  messages: defineTable({
    content: v.string(),
    senderId: v.id("users"),
    channelId: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    contactId: v.optional(v.id("contacts")),
    type: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("image"),
      v.literal("system"),
      v.literal("telegram"),
      v.literal("voice_note"),
      v.literal("location"),
      v.literal("urgent_alert")
    ),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileMimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    // Threading Support
    replyTo: v.optional(v.id("messages")),
    threadId: v.optional(v.string()), // Groups related messages
    isThreadStarter: v.optional(v.boolean()),
    threadParticipants: v.optional(v.array(v.id("users"))),
    // Telegram Integration
    telegramMessageId: v.optional(v.string()),
    isFromTelegram: v.optional(v.boolean()),
    // Read Status with Delivery Tracking
    readBy: v.optional(v.array(v.object({
      userId: v.id("users"),
      readAt: v.number(),
      deliveredAt: v.optional(v.number())
    }))),
    // Warsaw District Context
    districtContext: v.optional(v.object({
      district: v.string(),
      urgencyLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("emergency")),
      routeOptimized: v.optional(v.boolean()),
      estimatedResponseTime: v.optional(v.number()) // minutes
    })),
    // Location Data for Field Messages
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
      address: v.optional(v.string())
    })),
    // Message Priority and Scheduling
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    scheduledFor: v.optional(v.number()), // Timestamp for scheduled messages
    expiresAt: v.optional(v.number()), // Auto-delete timestamp
    // Offline Support
    isOfflineMessage: v.optional(v.boolean()),
    syncStatus: v.optional(v.union(v.literal("pending"), v.literal("synced"), v.literal("failed"))),
    // Rich Content
    metadata: v.optional(v.object({
      mentions: v.optional(v.array(v.id("users"))),
      hashtags: v.optional(v.array(v.string())),
      links: v.optional(v.array(v.string())),
      quotedMessage: v.optional(v.id("messages")),
      duration: v.optional(v.number()) // Added missing duration field for voice notes
    })),
  })
    .index("by_channel", ["channelId"])
    .index("by_job", ["jobId"])
    .index("by_contact", ["contactId"])
    .index("by_sender", ["senderId"])
    .index("by_thread", ["threadId"])
    .index("by_priority", ["priority"])
    .index("by_district", ["districtContext.district"])
    .index("by_sync_status", ["syncStatus"])
    .searchIndex("search_messages", {
      searchField: "content",
      filterFields: ["type", "priority", "channelId"]
    }),

  // Conversation Channels for Organized Team Communication
  conversationChannels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("general"), // Company-wide discussions
      v.literal("technicians"), // Technician team chat
      v.literal("sales"), // Sales team chat
      v.literal("support"), // Customer support
      v.literal("emergency"), // Emergency communications
      v.literal("district"), // District-specific channels
      v.literal("project"), // Project/job-specific
      v.literal("direct") // Direct messages between users
    ),
    // Warsaw District Specific
    district: v.optional(v.string()), // For district-type channels
    // Access Control
    isPrivate: v.boolean(),
    participants: v.array(v.id("users")),
    admins: v.array(v.id("users")),
    // Channel Settings
    allowFileSharing: v.boolean(),
    allowVoiceNotes: v.boolean(),
    autoDeleteAfter: v.optional(v.number()), // Hours
    notificationLevel: v.union(v.literal("all"), v.literal("mentions"), v.literal("none")),
    // Integration
    linkedJobId: v.optional(v.id("jobs")),
    linkedContactId: v.optional(v.id("contacts")),
    // Channel Statistics
    messageCount: v.optional(v.number()),
    lastActivity: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_type", ["type"])
    .index("by_district", ["district"])
    .index("by_participant", ["participants"])
    .index("by_linked_job", ["linkedJobId"])
    .searchIndex("search_channels", {
      searchField: "name",
      filterFields: ["type", "district"]
    }),

  // Enhanced Notifications System with AI-Driven Features
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("job_assigned"),
      v.literal("job_completed"),
      v.literal("quote_accepted"),
      v.literal("quote_viewed"),
      v.literal("maintenance_due"),
      v.literal("low_stock"),
      v.literal("inventory_alert"), // Added missing inventory_alert type
      v.literal("payment_due"),
      v.literal("payment_received"),
      v.literal("message"),
      v.literal("urgent_message"),
      v.literal("mention"),
      v.literal("thread_reply"),
      v.literal("channel_invite"),
      v.literal("district_alert"),
      v.literal("route_update"),
      v.literal("emergency"),
      v.literal("system")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    read: v.boolean(),
    relatedId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    // Multi-Channel Delivery
    pushSent: v.optional(v.boolean()),
    emailSent: v.optional(v.boolean()),
    smsSent: v.optional(v.boolean()),
    telegramSent: v.optional(v.boolean()),
    // Warsaw District Context
    districtContext: v.optional(v.object({
      district: v.string(),
      affluenceLevel: v.optional(v.number()), // 1-10 scale
      priorityMultiplier: v.optional(v.number()) // Based on affluence
    })),
    // AI-Driven Features
    aiGenerated: v.optional(v.boolean()),
    personalizedContent: v.optional(v.string()), // AI-customized message
    predictedImportance: v.optional(v.number()), // 0-1 AI confidence score
    // Scheduling and Batching
    scheduledFor: v.optional(v.number()),
    batchId: v.optional(v.string()), // Group related notifications
    // Delivery Tracking
    deliveryAttempts: v.optional(v.number()),
    lastAttemptAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    // User Interaction
    clickedAt: v.optional(v.number()),
    dismissedAt: v.optional(v.number()),
    // GPS Integration
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      relevantRadius: v.optional(v.number()) // meters
    })),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["read"])
    .index("by_type", ["type"])
    .index("by_priority", ["priority"])
    .index("by_district", ["districtContext.district"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_batch", ["batchId"]),

  // Document Management with Versioning
  documents: defineTable({
    name: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number(),
    mimeType: v.string(),
    category: v.union(
      v.literal("contract"),
      v.literal("invoice"),
      v.literal("manual"),
      v.literal("photo"),
      v.literal("report"),
      v.literal("certificate"),
      v.literal("other")
    ),
    contactId: v.optional(v.id("contacts")),
    jobId: v.optional(v.id("jobs")),
    uploadedBy: v.id("users"),
    tags: v.optional(v.array(v.string())),
    // Versioning
    version: v.number(),
    parentDocumentId: v.optional(v.id("documents")),
    // Access Control
    accessLevel: v.union(v.literal("public"), v.literal("team"), v.literal("private")),
    sharedWith: v.optional(v.array(v.id("users"))),
  })
    .index("by_category", ["category"])
    .index("by_contact", ["contactId"])
    .index("by_job", ["jobId"])
    .index("by_version", ["version"])
    .searchIndex("search_documents", {
      searchField: "name",
      filterFields: ["category"]
    }),

  // Enhanced User Profiles with Technician Features
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("technician"),
      v.literal("sales"),
      v.literal("freelancer")
    ),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    // Technician Specific
    specialties: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())), // Added missing skills field
    vehicleType: v.optional(v.string()), // Added missing vehicleType field
    hourlyRate: v.optional(v.number()),
    availability: v.optional(v.object({
      monday: v.array(v.string()),
      tuesday: v.array(v.string()),
      wednesday: v.array(v.string()),
      thursday: v.array(v.string()),
      friday: v.array(v.string()),
      saturday: v.array(v.string()),
      sunday: v.array(v.string())
    })),
    // Location for Route Optimization
    homeLocation: v.optional(v.object({
      lat: v.number(),
      lng: v.number()
    })),
    serviceAreas: v.optional(v.array(v.string())), // Warsaw districts
    // Integration Settings
    telegramUserId: v.optional(v.string()),
    notificationPreferences: v.optional(v.object({
      email: v.boolean(),
      sms: v.boolean(),
      push: v.boolean(),
      telegram: v.boolean()
    })),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),

  // AI Analysis Results
  aiAnalysis: defineTable({
    type: v.union(
      v.literal("affluence_score"),
      v.literal("email_classification"),
      v.literal("quote_optimization"),
      v.literal("route_optimization")
    ),
    relatedId: v.string(), // ID of related entity
    analysisData: v.object({
      score: v.optional(v.number()),
      confidence: v.optional(v.number()),
      recommendations: v.optional(v.array(v.string())),
      metadata: v.optional(v.string()) // JSON string
    }),
    processed: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_type", ["type"])
    .index("by_related", ["relatedId"]),

  // Integration Logs
  integrationLogs: defineTable({
    service: v.union(
      v.literal("telegram"),
      v.literal("sms"),
      v.literal("email"),
      v.literal("push"), // Added missing push service
      v.literal("ai_transcription"),
      v.literal("ocr"),
      v.literal("maps"),
      v.literal("workflows") // Added missing workflows service
    ),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("pending")),
    data: v.optional(v.string()), // JSON string
    errorMessage: v.optional(v.string()),
    relatedId: v.optional(v.string()),
  })
    .index("by_service", ["service"])
    .index("by_status", ["status"]),

  // Optimized Routes for Technicians
  optimizedRoutes: defineTable({
    technicianId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    points: v.array(v.object({
      id: v.string(),
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
      district: v.string(),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
      estimatedDuration: v.number(),
      jobType: v.union(
        v.literal("installation"),
        v.literal("repair"),
        v.literal("maintenance"),
        v.literal("inspection"),
        v.literal("emergency")
      )
    })),
    totalDistance: v.number(), // km
    totalDuration: v.number(), // minutes
    efficiency: v.number(), // 0-1 score
    estimatedCost: v.number(), // PLN
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_technician", ["technicianId"])
    .index("by_status", ["status"]),

  // Workflow Automation Engine
  workflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    triggerEvent: v.union(
      v.literal("JOB_STATUS_CHANGE"),
      v.literal("CONTACT_CREATED"),
      v.literal("INVOICE_GENERATED"),
      v.literal("EQUIPMENT_LOW_STOCK"),
      v.literal("SCHEDULED_TIME")
    ),
    triggerCondition: v.object({
      entityType: v.union(v.literal("job"), v.literal("contact"), v.literal("invoice")),
      conditions: v.array(v.object({
        field: v.string(),
        operator: v.union(
          v.literal("eq"), v.literal("neq"),
          v.literal("gt"), v.literal("lt"),
          v.literal("contains")
        ),
        value: v.any()
      }))
    }),
    actions: v.array(v.object({
      type: v.union(
        v.literal("SEND_NOTIFICATION"),
        v.literal("UPDATE_RECORD"),
        v.literal("CREATE_TASK"),
        v.literal("ASSIGN_TECHNICIAN"), // Added missing action type
        v.literal("UPDATE_STATUS"), // Added missing action type
        v.literal("TRIGGER_ROUTE_OPTIMIZATION"), // Added missing action type
        v.literal("TRIGGER_WEBHOOK"),
        v.literal("GENERATE_INVOICE")
      ),
      config: v.object({
        target: v.string(),
        template: v.optional(v.string()),
        channel: v.union(
          v.literal("email"),
          v.literal("sms"),
          v.literal("push"),
          v.literal("telegram")
        ),
        timeout: v.optional(v.number())
      })
    })),
    scheduling: v.optional(v.object({
      cronExpression: v.string(),
      timezone: v.string(),
      startDate: v.number(),
      endDate: v.optional(v.number())
    })),
    status: v.union(v.literal("active"), v.literal("disabled")),
    lastTriggered: v.optional(v.number()),
    metrics: v.object({
      executions: v.number(),
      successes: v.number(),
      failures: v.number(),
      lastError: v.optional(v.string())
    }),
    relatedIds: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
  })
    .index("by_trigger_event", ["triggerEvent"])
    .index("by_status", ["status"])
    .index("by_related_ids", ["relatedIds"])
    .searchIndex("search_workflows", {
      searchField: "name",
      filterFields: ["triggerEvent", "status"]
    }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
