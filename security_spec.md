# Zendo Workspace — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Global Default-Deny**: All paths not explicitly matched in `/databases/{database}/documents` are unconditionally denied (`allow read, write: if false;`).
2. **Strict Identity & Email Verification**: Every write operation requires an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`), or the bootstrapped admin (`findifyai@gmail.com` with `email_verified == true`).
3. **Path Variable Hardening**: Every document ID variable (`{userId}`, `{taskId}`) on single-document operations (`get`, `create`, `update`, `delete`) must satisfy `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Master Gate Relational Sync**: A task in `/users/{userId}/tasks/{taskId}` cannot be created, read, updated, or deleted unless the parent `/users/{userId}` document exists (`exists(...)`) and its `uid` matches `request.auth.uid`.
5. **Anti-Update-Gap & Schema Blueprints**: Both `create` and `update` operations must pass `isValidUserProfile(incoming())` or `isValidWorkspaceTask(incoming())`, enforcing exact key allowlists (`hasAll` and `hasOnly`), strict types, enum constraints, and `.size()` bounds on every string.
6. **Immutability & Temporal Integrity**: `uid`, `ownerId`, `id`, and `createdAt` are immutable across updates. `createdAt` must equal `request.time` on `create`, and `updatedAt` must equal `request.time` on both `create` and `update`.
7. **Terminal State Locking**: Once a `WorkspaceTask` reaches `status == 'completed'`, subsequent client updates are rejected unless performed by `isAdmin()`. To reopen a completed task, the client recreates the task or an admin overrides.
8. **Secure List Queries**: `allow list` on `/users/{userId}/tasks` is restricted strictly to `isOwner(userId) && resource.data.ownerId == request.auth.uid` with zero `get()`/`exists()` calls inside `list`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Identity Spoofing on Profile Create**: Authenticated as `user_A`, attempting to create `/users/user_A` with `{ uid: "user_B", ... }`. -> `PERMISSION_DENIED`
2. **Payload 2 — Shadow Field Injection on Profile Create**: Adding `{ isAdmin: true, role: "superuser" }` to `/users/user_A`. -> `PERMISSION_DENIED`
3. **Payload 3 — Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/users/user_A`. -> `PERMISSION_DENIED`
4. **Payload 4 — Cross-User Profile Read (PII / Profile Leak)**: Authenticated as `user_B`, attempting `get` on `/users/user_A`. -> `PERMISSION_DENIED`
5. **Payload 5 — Immortal Field Mutation (`createdAt` / `uid`)**: Updating `/users/user_A` while modifying `createdAt` or `uid`. -> `PERMISSION_DENIED`
6. **Payload 6 — Forged Client Timestamp**: Creating `/users/user_A` with a past/future `createdAt` instead of `request.time`. -> `PERMISSION_DENIED`
7. **Payload 7 — Orphaned Task Creation (Master Gate Bypass)**: Creating `/users/user_A/tasks/task_1` when `/users/user_A` does not exist in Firestore. -> `PERMISSION_DENIED`
8. **Payload 8 — Value Poisoning on Task Update**: Updating `title` on `/users/user_A/tasks/task_1` with a 5,000-character string (exceeding `maxLength: 200`). -> `PERMISSION_DENIED`
9. **Payload 9 — Invalid Enum State Shortcutting**: Setting `status: "archived_hack"` or `priority: "Critical"` outside the allowed enums. -> `PERMISSION_DENIED`
10. **Payload 10 — Terminal State Mutation**: Attempting to update `title` or `status` on `/users/user_A/tasks/task_1` after `existing().status == 'completed'`. -> `PERMISSION_DENIED`
11. **Payload 11 — ID Poisoning Attack**: Creating a task with an invalid document ID containing spaces or special characters (`task$bad!id`). -> `PERMISSION_DENIED`
12. **Payload 12 — Unauthorized List Scraping**: Authenticated as `user_B`, attempting `list` on `/users/user_A/tasks`. -> `PERMISSION_DENIED`
