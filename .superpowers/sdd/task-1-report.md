# Task 1 Report: Backend Notifications Service & Controller

## Implementation Summary
The backend for the Notification Center has been successfully implemented using NestJS and Prisma ORM. It synthesizes system notifications dynamically based on the current database state and filters them according to the user's role (RBAC).

### Files Created/Modified
1.  **Created**: `backend/src/modules/notifications/notifications.service.ts`
    *   Implements `NotificationsService`.
    *   Queries low stock products (where total active, non-expired batch stock is below minimum stock).
    *   Queries expiring batches (expiring within 90 days).
    *   Queries late purchase orders (SENT or PARTIALLY_RECEIVED status past orderDate + 3 days).
    *   Queries operational prescriptions (status READY_FOR_PAYMENT or NEED_CONFIRMATION).
    *   Queries audit logs (login, logout, product creation, price updates, failed logins) and maps them to human-readable notifications.
    *   Queries database backup history (triggers warning if no backup occurred in the last 24h).
    *   Applies RBAC filtering rules (KASIR, APOTEKER, MANAGER, PEMILIK).
    *   Sorts notifications by priority (`critical` > `high` > `medium` > `info` > `success`) and then by creation date.
2.  **Created**: `backend/src/modules/notifications/notifications.controller.ts`
    *   Exposes `GET /api/notifications`.
    *   Protected with `JwtAuthGuard` and `RolesGuard`.
    *   Explicitly annotated with `@Roles('KASIR', 'APOTEKER', 'MANAGER', 'PEMILIK')`.
3.  **Created**: `backend/src/modules/notifications/notifications.module.ts`
    *   Registers `PrismaModule` imports, `NotificationsController` controllers, and `NotificationsService` providers.
4.  **Modified**: `backend/src/app.module.ts`
    *   Registered `NotificationsModule` into the main application module.
5.  **Created**: `backend/src/modules/notifications/notifications.integration.spec.ts`
    *   Verifies that unauthenticated requests are blocked (401).
    *   Verifies that KASIR, APOTEKER, MANAGER, and PEMILIK roles are allowed to access the endpoint and retrieve their filtered lists.

## Verification & Tests
1.  **NestJS Build Check**:
    *   Command: `npm run build`
    *   Result: Successfully completed with no compiler errors.
2.  **Integration Test Execution**:
    *   Command: `npm run test -- src/modules/notifications/notifications.integration.spec.ts`
    *   Result: `PASS`
        *   `rejects unauthenticated requests` (passed)
        *   `allows access for all active roles and returns list sorted by priority` (passed)

All Task 1 objectives have been achieved and verified!
