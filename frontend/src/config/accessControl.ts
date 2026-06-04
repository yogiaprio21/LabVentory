import type { Role, User } from '../types'

export type Permission =
  | 'accessControl.view'
  | 'platform.analytics.view'
  | 'dashboard.view'
  | 'institution.view'
  | 'institution.create'
  | 'institution.update'
  | 'lab.view'
  | 'lab.create'
  | 'lab.update'
  | 'lab.transfer'
  | 'lab.deactivate'
  | 'user.view'
  | 'user.create'
  | 'user.update'
  | 'user.deactivate'
  | 'platformUser.create'
  | 'platformUser.manage'
  | 'invitation.view'
  | 'invitation.create'
  | 'invitation.update'
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.update'
  | 'inventory.delete'
  | 'inventory.import'
  | 'category.view'
  | 'category.create'
  | 'category.update'
  | 'category.delete'
  | 'borrowing.view'
  | 'borrowing.create'
  | 'borrowing.approve'
  | 'borrowing.reject'
  | 'borrowing.return'
  | 'borrowing.markDamaged'
  | 'borrowing.markLost'
  | 'report.view'
  | 'report.export'
  | 'audit.view'
  | 'notification.view'
  | 'notification.update'
  | 'profile.view'
  | 'profile.update'
  | 'profile.password'

export const permissions: Array<{ key: Permission; module: string; action: string; description: string }> = [
  { key: 'accessControl.view', module: 'Platform', action: 'View ACL matrix', description: 'Review the official role and permission matrix.' },
  { key: 'platform.analytics.view', module: 'Platform', action: 'View global analytics', description: 'Open global platform analytics and cross-tenant metrics.' },
  { key: 'dashboard.view', module: 'Dashboard', action: 'View dashboard', description: 'Open role-scoped dashboard summaries.' },
  { key: 'institution.view', module: 'Institutions', action: 'View institutions', description: 'List tenant workspaces.' },
  { key: 'institution.create', module: 'Institutions', action: 'Create institutions', description: 'Create tenant workspaces and optional first admins.' },
  { key: 'institution.update', module: 'Institutions', action: 'Update institutions', description: 'Edit tenant workspace metadata, mode, and status.' },
  { key: 'lab.view', module: 'Labs', action: 'View labs', description: 'List laboratories within the allowed tenant scope.' },
  { key: 'lab.create', module: 'Labs', action: 'Create labs', description: 'Create laboratory workspaces.' },
  { key: 'lab.update', module: 'Labs', action: 'Update labs', description: 'Edit laboratory name, location, or operational metadata.' },
  { key: 'lab.transfer', module: 'Labs', action: 'Transfer labs', description: 'Move a lab and its scoped users/invitations to another institution.' },
  { key: 'lab.deactivate', module: 'Labs', action: 'Deactivate labs', description: 'Deactivate or reactivate laboratory workspaces.' },
  { key: 'user.view', module: 'Users', action: 'View users', description: 'List and inspect user accounts in scope.' },
  { key: 'user.create', module: 'Users', action: 'Create tenant users', description: 'Create users for institution or lab scopes.' },
  { key: 'user.update', module: 'Users', action: 'Update users', description: 'Edit account profile, role, institution, or lab assignment.' },
  { key: 'user.deactivate', module: 'Users', action: 'Deactivate users', description: 'Deactivate or reactivate tenant users.' },
  { key: 'platformUser.create', module: 'Users', action: 'Create platform admins', description: 'Create global platform administrator accounts.' },
  { key: 'platformUser.manage', module: 'Users', action: 'Manage platform admins', description: 'Update or deactivate global platform administrator accounts.' },
  { key: 'invitation.view', module: 'Invitations', action: 'View invitations', description: 'List registration invitations in scope.' },
  { key: 'invitation.create', module: 'Invitations', action: 'Create invitations', description: 'Create invite links bound to institution, lab, role, and optional email.' },
  { key: 'invitation.update', module: 'Invitations', action: 'Update invitations', description: 'Update or revoke invitation status.' },
  { key: 'inventory.view', module: 'Inventory', action: 'View inventory', description: 'Search and inspect inventory items in scope.' },
  { key: 'inventory.create', module: 'Inventory', action: 'Create inventory', description: 'Add new inventory items.' },
  { key: 'inventory.update', module: 'Inventory', action: 'Update inventory', description: 'Edit inventory items and stock metadata.' },
  { key: 'inventory.delete', module: 'Inventory', action: 'Delete inventory', description: 'Remove inventory records.' },
  { key: 'inventory.import', module: 'Inventory', action: 'Import inventory', description: 'Import inventory from CSV.' },
  { key: 'category.view', module: 'Categories', action: 'View categories', description: 'List inventory categories in scope.' },
  { key: 'category.create', module: 'Categories', action: 'Create categories', description: 'Create inventory categories.' },
  { key: 'category.update', module: 'Categories', action: 'Update categories', description: 'Rename inventory categories.' },
  { key: 'category.delete', module: 'Categories', action: 'Delete categories', description: 'Delete inventory categories.' },
  { key: 'borrowing.view', module: 'Borrowings', action: 'View borrowings', description: 'List borrowing records in scope.' },
  { key: 'borrowing.create', module: 'Borrowings', action: 'Create borrowings', description: 'Submit borrowing requests.' },
  { key: 'borrowing.approve', module: 'Borrowings', action: 'Approve borrowings', description: 'Approve pending borrowing requests.' },
  { key: 'borrowing.reject', module: 'Borrowings', action: 'Reject borrowings', description: 'Reject pending borrowing requests.' },
  { key: 'borrowing.return', module: 'Borrowings', action: 'Return borrowings', description: 'Mark approved or late borrowings as returned.' },
  { key: 'borrowing.markDamaged', module: 'Borrowings', action: 'Mark damaged', description: 'Mark borrowed items as damaged.' },
  { key: 'borrowing.markLost', module: 'Borrowings', action: 'Mark lost', description: 'Mark borrowed items as lost.' },
  { key: 'report.view', module: 'Reports', action: 'View reports', description: 'Preview report data in scope.' },
  { key: 'report.export', module: 'Reports', action: 'Export reports', description: 'Download PDF reports.' },
  { key: 'audit.view', module: 'Audit', action: 'View audit logs', description: 'Inspect security and administrative activity.' },
  { key: 'notification.view', module: 'Notifications', action: 'View notifications', description: 'List personal notifications.' },
  { key: 'notification.update', module: 'Notifications', action: 'Update notifications', description: 'Mark personal notifications as read.' },
  { key: 'profile.view', module: 'Profile', action: 'View profile', description: 'Open own profile.' },
  { key: 'profile.update', module: 'Profile', action: 'Update profile', description: 'Edit own profile data.' },
  { key: 'profile.password', module: 'Profile', action: 'Change password', description: 'Change own password.' }
]

