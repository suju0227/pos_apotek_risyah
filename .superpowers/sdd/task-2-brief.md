# Task 2 Brief: Frontend Notification Hooks & Dropdown UI

**Goal:** Create frontend notification hook, NotificationCenter component, and replace the static bell in AppShell.

## Files to Create/Modify:
- Modify: `frontend/src/features/dashboard/dashboard.hooks.ts`
- Create: `frontend/src/features/dashboard/components/NotificationCenter.tsx`
- Modify: `frontend/src/app/layout/AppShell.tsx`

## Requirements:
1.  **dashboard.hooks.ts**:
    - Implement `useDashboardNotifications` using `useQuery` from `@tanstack/react-query`.
    - Fetch from `/notifications` using `apiClient.get()`.
    - Set `refetchInterval` to `15000` (15 seconds) for real-time polling.
2.  **NotificationCenter.tsx**:
    - Bell icon trigger button.
    - If unread notifications count > 0, show a red counter badge with unread count.
    - Dropdown on click (width 420px, max-height 600px, scrollable).
    - Tabs for category filters: `Semua`, `Operasional`, `Stok`, `Purchase`, `Sistem`.
    - Unread / All sub-filters.
    - LocalStorage tracking for read IDs (`pos_read_notifications`) and deleted IDs (`pos_deleted_notifications`).
    - Unread badge should only count visible notifications that are not in read IDs or deleted IDs.
    - Item visual styling: priority color border/background (`critical`, `high`, `medium`, `info`, `success`), Lucide icons based on category.
    - Quick actions per item:
      - Mark as read (adds ID to `pos_read_notifications`).
      - Hide/delete (adds ID to `pos_deleted_notifications`).
      - Copy reference number (clipboard copy of invoice/PO/batch number if present).
    - Link to target page (e.g. `/produk`, `/batch`, `/pemesanan`, etc.).
3.  **AppShell.tsx**:
    - Import and render `<NotificationCenter />` instead of the static bell icon button.
