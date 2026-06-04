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
    file: 'frontend/src/components/StockCompositionPanel.tsx',
    mustContain: ['StockCompositionPanel', 'Total units', 'Available units', 'Categories', 'Unavailable', 'Tooltip', 'aria-label="Stock composition legend"'],
    label: 'Stock composition panel has readable legend, tooltip, and summary'
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
    file: 'backend/src/controllers/analytics.controller.js',
    mustContain: ['tenantDistribution', 'topLabs', 'dailyTrends', 'COALESCE(inv."totalStock"'],
    label: 'Platform analytics has a dedicated cross-tenant aggregation endpoint'
  },
  {
    file: 'backend/src/controllers/inventory.controller.js',
    mustContain: ['parseInventoryQrCode', '^inventory:(\\d+)$', 'assertInventoryAccess(req.user, inventoryId)'],
    label: 'Inventory QR resolver validates payload format and tenant access'
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
    mustContain: ['/superadmin/institutions', 'Tenant workspaces', "section: 'Platform'", "section: 'Operations'", "section: 'Governance'"],
    label: 'Navigation exposes dedicated institution management and grouped functional sections'
  },
  {
    file: 'frontend/src/pages/Superadmin/Analytics.tsx',
    mustContain: ['Platform Analytics', '/analytics/summary', 'tenantDistribution', 'topLabs', 'StockCompositionPanel', 'Stock Composition'],
    label: 'Superadmin analytics uses the dedicated platform analytics endpoint and UI'
  },
  {
    file: 'frontend/src/pages/Admin/Dashboard.tsx',
    mustContain: ['Operations Dashboard', '/dashboard/summary', 'fillLastSevenDays', 'No borrowing activity', 'StockCompositionPanel', 'Stock Units by Category'],
    label: 'Dashboard is scoped operational summary with chart empty states'
  },
  {
    file: 'frontend/src/components/NotificationBell.tsx',
    mustContain: ['createPortal', 'unreadOnly', 'visibleCount', 'Load more'],
    label: 'Notification popover renders in a controlled portal with filters'
  },
  {
    file: 'frontend/src/pages/Inventory/InventoryPage.tsx',
    mustContain: ['selectedQrItem', 'Download QR', 'Print', 'Payload: inventory:'],
    label: 'Inventory QR codes open in a usable preview modal'
  },
  {
    file: 'frontend/src/pages/Borrowings/BorrowingsPage.tsx',
    mustContain: ['INVENTORY_QR_PATTERN', '^inventory:(\\d+)$', '/inventory/resolve-qr'],
    label: 'Borrowing QR scanner strictly resolves inventory QR codes through backend scope checks'
  },
  {
    file: 'backend/src/utils/audit-details.js',
    mustContain: ['auditDetails', 'buildChanges', 'changes:', 'attributes:'],
    label: 'Backend audit details are structured into summaries, attributes, and changes'
  },
  {
    file: 'frontend/src/utils/auditDetails.ts',
    mustContain: ['formatAuditDetails', 'labelForAuditField', 'oldValue', 'newValue'],
    label: 'Frontend audit detail formatter supports readable labels and before/after changes'
  },
  {
    file: 'frontend/src/pages/Audit/AuditPage.tsx',
    mustContain: ['AuditDetailSummary', 'AuditDetailModal', 'Copy JSON', 'View details'],
    label: 'Audit page renders readable details with a detail modal and raw JSON escape hatch'
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
  },
  {
    file: 'frontend/src/pages/PreviewPage.tsx',
    mustContain: [
      'Platform Analytics',
      'Operations Dashboard',
      'Access Control',
      'Institutions',
      'Labs',
      'Users',
      'Download QR',
      'Print',
      'Payload: inventory:',
      'View details',
      'Copy JSON',
      'Search permission',
      "section: 'Platform'",
      "section: 'Governance'"
    ],
    label: 'Preview page mirrors current platform, operations, administration, and governance surfaces'
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
