# Scope: T1_TESTS

## Architecture
- Opaque-box E2E test suite built on NestJS and supertest.
- Tests target the public API boundaries (/api/products, /api/purchase-orders, /api/purchases, /api/sales, etc.).
- Verifies recursive unit conversions, circular reference blocks, purchase HPP allocation, and sales HPP/profit snapshots.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Plan & Spec | Decompose test scenarios into 4 tiers and write test specs. | None | DONE | TBD |
| 2 | Code Generation | Generate `backend/tests/e2e/chained-units.e2e.spec.ts`. | M1 | PLANNED | TBD |
| 3 | Verification | Verify that test suite runs (compilation check and failure analysis). | M2 | PLANNED | TBD |
| 4 | Finalization | Publish TEST_INFRA.md and TEST_READY.md. | M3 | PLANNED | TBD |

## Interface Contracts Checked
- POST/PATCH `/api/products/:productId/units` accepting `parentProductUnitId` and `multiplier`.
- GET `/api/products/:productId` returning recursive `conversionToBase`.
- POST `/api/sales` and POST `/api/purchases` correctly converting amounts and calculating HPP.
