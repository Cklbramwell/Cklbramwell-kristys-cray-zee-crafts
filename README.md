# Kristy's Cray-Zee Crafts V7.2

## Admin + Production Workflow

The Admin dashboard is now designed to manage a custom order through production.

### Main files
- `src/pages/Admin.jsx`
- `src/components/ProductionBoard.jsx`
- `src/components/ProductionOrderCard.jsx`
- `src/components/OrderDetails.jsx`
- `src/config/production.js`
- `netlify/functions/update-order.mjs`
- `netlify/functions/stripe-webhook.mjs`

### Workflow
New Order → Designing → Proof Sent → Proof Approved → Printing → Quality Check →
Ready for Pickup / Shipped → Completed

### Team fields
- Designer
- Printer / production
- Priority
- Due date
- Proof status
- Proof URL
- Production notes
- Internal notes

Internal notes are shown only in Admin.

### Existing orders
Older orders with status `Paid` are displayed as `New Order` in the new dashboard.
Their status history begins when you make the next production update.
