# Task 1 Brief: Backend Notifications Service & Controller

**Goal:** Create Notification Center backend service, controller, and module, and register them in the main app module.

## Files to Create/Modify:
- Create: `backend/src/modules/notifications/notifications.service.ts`
- Create: `backend/src/modules/notifications/notifications.controller.ts`
- Create: `backend/src/modules/notifications/notifications.module.ts`
- Modify: `backend/src/app.module.ts`

## Requirements:
1.  **NotificationsService**:
    - Query parallel DB states using Prisma:
      - Low Stock products (`stockAvailableBase <= minStockBase`)
      - Expiring batches (`daysUntilExpired <= 90`)
      - Late POs (status SENT/PARTIALLY_RECEIVED and past `orderDate` + 3 days)
      - Audit logs (logins/logouts, failed logins, price updates)
      - Database backup warning (if backup was not done within 24h)
    - Apply role-based filtering:
      - KASIR: Only gets stock, and operational categories.
      - APOTEKER: Gets stock and operational prescriptions.
      - MANAGER / PEMILIK: Gets all categories.
2.  **NotificationsController**:
    - Rute: `GET /api/notifications`
    - Security: Use `JwtAuthGuard` and `RolesGuard`.
3.  **NotificationsModule**:
    - Imports: `PrismaModule`
    - Controllers: `NotificationsController`
    - Providers: `NotificationsService`
