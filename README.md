# ShareSpike - Viral Sales Through Social Sharing

ShareSpike is a Shopify app that automatically applies discounts when customers share products on Instagram, driving viral sales and social engagement for Shopify stores.

## Overview

ShareSpike incentivizes social sharing by offering automatic discounts when customers share products on Instagram. This creates a viral loop where:
1. Customers share products to get discounts
2. Their followers see the shared products
3. More customers share to get discounts
4. Sales increase through viral growth

## Features

### Core Features
- [x] Product Management
  - [x] View all store products
  - [x] Product details display
  - [x] Product status tracking

- [ ] Discount System
  - [ ] Automatic discount generation
  - [ ] Customizable discount percentages
  - [ ] Unique discount code creation
  - [ ] Discount code delivery system

- [ ] Instagram Integration
  - [ ] Instagram share verification
  - [ ] Product link validation
  - [ ] Store mention detection
  - [ ] Instagram Graph API integration

- [ ] Analytics Dashboard
  - [ ] Share tracking
  - [ ] Discount usage statistics
  - [ ] Sales impact analysis
  - [ ] Viral coefficient calculation

### Merchant Dashboard
- [x] Shopify Admin Integration
  - [x] Embedded app interface
  - [x] Polaris UI components
  - [x] Responsive design

- [ ] Settings Management
  - [ ] Discount configuration
  - [ ] Product selection
  - [ ] Instagram account connection
  - [ ] Email notification settings

## Technical Stack

- **Frontend**: React with Next.js App Router
- **UI Components**: Shopify Polaris
- **Styling**: Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: Supabase
- **APIs**: 
  - Shopify Admin API
  - Instagram Graph API

## Development Status

Currently in active development. The basic product management interface is implemented, with core features being added incrementally.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Required environment variables:
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SCOPES`
- `HOST`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
