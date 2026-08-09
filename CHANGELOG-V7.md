# Kristy's Cray-Zee Crafts

## V7.2.0 — Admin Dashboard + Production Workflow

### New Admin Workflow
- Production board with workflow columns
- Order search
- Status filtering
- Rush / normal filtering
- Rush order indicators
- Due-date visibility
- Designer assignment
- Printer / production assignment
- Production due date
- Proof status
- Proof URL
- Production notes
- Private internal notes
- Shipping / tracking controls
- Status history
- Newest-order dashboard
- Attention-needed dashboard counters

### Production Stages
1. New Order
2. Designing
3. Proof Sent
4. Proof Approved
5. Printing
6. Quality Check
7. Ready for Pickup
8. Shipped
9. Completed
10. Cancelled

### Customer Portal Upgrade
Customers now see:
- Production progress timeline
- Current status
- Proof status
- Proof link when provided
- Production due date
- Tracking details
- Full configured products and payment totals

### New Stripe Orders
New paid Stripe orders are now created as:
- Payment Status: paid
- Production Status: New Order
- Rush priority automatically detected
- Due date copied from the customer's Needed By selection
- Initial status history entry created

### Email Updates
When configured with Resend, customer emails can now be triggered by:
- Production status changes
- Proof status / proof link changes
- Due-date changes
- Tracking changes
