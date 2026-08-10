# Kristy's Cray-Zee Crafts V7.5

## Designer Dashboard

V7.5 adds a focused workspace for designers.

### Give a user Designer access
In Firestore `users/{uid}`, set:

`role: "designer"`

The user's `name` or `email` should match the Designer assignment on an order.

### Designer workflow
Designer Dashboard → My Work Queue → Open Job

The designer can:
- view customer artwork
- review exact product configuration
- update proof status
- add designer/production notes
- upload a proof
- view revision requests

### Security
Designers cannot edit arbitrary orders. The server function verifies assignment.
