# TASK.md

## Purpose
This file tracks active development tasks, backlog items, and milestones for "ShareSpike." It ensures Cursor AI follows a clear roadmap and can be updated dynamically during development.

## Current Tasks
- [x] **Set Up Development Environment**
  - Create a Shopify Partner account ([Shopify Partners](https://partners.shopify.com)).
  - Set up a Facebook Developer account for Instagram API ([Facebook Developers](https://developers.facebook.com)).
  - Install Node.js, npm
- [x] **Initialize Project**
  - Clone Shopify's Node.js app template ([GitHub](https://github.com/Shopify/shopify-app-template-node)).
  - Run `npm install` to set up dependencies.
- [x] **Create GitHub Repository**
  - Initialize Git repository
  - Push code to GitHub under "ShareSpike" name
  - Create comprehensive README.md
- [x] **Create Products Page**
  - Implement a Polaris DataTable to display store products
  - Add to Shopify admin navigation
  - Fetch products using GraphQL API
- [ ] **Implement Shopify Authentication**
  - Configure OAuth with the Shopify API library ([Authentication Docs](https://shopify.dev/docs/apps/auth/oauth)).
  - Test authentication in a Shopify development store.
- [x] **Set Up Supabase**
  - Create a Supabase project and retrieve API keys.
  - Integrate Supabase client in the backend for database operations.
  - Create database schema for app settings, share verifications, and discount codes.
- [x] **Build Merchant Dashboard - Settings**
  - Create settings page with discount configuration
  - Implement Supabase integration for storing preferences
  - Add to Shopify admin navigation
- [x] **Integrate Shopify Admin API**
  - Fetch products and allow merchants to select eligible ones.
  - Create discount codes for verified shares.
  - Build discount testing page for manual code generation.
- [ ] **Implement Instagram Share Verification**
  - Configure Instagram Graph API to fetch mentions.
  - Verify shares by checking for store mentions or product links.

## Backlog
- [ ] **Add Analytics**
  - Track shares, discounts issued, and sales generated.
  - Display data in the merchant dashboard.
- [ ] **Implement Customer Share Submission**
  - Build a frontend form for customers to submit share URLs.
  - Verify submissions and display discount codes.
- [ ] **Optimize Performance**
  - Add caching for API responses (e.g., Redis or in-memory).
  - Ensure dashboard loads in under 2 seconds.
- [ ] **Test and Debug**
  - Set up a Shopify development store for end-to-end testing.
  - Simulate Instagram shares and verify discount logic.
- [ ] **Prepare for Launch**
  - Write app documentation and take screenshots for Shopify App Store.
  - Submit the app for review.

## Milestones
1. **Milestone 1: Basic Setup** *(Completed)*
   - Complete: Development environment, project initialization, GitHub repository, products page display, Supabase setup, Settings page.
   - Pending: Shopify authentication.
2. **Milestone 2: Core Integrations** *(In Progress)*
   - Complete: Shopify Admin API integration, discount code generation
   - Pending: Instagram share verification.
3. **Milestone 3: Full Features**
   - Complete: 
   - Pending: Analytics, customer share submission.
4. **Milestone 4: Launch Ready**
   - Complete: 
   - Pending: Testing, optimization, and app store submission.

## Guidelines for Cursor AI
- Reference this file for task updates: "Update TASK.md to mark XYZ as done and add ABC as a new task."
- Automatically update tasks as progress is made (e.g., mark tasks done, shift backlog items to current).
- Add discoveries or sub-tasks mid-process as they arise.