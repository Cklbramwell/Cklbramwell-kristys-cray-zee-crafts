# Kristy's Cray-Zee Crafts V7.3

V7.3 adds live admin order alerts and printable business documents.

## Print Workflow
Admin → Orders → Open Order

Use:
- Print Invoice
- Print Packing Slip

The preview includes a `Print / Save PDF` button. Your browser print dialog can print physically or save as PDF.

## New Admin Alerts
New orders with status `New Order` appear in the New Order Alert panel until opened or marked seen.

## Email Environment Variables
Keep these in Netlify:
- RESEND_API_KEY
- ORDER_FROM_EMAIL
- ADMIN_ORDER_EMAIL

These must remain server-side and should never be placed in a VITE_* variable.
