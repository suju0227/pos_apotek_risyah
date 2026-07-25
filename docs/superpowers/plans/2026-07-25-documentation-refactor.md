# Documentation Refactor POS Apotek V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor and synchronize all existing documentation files (`PRD`, `SRS`, `SDD`, `Business Rules`, `UI/UX Flow`, `Task Breakdown`, `Frontend Spec`, `Backend Spec`, `Traceability`) and create new domain specifications (`Product`, `Inventory`, `Purchasing`, `Sales`) and ADRs (`Category Tree`, `Notification Center`).

**Architecture:** Systematic document update per sprint to ensure all design specs reflect the current codebase (Hierarchical Categories, Notification Center, User Profile Menu, Docker Local Mode).

**Tech Stack:** Markdown, Mermaid diagrams, GitHub Alerts.

## Global Constraints
- Do not alter core business rules (batch stock, FEFO, decimal HPP, RBAC, atomic transactions).
- Maintain Bahasa Indonesia for frontend routes and technical English for API endpoints.

---

### Task 1: Sprint 1 — Core Specs Sync (`PRD`, `SRS`, `SDD`)

**Files:**
- Modify: `docs/01_PRD_POS_APOTEK.md`
- Modify: `docs/02_SRS_POS_APOTEK.md`
- Modify: `docs/03_SDD_SYSTEM_DESIGN_POS_APOTEK.md`

**Interfaces:**
- Consumes: Design spec `docs/superpowers/specs/2026-07-25-documentation-refactor-design.md`
- Produces: Updated core specification documents version 1.2.0 / 1.3.0.

- [ ] **Step 1: Update PRD (`01_PRD_POS_APOTEK.md`)**
  - Add Hierarchical Category System to Product scope section.
  - Add Notification Center (Pusat Notifikasi Operasional) to operational flow and scope.
  - Add User Profile & Self-Service Password to account management scope.
  - Update version header to 1.2.0.

- [ ] **Step 2: Update SRS (`02_SRS_POS_APOTEK.md`)**
  - Add `FR-CAT-002` (Kategori Hirarki - tree structure, parentId, cycle prevention).
  - Add `FR-NOTIF-001` (Notification Center - dynamic synthesis, RBAC filtering).
  - Update API endpoints list with `GET /api/notifications` and category endpoints.
  - Update version header to 1.2.0.

- [ ] **Step 3: Update SDD (`03_SDD_SYSTEM_DESIGN_POS_APOTEK.md`)**
  - Update Prisma schema definition for `Category` with self-referencing relation (`parentId`, `sortOrder`).
  - Add `NotificationsModule` architecture and Redis cache invalidation keys (`categories:tree`, `categories:flat`).
  - Update version header to 1.3.0.

- [ ] **Step 4: Commit Sprint 1 changes**

```bash
git add docs/01_PRD_POS_APOTEK.md docs/02_SRS_POS_APOTEK.md docs/03_SDD_SYSTEM_DESIGN_POS_APOTEK.md
git commit -m "docs: sync core specs PRD, SRS, and SDD to v1.2.0/v1.3.0"
```

---

### Task 2: Sprint 2 — Flow & Rules Sync (`Business Rules`, `UI/UX Flow`, `Task Breakdown`)

**Files:**
- Modify: `docs/business-rules.md`
- Modify: `docs/04_UI_UX_FLOW_POS_APOTEK.md`
- Modify: `docs/05_TASK_BREAKDOWN_POS_APOTEK.md`

**Interfaces:**
- Consumes: Task 1 updated core specs.
- Produces: Updated business rules, UI flow, and task breakdown documents.

- [ ] **Step 1: Update Business Rules (`docs/business-rules.md`)**
  - Add Category Tree constraint rules (unique name per parent, parent delete protection).
  - Add Notification Center RBAC visibility rules per role.

- [ ] **Step 2: Update UI/UX Flow (`docs/04_UI_UX_FLOW_POS_APOTEK.md`)**
  - Add UI Flow for Tree View Category Management (`/kategori`).
  - Add UI Flow for Topbar Notification Bell & Dropdown Panel.
  - Add UI Flow for User Profile Dropdown & Ganti Password Modal.

