# Kristy's Cray-Zee Crafts

## V7.3.1 — Print Preview Fix

### Fixed
- Print Invoice button now opens the invoice preview.
- Print Packing Slip button now opens the packing slip preview.
- Print / Save PDF works through the browser print dialog.
- Close button returns to the Admin order without changing the order.

### Cause
V7.3 correctly set the print job when a button was clicked, but the PrintModal
component was not mounted in App.jsx because the insertion point referenced the
wrong toast-state variable. V7.3.1 mounts PrintModal correctly.
