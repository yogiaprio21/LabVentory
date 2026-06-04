const fs = require('fs')
const path = require('path')
const { PERMISSION_KEYS } = require('../src/config/access-control')

const root = path.resolve(__dirname, '..', '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const failures = []
const fail = (label, detail) => failures.push(`${label}: ${detail}`)

const frontendAcl = read('frontend/src/config/accessControl.ts')
for (const permission of PERMISSION_KEYS) {
  if (!frontendAcl.includes(`'${permission}'`)) {
    fail('Frontend ACL mirror', `missing ${permission}`)
  }
}

const routeDir = path.join(root, 'backend/src/routes')
for (const file of fs.readdirSync(routeDir).filter(file => file.endsWith('.routes.js'))) {
  const rel = `backend/src/routes/${file}`
  const content = read(rel)
  if (content.includes('authorize(')) fail('Legacy route authorization', `${rel} still uses authorize()`)
  if (content.includes('authenticate') && !content.includes('requirePermission') && !content.includes('requireAnyPermission')) {
    fail('Protected route permission', `${rel} authenticates requests without ACL middleware`)
  }
}

const expectedRoutePermissions = [
  ['frontend route /dashboard', 'permission="dashboard.view"'],
  ['frontend route /inventory', 'permission="inventory.view"'],
  ['frontend route /borrowings', 'permission="borrowing.view"'],
  ['frontend route /reports', 'permission="report.view"'],
  ['frontend route /audit', 'permission="audit.view"'],
  ['frontend route /profile', 'permission="profile.view"'],
  ['frontend route analytics', 'permission="platform.analytics.view"'],
  ['frontend route institutions', 'permission="institution.view"'],
  ['frontend route labs', 'permission="lab.view"'],
  ['frontend route users', 'permission="user.view"'],
  ['frontend route access control', 'permission="accessControl.view"']
]

const app = read('frontend/src/App.tsx')
for (const [label, token] of expectedRoutePermissions) {
  if (!app.includes(token)) fail('Frontend route guard', `${label} missing ${token}`)
}

const layout = read('frontend/src/components/Layout.tsx')
if (layout.includes('roles:')) fail('Frontend navigation', 'Layout still contains role-based navigation entries')
if (!layout.includes('/superadmin/access-control')) fail('Frontend navigation', 'Access Control page is not linked in navigation')
if (!layout.includes("section: 'Platform'") || !layout.includes("section: 'Operations'")) {
  fail('Frontend navigation', 'Layout navigation is not grouped by functional section')
}

const analyticsPage = read('frontend/src/pages/Superadmin/Analytics.tsx')
if (analyticsPage.includes("import Dashboard from '../Admin/Dashboard'")) {
  fail('Frontend analytics', 'Superadmin Analytics still aliases Admin Dashboard')
}
if (!analyticsPage.includes('/analytics/summary')) fail('Frontend analytics', 'Superadmin Analytics does not call /analytics/summary')

const auditPage = read('frontend/src/pages/Audit/AuditPage.tsx')
if (auditPage.includes('JSON.stringify')) fail('Frontend audit details', 'AuditPage renders raw JSON directly instead of using formatter')
if (!auditPage.includes('formatAuditDetails')) fail('Frontend audit details', 'AuditPage does not use the audit detail formatter')
if (!auditPage.includes('Copy JSON')) fail('Frontend audit details', 'AuditPage is missing a raw JSON copy option for admins')

const previewPage = read('frontend/src/pages/PreviewPage.tsx')
for (const token of ['Platform Analytics', 'Operations Dashboard', 'Access Control', 'Download QR', 'Copy JSON', 'Search permission']) {
  if (!previewPage.includes(token)) fail('Frontend preview sync', `PreviewPage missing ${token}`)
}
if (!previewPage.includes("section: 'Platform'") || !previewPage.includes("section: 'Governance'")) {
  fail('Frontend preview navigation', 'PreviewPage is not grouped by current functional navigation sections')
}

const sensitiveUiChecks = [
  ['frontend/src/pages/Inventory/InventoryPage.tsx', ['inventory.create', 'inventory.update', 'inventory.delete', 'report.export']],
  ['frontend/src/pages/Borrowings/BorrowingsPage.tsx', ['borrowing.approve', 'borrowing.reject', 'borrowing.return', 'borrowing.markDamaged', 'borrowing.markLost']],
  ['frontend/src/pages/Superadmin/Labs.tsx', ['lab.create', 'lab.update', 'lab.transfer', 'lab.deactivate']],
  ['frontend/src/pages/Superadmin/Users.tsx', ['user.create', 'user.update', 'user.deactivate', 'platformUser.create', 'invitation.create']],
  ['frontend/src/pages/Superadmin/Institutions.tsx', ['institution.create', 'institution.update']]
]

for (const [file, tokens] of sensitiveUiChecks) {
  const content = read(file)
  for (const token of tokens) {
    if (!content.includes(`'${token}'`)) fail('Frontend action guard', `${file} missing ${token}`)
  }
}

const openApi = read('backend/src/docs/openapi.json')
for (const role of ['platform_admin', 'institution_admin', 'lab_admin', 'admin', 'student', 'superadmin']) {
  if (!openApi.includes(role)) fail('OpenAPI roles', `missing ${role}`)
}
if (!openApi.includes('/acl/matrix')) fail('OpenAPI ACL endpoint', 'missing /acl/matrix')
if (!openApi.includes('/analytics/summary')) fail('OpenAPI analytics endpoint', 'missing /analytics/summary')
if (!openApi.includes('/inventory/resolve-qr')) fail('OpenAPI QR endpoint', 'missing /inventory/resolve-qr')

if (failures.length) {
  console.error('ACL audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ACL audit passed (${PERMISSION_KEYS.length} permissions).`)
