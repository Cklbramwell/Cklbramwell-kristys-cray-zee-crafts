# Kristy's Cray-Zee Crafts V7.4

## Customer Design Portal

V7.4 adds artwork upload and proof approval to the existing order workflow.

### One-time Firebase step
Firebase Console → Storage → Get Started

After Storage is enabled, publish secure Storage rules. A starter rule file is included:
`firebase-storage.rules`

### Customer flow
My Orders → Design Center
1. Upload artwork / inspiration
2. Wait for proof
3. Open proof
4. Approve or request changes

### Admin flow
Admin → Orders → Open Order
1. View customer artwork
2. Upload customer proof
3. Order becomes Proof Sent
4. Customer responds
5. Approved proof becomes Proof Approved
6. Changes Requested returns order to Designing

### Email
When Resend is fully verified/configured, proof responses can notify:
`ADMIN_ORDER_EMAIL`
