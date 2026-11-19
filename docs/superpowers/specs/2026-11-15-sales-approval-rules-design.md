# Sales Approval Rules Design

## Goal
Manager-configurable sales rules that hold pharmacist sales for manager review, then pharmacist confirmation, before inventory is touched.

## Rules
1. **Quantity bands** — per medicine: threshold + optional final. Sale qty in band (`>= threshold` and `<= final` if set) holds the sale. Unique medicine; cannot also be on rule 2.
2. **Needs approval** — any qty of marked medicine holds the sale. No band on the rule itself. Mutual exclusion with rule 1.

## Pending flow
1. Pharmacist submits cart → entire sale held if any line triggers; inventory untouched. Unflagged items can be sold in a separate cart. Other sales allowed meanwhile. No timeout.
2. Manager Pending Approvals queue: approve as-is, edit that-sale-only unit prices, attach any medicines (threshold + optional final; optional unit price; no stock check), or reject with required reason.
3. Rule 2 lines and attachments: manager sets qty threshold/final; pharmacist enters qty inside band.
4. Pharmacist accepts → settle purchases with override prices/qty. Pharmacist rejects → sale fails. Manager reject → pharmacist notified with reason.

## Architecture
Django app `sales_approvals` + Manager/Pharmacist UI sections. `purchases/bulk_create` evaluates rules and creates `PendingSale` when needed.
