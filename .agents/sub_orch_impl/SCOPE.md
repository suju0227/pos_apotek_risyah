# Scope: Implementation Track

## Architecture
- Self-referencing relationship inside `ProductUnit` (`parentProductUnitId` links to another `ProductUnit` of the same product).
- Database: PostgreSQL with Prisma ORM (`backend/prisma/schema.prisma`).
- DTOs: `backend/src/modules/products/dto/create-product-unit.dto.ts` and `update-product-unit.dto.ts`.
- Service/Controller: `backend/src/modules/products/products.service.ts` and `products.controller.ts`.
- HPP/Sales integration: Ensure sales, purchase-orders, and purchase transactions handle chained units and recursive conversion.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | M1_DB_SCHEMA | Database schema update, Prisma Client generation, database migration. | None | IN_PROGRESS | 917a62a2-195d-4067-9949-bcf587ecfd86 |
| 2 | M2_BE_LOGIC | Backend service logic for automatic recursive conversion, circular dependency prevention, and DTO/Controller updates. | M1 | PLANNED | TBD |
| 3 | M3_FE_UI | Frontend UI updates: dropdown parent selection, multiplier inputs, dynamic conversion text preview. | M2 | PLANNED | TBD |
| 4 | M4_HPP_ACCURACY | Integration with HPP and Sales logic, ensuring that sales and purchases calculate HPP and gross profit correctly using recursive conversion values. | M2 | PLANNED | TBD |
| 5 | M5_FINAL_PASS | Pass E2E test suites, verify layout, and adversarial coverage hardening. | M3, M4, TEST_READY | PLANNED | TBD |

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
