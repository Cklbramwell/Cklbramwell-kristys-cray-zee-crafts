# Kristy's Cray-Zee Crafts V7.0

Professional React + Firebase + Netlify + Stripe storefront.

## Key files
- `src/App.jsx` — application state and navigation
- `src/pages/Home.jsx` — professional homepage
- `src/pages/Shop.jsx` — category shop
- `src/pages/Inspiration.jsx` — Design Inspiration
- `src/components/ProductBuilder.jsx` — guided builder
- `src/config/storefront.js` — categories, inspirations, testimonials
- `src/config/pricing.js` — pricing configuration
- `netlify/functions/create-checkout.mjs` — server-side Stripe pricing/checkout
- `netlify/functions/stripe-webhook.mjs` — paid order fulfillment

## Deployment
Netlify build: `npm run build`
Publish: `dist`
Functions: `netlify/functions`

Keep your current Netlify environment variables.
