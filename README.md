# Kristy's Cray-Zee Crafts V6

Modular React/Vite storefront.

## Structure

- `src/App.jsx` — app state, Firebase listeners, routing
- `src/components/ProductBuilder.jsx` — guided product builder
- `src/components/ProductCard.jsx` — product card
- `src/components/CartView.jsx` — configured cart
- `src/components/OrderDetails.jsx` — customer/admin order details
- `src/pages/*` — storefront and dashboard pages
- `src/config/pricing.js` — editable starter pricing
- `netlify/functions/*` — Stripe/Firebase server functions

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Keep your existing environment variables.
