# V7.2.2 — Explicit Tumbler / Laser Builder Fix

This release removes dependence on category-name guessing.

## New
- Explicit `builderFamily` field for products in Admin
- Product Builder dropdown in Admin:
  - Auto Detect
  - Apparel
  - Drinkware / Tumblers
  - Laser Engraving
  - Promotional Products
- Tumbler products force the Drinkware Builder
- Laser / engraving products force the Laser Builder
- Shop category filters use explicit builder family
- Product page shows a temporary `Builder: drinkware` / `Builder: laser` badge so you can verify the correct builder before customizing

## What to do after deploy
Go to Admin → Products.

For your tumbler product:
- Edit
- Product Builder → Drinkware / Tumblers
- Save Product

For your engraving product:
- Edit
- Product Builder → Laser Engraving
- Save Product

Then open each product from Shop and confirm the product page badge says:
- Builder: drinkware
or
- Builder: laser

Click Customize This Product. The dedicated dropdowns will appear.
