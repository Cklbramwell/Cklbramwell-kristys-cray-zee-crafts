# Kristy's Cray-Zee Crafts

## V7.4.0 — Customer Design Portal

### Customer Design Center
- Upload artwork/logo files
- Upload inspiration photos
- Upload reference files
- View files already attached to the order
- View current proof
- Approve proof online
- Request proof changes online
- Revision notes saved to the order
- Customer approval moves order to Proof Approved

### Admin Design Workflow
- See customer-uploaded artwork directly inside the order
- Open customer files
- Upload a proof image/PDF from Admin
- Proof automatically moves to Proof Sent
- Customer proof response returns to Admin
- Admin receives proof-response email when Resend is configured

### Supported Customer Uploads
- PNG
- JPG/JPEG
- WEBP
- SVG
- PDF
- Maximum 20 MB per file

### Firebase Storage
This release uses Firebase Storage for artwork/proof files.
Enable Firebase Storage for the project and publish the included `firebase-storage.rules`
(or equivalent secure rules) before testing uploads.

### New Netlify Function
- `customer-order-update.mjs`
  - Validates Firebase sign-in
  - Confirms customer owns the order
  - Saves artwork metadata
  - Handles proof approvals and revision requests

### Existing Features Preserved
- Stripe checkout
- Firestore orders
- Dedicated product builders
- Production dashboard
- Tracking
- Email workflow
- Printable invoice
- Printable packing slip
