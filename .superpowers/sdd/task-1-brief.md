# Task 1 Brief: Backend Profile Update & Change Password Endpoints

**Goal:** Create profile update and change password endpoints on the Auth module.

## Files to Create/Modify:
- Create: `backend/src/modules/auth/dto/update-profile.dto.ts`
- Create: `backend/src/modules/auth/dto/change-password.dto.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`

## Requirements:
1.  **UpdateProfileDto**:
    - Optional `name` (string, min length 3)
    - Optional `email` (string, valid email format)
2.  **ChangePasswordDto**:
    - Required `oldPassword` (string)
    - Required `newPassword` (string, min length 8)
3.  **AuthService**:
    - `updateProfile(userId, dto)`:
      - If email is changing, verify that the new email is not already used by another active user.
      - Update user name and email.
      - Return safe user object.
    - `changePassword(userId, dto)`:
      - Compare `oldPassword` with the current hashed password in database.
      - Hash `newPassword` and update the database.
4.  **AuthController**:
    - `PATCH /api/auth/profile`: JwtAuthGuard protected, calls `authService.updateProfile`
    - `PATCH /api/auth/change-password`: JwtAuthGuard protected, calls `authService.changePassword`
