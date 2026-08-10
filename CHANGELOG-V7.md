# Kristy's Cray-Zee Crafts

## V7.9.0 — Foundation Update

### Purpose
Prepare the existing application for V8 Interactive Design Studio without changing
the current customer workflow.

### New Design Editor Infrastructure
- Editor product modes
- Apparel surfaces:
  - Front
  - Back
  - Left Sleeve
  - Right Sleeve
- Drinkware full-wrap surface
- Laser engraving surface
- Reusable editor shell
- Reusable surface tabs
- Text-element state helpers
- Image-element state helpers
- Position / scaling model
- Order-design persistence service
- Reusable normalized coordinate utilities

### Performance / Architecture
- Added route-level lazy loading for larger pages
- Added reusable LazyPage loading boundary
- Added Firebase vendor chunk configuration where supported
- Editor code isolated under `src/editor/`

### V8 Prepared For
- Drag-and-drop artwork
- Editable text
- Font selection
- Color selection
- Resize / rotate
- Front / back / sleeve design surfaces
- Tumbler wrap editor
- Laser engraving layout editor
- Design persistence
- Production export

### Existing Features Preserved
- Storefront
- Product builders
- Stripe checkout
- Firestore orders
- Customer Design Portal
- Admin dashboard
- Designer Dashboard
- Business Analytics
- Email notifications
- Tracking
- Printable invoices and packing slips
