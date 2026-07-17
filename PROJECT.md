# Project: Rantai Satuan (Chained Units) POS Apotek V2

## Architecture
This feature updates the product unit configuration from a flat structure to a chained/hierarchical structure:
- **ProductUnit relation**: Self-referencing relationship inside `ProductUnit` (`parentProductUnitId` links to another `ProductUnit` of the same product).
- **Backend conversion**: Calculates `conversionToBase` recursively starting from the configured `multiplier` and parent's `conversionToBase`.
- **Integrity validations**: Prevent circular references (e.g., unit A -> parent B -> parent A).
- **DTA/Controllers**: Exposes parent ID and multiplier on DTOs and API responses.
- **Frontend Master Data**: Allows users to select parent unit, set multiplier, and see a dynamic conversion explanation.
- **Transaction/HPP calculation**: Purchase orders, sales, and HPP allocations must work correctly using the newly calculated conversion values.

## Code Layout
- Backend:
  - Schema: `backend/prisma/schema.prisma`
  - DTOs:
    - `backend/src/modules/products/dto/create-product-unit.dto.ts`
    - `backend/src/modules/products/dto/update-product-unit.dto.ts`
  - Service: `backend/src/modules/products/products.service.ts`
  - Controller: `backend/src/modules/products/products.controller.ts`
  - Integration Tests: `backend/src/modules/master-data.integration.spec.ts`
- Frontend:
  - Master Page UI: `frontend/src/features/master-data/MasterDataPages.tsx`

## Milestones

### Implementation Track
| # | Milestone Name | Scope | Dependencies | Status | Conversation ID |
|---|----------------|-------|--------------|--------|-----------------|
| 1 | M1_DB_SCHEMA   | Database schema update, Prisma Client generation, database migration. | None | IN_PROGRESS | 7407bb2c-b06e-42ca-a885-c4d00a7323cd |
| 2 | M2_BE_LOGIC    | Backend service logic for automatic recursive conversion, circular dependency prevention, and DTO/Controller updates. | M1 | PLANNED | 7407bb2c-b06e-42ca-a885-c4d00a7323cd |
| 3 | M3_FE_UI       | Frontend UI updates: dropdown parent selection, multiplier inputs, dynamic conversion text preview. | M2 | PLANNED | 7407bb2c-b06e-42ca-a885-c4d00a7323cd |
| 4 | M4_HPP_ACCURACY| Integration with HPP and Sales logic, ensuring that sales and purchases calculate HPP and gross profit correctly using recursive conversion values. | M2 | PLANNED | 7407bb2c-b06e-42ca-a885-c4d00a7323cd |
| 5 | M5_FINAL_PASS  | Pass E2E test suites, verify layout, and adversarial coverage hardening. | M3, M4, TEST_READY | PLANNED | 7407bb2c-b06e-42ca-a885-c4d00a7323cd |

### E2E Testing Track
| # | Milestone Name | Scope | Dependencies | Status | Conversation ID |
|---|----------------|-------|--------------|--------|-----------------|
| 1 | T1_TESTS       | Build the opaque-box test suite covering Tiers 1-4 for unit integrity and HPP correctness, and publish `TEST_READY.md`. | None | IN_PROGRESS | 8dcfa485-515e-45d1-bc78-968ae5719224 |

## Interface Contracts
### Product Unit API Payload
When creating/updating product units:
```typescript
class CreateProductUnitDto {
  productId: string;
  unitId: string;
  parentProductUnitId?: string;
  multiplier?: number; // relative to parent
  isSaleUnit?: boolean;
  isDefaultSaleUnit?: boolean;
}
```

Response detail:
```typescript
interface ProductUnitResponse {
  id: string;
  productId: string;
  unitId: string;
  conversionToBase: number;
  parentProductUnitId: string | null;
  multiplier: number | null;
  // other existing fields
}
```
