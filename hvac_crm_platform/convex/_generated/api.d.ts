/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as advancedAnalytics from "../advancedAnalytics.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as auditService from "../auditService.js";
import type * as auth from "../auth.js";
import type * as clientPortal from "../clientPortal.js";
import type * as contacts from "../contacts.js";
import type * as contracts from "../contracts.js";
import type * as conversationChannels from "../conversationChannels.js";
import type * as customerPortal from "../customerPortal.js";
import type * as equipment from "../equipment.js";
import type * as equipmentLifecycle from "../equipmentLifecycle.js";
import type * as http from "../http.js";
import type * as installations from "../installations.js";
import type * as integrationService from "../integrationService.js";
import type * as inventory from "../inventory.js";
import type * as invoices from "../invoices.js";
import type * as jobs from "../jobs.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as ocrProcessing from "../ocrProcessing.js";
import type * as performanceOptimization from "../performanceOptimization.js";
import type * as polishVAT from "../polishVAT.js";
import type * as quotes from "../quotes.js";
import type * as realTimeFeatures from "../realTimeFeatures.js";
import type * as reports from "../reports.js";
import type * as router from "../router.js";
import type * as routes from "../routes.js";
import type * as serviceAgreements from "../serviceAgreements.js";
import type * as smartContractGeneration from "../smartContractGeneration.js";
import type * as transcriptions from "../transcriptions.js";
import type * as users from "../users.js";
import type * as weaviateOptimization from "../weaviateOptimization.js";
import type * as workflows from "../workflows.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  advancedAnalytics: typeof advancedAnalytics;
  ai: typeof ai;
  analytics: typeof analytics;
  auditService: typeof auditService;
  auth: typeof auth;
  clientPortal: typeof clientPortal;
  contacts: typeof contacts;
  contracts: typeof contracts;
  conversationChannels: typeof conversationChannels;
  customerPortal: typeof customerPortal;
  equipment: typeof equipment;
  equipmentLifecycle: typeof equipmentLifecycle;
  http: typeof http;
  installations: typeof installations;
  integrationService: typeof integrationService;
  inventory: typeof inventory;
  invoices: typeof invoices;
  jobs: typeof jobs;
  messages: typeof messages;
  notifications: typeof notifications;
  ocrProcessing: typeof ocrProcessing;
  performanceOptimization: typeof performanceOptimization;
  polishVAT: typeof polishVAT;
  quotes: typeof quotes;
  realTimeFeatures: typeof realTimeFeatures;
  reports: typeof reports;
  router: typeof router;
  routes: typeof routes;
  serviceAgreements: typeof serviceAgreements;
  smartContractGeneration: typeof smartContractGeneration;
  transcriptions: typeof transcriptions;
  users: typeof users;
  weaviateOptimization: typeof weaviateOptimization;
  workflows: typeof workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
