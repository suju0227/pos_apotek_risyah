# Task 2 Brief: Frontend UserProfileMenu & Modal Dialogs

**Goal:** Create UserProfileMenu dropdown component with Tailwind modals for all profile features, and integrate it into AppShell.

## Files to Create/Modify:
- Create: `frontend/src/features/dashboard/components/UserProfileMenu.tsx`
- Modify: `frontend/src/app/layout/AppShell.tsx`

## Requirements:
1.  **UserProfileMenu.tsx**:
    - Build a button containing the user name, role, and avatar (letters from name) with a dropdown arrow (`ChevronDown`).
    - The dropdown should have:
      - Header displaying details of the current logged-in user (fullname, role, Cabang "Apotek Risyah", and green Online status dot).
      - Dividers separating groups of menu items.
      - Exactly the 10 menu items:
        1. **My Profile** (Modal popup displaying fullname, username, email, role, cabang, status)
        2. **Edit Profile** (Modal with form to edit fullname and email, triggering PATCH `/api/auth/profile`, reloading user detail)
        3. **Change Password** (Modal with old password, new password, confirmation fields, validating length >= 8, triggering PATCH `/api/auth/change-password`)
        4. **Preferences** (Modal to choose Bahasa, Theme, Font size, Sidebar, persisting state to LocalStorage)
        5. **Notifications** (Modal to configure notifications check status, persisting toggle state to LocalStorage)
        6. **Session Info** (Modal with fake/real session details like OS Windows 11, Chrome browser, dummy IP 192.168.1.25, and ticking login duration timer)
        7. **Shortcuts** (Modal showing keyboard shortcuts list)
        8. **Help Center** (Modal showing user manual info / FAQ link)
        9. **About App** (Visible for MANAGER/OWNER only, showing version v1.0.0, build 2026.07.17, database postgres, backend nestjs, frontend react)
        10. **Logout** (Confirmation dialog. If confirmed, calls `logout()` hook and navigates to `/login`)
    - Styling must use modern ERP style: rounded-16px, soft shadow, hover effects, green accent theme.
2.  **AppShell.tsx**:
    - Import and render `<UserProfileMenu />` in the top right header (replacing the static profile button).