const managerPermissions: Permission[] = [
  'dashboard.view',
  'lab.view',
  'inventory.view',
  'inventory.create',
  'inventory.update',
  'inventory.delete',
  'inventory.import',
  'category.view',
  'category.create',
  'category.update',
  'category.delete',
  'borrowing.view',
  'borrowing.create',
  'borrowing.approve',
  'borrowing.reject',
  'borrowing.return',
  'borrowing.markDamaged',
  'borrowing.markLost',
  'report.view',
  'report.export',
  'audit.view',
  'notification.view',
  'notification.update',
  'profile.view',
  'profile.update',
  'profile.password'
]

export const rolePermissions: Record<Role, Permission[]> = {
  platform_admin: [
    'accessControl.view',
    'platform.analytics.view',
    'institution.view',
    'institution.create',
    'institution.update',
    'lab.create',
    'lab.update',
    'lab.transfer',
    'lab.deactivate',
    'user.view',
    'user.create',
    'user.update',
    'user.deactivate',
    'platformUser.create',
    'platformUser.manage',
    'invitation.view',
    'invitation.create',
    'invitation.update',
    ...managerPermissions
  ],
  superadmin: [
    'accessControl.view',
    'platform.analytics.view',
    'institution.view',
    'institution.create',
    'institution.update',
    'lab.create',
    'lab.update',
    'lab.transfer',
    'lab.deactivate',
    'user.view',
    'user.create',
    'user.update',
    'user.deactivate',
    'platformUser.create',
    'platformUser.manage',
    'invitation.view',
    'invitation.create',
    'invitation.update',
    ...managerPermissions
  ],
  institution_admin: [
    'dashboard.view',
    'lab.view',
    'lab.create',
    'lab.update',
    'lab.deactivate',
    'user.view',
    'user.create',
    'user.update',
    'user.deactivate',
    'invitation.view',
    'invitation.create',
    'invitation.update',
    ...managerPermissions
  ],
  lab_admin: managerPermissions,
  admin: managerPermissions,
  student: [
    'dashboard.view',
    'inventory.view',
    'category.view',
    'borrowing.view',
    'borrowing.create',
    'notification.view',
    'notification.update',
    'profile.view',
    'profile.update',
    'profile.password'
  ]
}

export const getRolePermissions = (role?: Role | null) => role ? rolePermissions[role] || [] : []
export const can = (user: Pick<User, 'role'> | null | undefined, permission: Permission) => getRolePermissions(user?.role).includes(permission)
export const canAny = (user: Pick<User, 'role'> | null | undefined, list: Permission[]) => list.some(permission => can(user, permission))

export const defaultPathForUser = (user: Pick<User, 'role'> | null | undefined) => {
  if (can(user, 'platform.analytics.view')) return '/superadmin/analytics'
  if (can(user, 'dashboard.view')) return '/dashboard'
  if (can(user, 'inventory.view')) return '/inventory'
  return '/profile'
}