- [ ] **Step 3: Update Task Breakdown (`docs/05_TASK_BREAKDOWN_POS_APOTEK.md`)**
  - Update task completion statuses up to July 2026 releases.
  - Add explicit task entries for Category Tree Refactor and Notification Center.

- [ ] **Step 4: Commit Sprint 2 changes**

```bash
git add docs/business-rules.md docs/04_UI_UX_FLOW_POS_APOTEK.md docs/05_TASK_BREAKDOWN_POS_APOTEK.md
git commit -m "docs: sync business rules, UI flow, and task breakdown"
```

---

### Task 3: Sprint 3 — Domain Specifications (`Product` & `Inventory`)

**Files:**
- Create: `docs/domains/PRODUCT_DOMAIN_SPEC.md`
- Create: `docs/domains/INVENTORY_DOMAIN_SPEC.md`

**Interfaces:**
- Consumes: Updated SDD, SRS, PRD.
- Produces: Dedicated domain specifications for Product and Inventory.

- [ ] **Step 1: Create Product Domain Spec (`docs/domains/PRODUCT_DOMAIN_SPEC.md`)**
  - Document master product structure, active sales units, hierarchical categories, unit conversion, and modal vs sale price separation.

- [ ] **Step 2: Create Inventory Domain Spec (`docs/domains/INVENTORY_DOMAIN_SPEC.md`)**
  - Document batch stock mechanics, FEFO calculation rules, stock mutation types, stock adjustment, and low-stock/expired alerts.

- [ ] **Step 3: Commit Sprint 3 changes**

```bash
git add docs/domains/PRODUCT_DOMAIN_SPEC.md docs/domains/INVENTORY_DOMAIN_SPEC.md
git commit -m "docs: create product and inventory domain specifications"
```

---

### Task 4: Sprint 4 — Domain Specs (`Purchasing`, `Sales`), ADRs & Final Traceability Sync

**Files:**
- Create: `docs/domains/PURCHASING_DOMAIN_SPEC.md`
- Create: `docs/domains/SALES_DOMAIN_SPEC.md`
- Create: `docs/adr/0001-hierarchical-category-system.md`
- Create: `docs/adr/0002-notification-center-dynamic-synthesis.md`
- Modify: `docs/06_FRONTEND_POS_APOTEK.md`
- Modify: `docs/07_BACKEND_POS_APOTEK.md`
- Modify: `docs/12_TRACEABILITY_PRD_SRS_SDD_UI_TASK_POS_APOTEK.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: Full documentation refactor completion with ADRs and traceability.

- [ ] **Step 1: Create Purchasing Domain Spec (`docs/domains/PURCHASING_DOMAIN_SPEC.md`)**
  - Document PO flow, conversion PO to purchase, supplier batch reception, and purchase returns.

- [ ] **Step 2: Create Sales Domain Spec (`docs/domains/SALES_DOMAIN_SPEC.md`)**
  - Document cashier checkout, prescription pulling, split batch allocation, historical profit snapshot, and sales returns.

- [ ] **Step 3: Create ADR 0001 (`docs/adr/0001-hierarchical-category-system.md`)**
  - Record context, decision, and consequences of Prisma self-referencing Category Tree.

- [ ] **Step 4: Create ADR 0002 (`docs/adr/0002-notification-center-dynamic-synthesis.md`)**
  - Record context, decision, and consequences of State-Based Dynamic Synthesis for Notification Center.

- [ ] **Step 5: Sync Frontend Spec, Backend Spec, Traceability Matrix & AGENTS.md**
  - Update `06_FRONTEND_POS_APOTEK.md` with new UI components.
  - Update `07_BACKEND_POS_APOTEK.md` with new backend services.
  - Update `12_TRACEABILITY_PRD_SRS_SDD_UI_TASK_POS_APOTEK.md` mapping.
  - Update `AGENTS.md` reading order to include `docs/domains/*` and `docs/adr/*`.

- [ ] **Step 6: Commit Sprint 4 changes**

```bash
git add docs/ AGENTS.md
git commit -m "docs: complete documentation refactor with purchasing/sales specs, ADRs, and traceability"
```
