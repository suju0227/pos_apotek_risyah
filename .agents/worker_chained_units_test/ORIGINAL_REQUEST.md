## 2026-07-10T02:57:49Z
Objective: Write a NestJS E2E/integration test suite covering Tiers 1-4 for the Rantai Satuan (Chained Units) feature.
File path: d:\pos_apotek_risyah\backend\tests\e2e\chained-units.e2e.spec.ts

Please implement a comprehensive NestJS E2E test file using Supertest. You should:
1. Examine backend/src/modules/master-data.integration.spec.ts and backend/src/modules/sales/sales.integration.spec.ts to see the setup and patterns (e.g., seeding users, logging in to get tokens, helper functions for creating products and batches).
2. Write E2E tests for the Chained Units (Rantai Satuan) feature matching the following 4 tiers:
   - Tier 1 (Feature Coverage):
     * Setup a multi-level product unit chain (Box -> Strip -> Tablet).
     * Retrieve product units and check recursive conversionToBase.
     * Update unit multiplier and check recursive conversionToBase updates.
     * Circular dependency check on creation (A -> B -> A).
     * Circular dependency check on update.
     * Self-referencing check (A -> A).
     * Purchase Order conversion with chained units.
     * Sales checkout HPP and profit checks for higher units.
   - Tier 2 (Boundary & Corner Cases):
     * Invalid multipliers (0, negative).
     * Decimal multipliers (e.g. 2.5 multiplier).
     * Large multipliers.
     * Product unit from a different product referenced as parent (throw error).
     * Deletion of a parent unit (cascade check or validation).
     * Self-parent check on update.
     * Double default sale unit check.
     * Inactive unit references.
   - Tier 3 (Cross-Feature Combinations):
     * Multi-level PO -> Purchase -> Sales with FEFO.
     * Sales return under chained units.
     * Purchase return under chained units.
     * Stock adjustment for child units.
   - Tier 4 (Real-World Workloads):
     * Full business scenario (Amox purchasing in Box/Strip and selling in Strip/Tablet, checking HPP/gross profit and historical reports).
     * Expired batch FEFO check.
     * Master data caching verification with chained units.
     * Cashier security check (no HPP/laba returned to Kasir).
