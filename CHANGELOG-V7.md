# Kristy's Cray-Zee Crafts

## V7.5.0 — Designer Dashboard

### New Designer Workspace
- Separate Designer Dashboard
- Assigned-job queue
- Rush priority visibility
- Due-date visibility
- Customer artwork access
- Full order configuration
- Proof status controls
- Production/design notes
- Upload customer proof
- Open current proof
- See customer revision requests

### Role Access
Users with role:
- admin
- designer

can open the Designer Dashboard.

Designers can only update orders assigned to them.

### Designer Assignment
Admin already has the Designer field in each order.

The assigned value should match the designer user's:
- Name
or
- Email

### Security
`designer-order-update.mjs` verifies:
- Firebase sign-in
- designer/admin role
- designer assignment before allowing updates

### Existing Features Preserved
- Customer Design Portal
- Artwork uploads
- Proof approval
- Admin dashboard
- Production board
- Email workflow
- Tracking
- Printable invoice
- Printable packing slip
