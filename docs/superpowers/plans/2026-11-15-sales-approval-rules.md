# Sales Approval Rules Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ship manager sales rules + pending approval handshake for pharmacist sales.

**Architecture:** New `sales_approvals` Django app; gate `purchases/bulk_create`; Manager Sales Rules + Approvals UI; Pharmacist Approvals confirm UI.

**Tech Stack:** Django REST, Next.js, existing AppShell/workspace patterns.

## Global Constraints
- Stock untouched until pharmacist accepts final settlement
- One manager per pharmacy; mutual exclusion between rule types
- Match existing manager/pharmacist polish

---

### Task 1: Backend models + API
- [ ] Create `sales_approvals` app with models, serializers, views, urls
- [ ] Register app + urls; migrate
- [ ] Gate `bulk_create` to create pending sales when rules hit
- [ ] Settle / reject / pharmacist-confirm endpoints

### Task 2: Frontend API + Manager UI
- [ ] Actions in `lib/actions.ts`
- [ ] Sales Rules section (batch quantity rules + needs-approval list)
- [ ] Pending Approvals section
- [ ] Wire Manager nav + view

### Task 3: Pharmacist UI
- [ ] Handle pending response from bulk create
- [ ] Approvals section for manager changes / reject reasons
- [ ] Wire Pharmacist nav + view
