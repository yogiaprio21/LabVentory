# LabVentory Access Control

LabVentory uses role-based access control with explicit permissions. Roles decide which action a user may attempt, while tenancy helpers decide which institution, lab, user, inventory item, or borrowing record is inside that user's allowed data scope.

## Principles

- Deny by default: protected API routes must use `requirePermission`, `requireAnyPermission`, or a conditional permission middleware.
- Least privilege: UI buttons and backend routes check the smallest meaningful permission, such as `lab.transfer` or `borrowing.markLost`.
- Tenant isolation stays separate from ACL: permissions do not bypass `scoped*Where` helpers or `assert*Access` checks.
- Frontend checks are UX guards only. Backend ACL remains authoritative for every protected request.
- `superadmin` is kept as a compatibility role and should be treated as equivalent to `platform_admin`.

## Source Of Truth

- Backend registry: `backend/src/config/access-control.js`
- Backend middleware: `backend/src/middleware/auth.js`
- Frontend mirror: `frontend/src/config/accessControl.ts`
- Read-only UI matrix: `/superadmin/access-control`
- Backend matrix API: `GET /api/acl/matrix`
- Automated audit: `npm --prefix backend run audit:acl`

## Role Summary

| Role | Scope | Purpose |
| --- | --- | --- |
| `platform_admin` | Global | Manage platform institutions, platform admins, tenant users, labs, reports, audit, and ACL visibility. |
| `superadmin` | Global | Legacy compatibility alias for `platform_admin`. |
| `institution_admin` | One institution | Manage labs, tenant users, invitations, inventory operations, borrowings, reports, and audit within one institution. |
| `lab_admin` | One lab | Manage daily inventory, categories, borrowing approvals, reports, and audit within the assigned lab. |
| `admin` | One lab | Legacy lab-manager role with the same operational permissions as `lab_admin`. |
| `student` | Own account and assigned lab | View inventory, create borrowing requests, view own borrowing history, notifications, and profile. |

## Key Permissions

| Module | Permission examples |
| --- | --- |
| Platform | `accessControl.view`, `platform.analytics.view` |
| Institutions | `institution.view`, `institution.create`, `institution.update` |
| Labs | `lab.view`, `lab.create`, `lab.update`, `lab.transfer`, `lab.deactivate` |
| Users | `user.view`, `user.create`, `user.update`, `user.deactivate`, `platformUser.create`, `platformUser.manage` |
| Invitations | `invitation.view`, `invitation.create`, `invitation.update` |
| Inventory | `inventory.view`, `inventory.create`, `inventory.update`, `inventory.delete`, `inventory.import` |
| Borrowings | `borrowing.view`, `borrowing.create`, `borrowing.approve`, `borrowing.reject`, `borrowing.return`, `borrowing.markDamaged`, `borrowing.markLost` |
| Reports | `report.view`, `report.export` |
| Audit | `audit.view` |
| Profile | `profile.view`, `profile.update`, `profile.password` |

## Acceptance Criteria

- Every protected backend route uses permission middleware.
- No backend route uses legacy `authorize(...)` for page or action authorization.
- Every protected frontend page is wrapped with `ProtectedRoute` and an explicit permission.
- Navigation items are filtered by permission, not hard-coded role arrays.
- Sensitive UI actions are guarded by permission checks.
- The Access Control page is visible only to users with `accessControl.view`.
- Tenant-scoped controllers still use tenancy helpers after permission checks.
- OpenAPI documents current roles and ACL endpoints.
- `npm --prefix backend run audit:acl` passes.
