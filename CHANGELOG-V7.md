# Kristy's Cray-Zee Crafts

## V7.3.0 — Live Admin Dashboard + Printable Documents

### New
- New-order alert panel in Admin
- New-order badge/queue for unseen paid orders
- Rush-order highlighting
- Printable invoice preview
- Printable packing slip preview
- Print / Save PDF support through the browser
- Detailed invoice item configurations
- Packing checklist
- Production sign-off area

### Invoice Includes
- Business branding
- Customer information
- Order number
- Status
- Payment status
- Due date
- Product configuration
- Quantity
- Unit price
- Line total
- Subtotal
- Grand total

### Packing Slip Includes
- Customer information
- Shipping / pickup details
- Product configuration
- Quantity
- Pack checkboxes
- Quality-control checklist
- Packed-by / date sign-off

### Admin Notifications
The dashboard highlights new Firestore orders that have not yet been opened/marked seen in that browser.

### Email Notifications
Email configuration remains server-side using:
- RESEND_API_KEY
- ORDER_FROM_EMAIL
- ADMIN_ORDER_EMAIL

After Resend domain verification completes, the existing webhook can send customer/admin email notifications.
