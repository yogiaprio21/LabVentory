const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')
const checks = [
  {
    file: 'backend/src/controllers/borrowings.controller.js',
    mustContain: ['requestBorrow({ actor: req.user', 'approveBorrow(id, req.user)', 'rejectBorrow(id, req.user)', 'returnBorrow(id, req.user)'],
    label: 'Borrowing controller passes actor into service layer'
  },
  {
    file: 'backend/src/controllers/auth.controller.js',
    mustContain: ['inviteCode', 'tx.invitation.findUnique', 'tx.invitation.updateMany', 'registrationMode: \'public\''],
    label: 'Registration supports atomic invitation use and public-mode fallback'
  },
  {
    file: 'backend/src/controllers/import.controller.js',
    mustContain: ['prisma.$transaction', 'normalizedRows', 'Successfully imported'],
    label: 'CSV import validates rows before atomic write'
  },
  {
    file: 'backend/src/utils/tenancy.js',
    mustContain: ['assertInventoryAccessWithClient', 'assertBorrowingAccessWithClient', 'assertInstitutionAccess'],
    label: 'Tenant helpers expose service-layer assertions'
  },
  {
    file: 'frontend/src/pages/PreviewPage.tsx',
    mustContain: ['useSearchParams', 'setActiveTab', 'aria-label="Preview sections"'],
    label: 'Preview page has URL-backed interactive navigation'
  },
  {
    file: 'backend/src/controllers/users.controller.js',
    mustContain: ['status: true', 'action: \'deactivate\'', 'Resolve active borrowings before deactivating this user'],
    label: 'User removal is soft-deactivate with active borrowing guard'
  },
  {
    file: 'backend/src/controllers/labs.controller.js',
    mustContain: ['status: \'inactive\'', 'Resolve active borrowings before deactivating this laboratory'],
    label: 'Lab removal is soft-deactivate with active borrowing guard'
  },
  {
    file: 'backend/src/app.js',
    mustContain: ['inviteResolveLimiter', '/api/invitations/resolve'],
    label: 'Public invitation resolver has a dedicated rate limiter'
  },
  {
    file: 'backend/src/controllers/dashboard.controller.js',
    mustContain: ['prisma.$queryRaw', 'date_trunc', 'COALESCE(SUM'],
    label: 'Dashboard uses database aggregation instead of full-table in-memory aggregation'
  },
  {
    file: 'backend/src/services/borrowing.service.js',
    mustContain: ['availableStock: { gte: b.quantity }', 'dedupeKey', 'createNotificationOnce'],
    label: 'Borrowing stock updates and reminders use atomic and deduped operations'
  },
  {
    file: 'backend/src/config/env.js',
    mustContain: ['CORS_ORIGINS or FRONTEND_ORIGIN must be configured in production'],
    label: 'Production CORS configuration fails fast when origin allowlist is missing'
  },
  {
    file: 'backend/prisma/schema.prisma',
    mustContain: ['status    String        @default("active")', 'dedupeKey String?', '@@unique([userId, dedupeKey])', 'inviteeEmail String?'],
    label: 'Schema supports soft status, notification dedupe keys, and invitee email binding'
  },
  {
    file: 'backend/src/controllers/invitations.controller.js',
    mustContain: ['inviteeEmail', 'lab?.institutionId', 'req.query.institutionId'],
    label: 'Invitations are tenant-aware, filterable, and can infer institution from selected lab'
  },
  {
    file: 'backend/src/controllers/auth.controller.js',
    mustContain: ['Invitation email does not match this account', 'assertInstitutionAccess(req.user, targetInstitutionId)'],
    label: 'Registration and admin user creation validate invite email and institution scope'
  },
  {
    file: 'backend/src/controllers/users.controller.js',
    mustContain: ['req.query.scope === \'platform\'', 'req.query.institutionId', 'notIn: PLATFORM_USER_ROLES'],
    label: 'User listing supports platform-admin and institution tenant filters'
  },
  {
    file: 'backend/src/controllers/labs.controller.js',
    mustContain: ['req.query.institutionId', 'scopedLabWhere(req.user, extra)', 'previousInstitutionId', 'tx.invitation.updateMany'],
    label: 'Lab listing supports platform institution filters and platform-safe lab transfers'
  },
  {
    file: 'backend/src/routes/labs.routes.js',
    mustContain: ['institutionId: z.number().int().optional()'],
    label: 'Lab update route accepts institution transfer payload'
  },
  {
    file: 'frontend/src/pages/Superadmin/Labs.tsx',
    mustContain: ['institutionId: platform && institutionId ? Number(institutionId) : undefined', 'Changing institution transfers this lab'],
    label: 'Labs page sends institutionId when editing a lab and explains transfer impact'
  },
  {
    file: 'frontend/src/pages/Superadmin/Institutions.tsx',
    mustContain: ['New tenant workspace', 'First admin email', 'Registration mode'],
    label: 'Dedicated Institutions page exists for platform tenant onboarding'
  },
  {
    file: 'frontend/src/pages/Superadmin/Users.tsx',
    mustContain: ['Institution context', 'Platform admins', 'institutionId: platform ? Number(selectedInstitutionId) : undefined', 'inviteeEmail'],
    label: 'Users page separates tenant users, platform admins, institution context, and invitation email binding'
  },
  {
    file: 'frontend/src/components/Layout.tsx',
    mustContain: ['/superadmin/institutions', 'Tenant workspaces'],
    label: 'Navigation exposes dedicated institution management'
  },
  {
    file: 'frontend/src/pages/Register.tsx',
    mustContain: ['inviteRequiresLab', '/invitations/resolve/', 'Institution-level account'],
    label: 'Register page resolves invitation context and role-specific lab requirements'
  },
  {
    file: 'backend/src/config/access-control.js',
    mustContain: ['ROLE_PERMISSIONS', 'lab.transfer', 'platformUser.create', 'accessControl.view'],
    label: 'Backend has a central ACL permission registry'
  },
  {
    file: 'backend/src/middleware/auth.js',
    mustContain: ['requirePermission', 'requireAnyPermission', 'requireBodyPermission'],
    label: 'Backend exposes permission-based ACL middleware'
  },
  {
    file: 'frontend/src/components/ProtectedRoute.tsx',
    mustContain: ['permission?: Permission', 'Access denied', 'can(user, permission)'],
    label: 'Frontend protected routes enforce page permissions'
  },
  {
    file: 'frontend/src/pages/Superadmin/AccessControl.tsx',
    mustContain: ['/acl/matrix', 'rolePermissions', 'Search permission'],
    label: 'Access Control page renders role-permission matrix from backend ACL'
  }
]

const failures = []
for (const check of checks) {
  const abs = path.join(root, check.file)
  const content = fs.readFileSync(abs, 'utf8')
  const missing = check.mustContain.filter(token => !content.includes(token))
  if (missing.length) failures.push({ ...check, missing })
}

if (failures.length) {
  console.error('Tenant audit failed:')
  for (const failure of failures) {
    console.error(`- ${failure.label}: missing ${failure.missing.join(', ')}`)
  }
  process.exit(1)
}

console.log(`Tenant audit passed (${checks.length} checks).`)
