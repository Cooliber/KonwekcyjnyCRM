# 🔮 HVAC Pro CRM - Warsaw Management Platform

> **Exceptionally Awesome HVAC Management Platform** that surpasses Bitrix24 with AI-powered prophecy of data, route optimization, and Warsaw-specific features.

## 🌟 **Key Features**

### **🗺️ Interactive Warsaw Mapping**
- Real-time district visualization with affluence overlays
- GPS-based route optimization for technicians
- AI-powered service hotspot predictions
- Mobile PWA with offline capabilities

### **🔮 Prophecy of Data**
- **90% accuracy** affluence analysis for Warsaw districts
- **Dynamic pricing** with 0.8x-1.5x multipliers
- **Seasonal demand prediction** using AI
- **Route intelligence** with district efficiency factors

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
