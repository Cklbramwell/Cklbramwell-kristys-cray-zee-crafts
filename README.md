# Kristy's Cray-Zee Crafts V7.1

React + Firebase + Netlify + Stripe.

## V7.1 Highlights
- Professional product detail pages
- Dedicated builders by product family
- Product templates / ordering purposes
- Structured customization data
- Live pricing for apparel, drinkware and laser
- Server-side price enforcement before Stripe
- Related products and product review presentation

## Builder structure
- `src/components/builders/ApparelBuilder.jsx`
- `src/components/builders/DrinkwareBuilder.jsx`
- `src/components/builders/LaserBuilder.jsx`
- `src/components/builders/MarketingBuilder.jsx`
- `src/components/ProductBuilder.jsx` routes products to the correct builder.

## Pricing
- `src/config/pricing.js`
- `netlify/functions/create-checkout.mjs`

The browser and server each calculate the allowed price independently.

## Product images
Admin currently supports one `imageUrl`.
Product pages also recognize optional Firestore fields:
- `imageUrl2`
- `imageUrl3`

These can be added later to Admin without affecting checkout.
