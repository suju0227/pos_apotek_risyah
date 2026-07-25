# Task 1 Report: Backend Profile Update & Change Password Endpoints

**Status:** Finished (DONE)
**Date:** 2026-07-17

## 1. Files Created
### `backend/src/modules/auth/dto/update-profile.dto.ts`
- Optional `name` (string, min length 3)
- Optional `email` (string, valid email format)
- Handled with standard `class-validator` decorators: `@IsOptional()`, `@IsString()`, `@MinLength(3)`, `@IsEmail()`.

### `backend/src/modules/auth/dto/change-password.dto.ts`
- Required `oldPassword` (string)
- Required `newPassword` (string, min length 8)
- Handled with standard `class-validator` decorators: `@IsString()`, `@IsNotEmpty()`, `@MinLength(8)`.

---

## 2. Files Modified
### `backend/src/modules/auth/auth.service.ts`
- Implemented `updateProfile(userId, dto)`:
  - Fetches the user by ID (active and not deleted).
  - If the `email` is changing, verifies that the new email is not already taken by another active user (`deletedAt: null`, `isActive: true`). Throws `ConflictException` (409) if it is.
  - Updates only the provided fields in the database.
  - Returns a safe user object (excluding the hashed password).
- Implemented `changePassword(userId, dto)`:
  - Fetches the user by ID.
  - Compares the `oldPassword` with the current `passwordHash` using `bcrypt.compare`. Throws `BadRequestException` (400) if they don't match.
  - Hashes the `newPassword` using `bcrypt` (12 rounds) and saves it in the database.
  - Returns a success message.

### `backend/src/modules/auth/auth.controller.ts`
- Added the following endpoints:
  - `PATCH /api/auth/profile`: Protected by `JwtAuthGuard`, parses the request body as `UpdateProfileDto` and invokes `AuthService.updateProfile` with the current user's ID.
  - `PATCH /api/auth/change-password`: Protected by `JwtAuthGuard`, parses the request body as `ChangePasswordDto` and invokes `AuthService.changePassword` with the current user's ID.

---

## 3. Verification & Compilation Check
- Verified compile check using `npm run build` which succeeded without errors.
- Added comprehensive integration tests in `backend/src/modules/auth/auth.integration.spec.ts` to verify the functionality of both endpoints, including:
  - Profile update success
  - Rejecting profile updates to emails already in use by active users
  - Incorrect old password rejection for password updates
  - Successful password change and verifying the old password no longer logs the user in, whereas the new password does
- All 7 tests in `auth.integration.spec.ts` passed successfully.
