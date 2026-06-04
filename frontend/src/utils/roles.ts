import type { Role, User } from '../types'

export const platformRoles: Role[] = ['platform_admin', 'superadmin']
export const institutionAdminRoles: Role[] = ['institution_admin']
export const labAdminRoles: Role[] = ['lab_admin', 'admin']

export const isPlatformAdmin = (user?: Pick<User, 'role'> | null) => !!user && platformRoles.includes(user.role)
export const isInstitutionAdmin = (user?: Pick<User, 'role'> | null) => !!user && institutionAdminRoles.includes(user.role)
export const isLabAdmin = (user?: Pick<User, 'role'> | null) => !!user && labAdminRoles.includes(user.role)
export const canManageUsers = (user?: Pick<User, 'role'> | null) => isPlatformAdmin(user) || isInstitutionAdmin(user)
export const canManageLabs = (user?: Pick<User, 'role'> | null) => isPlatformAdmin(user) || isInstitutionAdmin(user)
export const canManageInventory = (user?: Pick<User, 'role'> | null) => isPlatformAdmin(user) || isInstitutionAdmin(user) || isLabAdmin(user)
export const roleLabel = (role?: Role) => (role || '').replace(/_/g, ' ')
