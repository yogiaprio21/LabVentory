import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../hooks/useApi'
import { permissions as fallbackPermissions, rolePermissions as fallbackRolePermissions, type Permission } from '../../config/accessControl'
import type { Role } from '../../types'
import { roleLabel } from '../../utils/roles'
import TableSkeleton from '../../components/TableSkeleton'
import { EmptyState, Field, Icon, PageHeader, SelectField, StatusBadge } from '../../components/ui'

type PermissionRow = {
  key: Permission
  module: string
  action: string
  description: string
}

type MatrixResponse = {
  roles: Role[]
  permissions: PermissionRow[]
  rolePermissions: Record<Role, Permission[]>
}

const fallbackMatrix: MatrixResponse = {
  roles: Object.keys(fallbackRolePermissions) as Role[],
  permissions: fallbackPermissions,
  rolePermissions: fallbackRolePermissions
}

const isMatrixResponse = (value: any): value is MatrixResponse => (
  value &&
  Array.isArray(value.roles) &&
  Array.isArray(value.permissions) &&
  value.rolePermissions &&
  typeof value.rolePermissions === 'object'
)

export default function AccessControl() {
  const [matrix, setMatrix] = useState<MatrixResponse>(fallbackMatrix)
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await api.get('/acl/matrix')
        if (!isMatrixResponse(res.data)) throw new Error('Invalid ACL matrix response')
        setMatrix(res.data)
      } catch (e: any) {
        toast.error(e?.response?.data?.error || 'Using local ACL matrix fallback')
        setMatrix(fallbackMatrix)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const modules = useMemo(() => Array.from(new Set(matrix.permissions.map(permission => permission.module))).sort(), [matrix.permissions])
  const filteredPermissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return matrix.permissions.filter(permission => {
      const matchesModule = moduleFilter === 'all' || permission.module === moduleFilter
      const matchesSearch = !normalizedSearch || [permission.key, permission.module, permission.action, permission.description].some(value => value.toLowerCase().includes(normalizedSearch))
      return matchesModule && matchesSearch
    })
  }, [matrix.permissions, moduleFilter, search])

  const roleHasPermission = (role: Role, permission: Permission) => matrix.rolePermissions[role]?.includes(permission)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control"
        description="Review the official ACL matrix that defines page access and allowed actions for each role."
        actions={<StatusBadge tone="purple">{matrix.permissions.length} permissions</StatusBadge>}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {matrix.roles.map(role => (
          <div key={role} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold capitalize text-slate-950">{roleLabel(role)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{matrix.rolePermissions[role]?.length || 0} active permissions</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Icon name={role.includes('platform') || role === 'superadmin' ? 'shield' : role === 'student' ? 'user' : 'users'} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_16rem]">
          <Field icon="search" placeholder="Search permission, module, or action..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search access control permissions" />
          <SelectField value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} aria-label="Filter permission module">
            <option value="all">All Modules</option>
            {modules.map(module => <option key={module} value={module}>{module}</option>)}
          </SelectField>
        </div>
      </section>

      <section className="table-shell">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={10} cols={matrix.roles.length + 2} />
          ) : filteredPermissions.length === 0 ? (
            <EmptyState title="No permission found" description="Try a different module or search keyword." icon="shield" />
          ) : (
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-6 py-4">Permission</th>
                  <th className="px-6 py-4">Module</th>
                  {matrix.roles.map(role => <th key={role} className="px-4 py-4 text-center capitalize">{roleLabel(role)}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPermissions.map(permission => (
                  <tr key={permission.key} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-bold text-indigo-700">{permission.key}</p>
                      <p className="mt-1 font-bold text-slate-900">{permission.action}</p>
                      <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-slate-500">{permission.description}</p>
                    </td>
                    <td className="px-6 py-4"><StatusBadge tone="slate">{permission.module}</StatusBadge></td>
                    {matrix.roles.map(role => (
                      <td key={`${permission.key}-${role}`} className="px-4 py-4 text-center">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${roleHasPermission(role, permission.key) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                          <Icon name={roleHasPermission(role, permission.key) ? 'check' : 'x'} className="h-4 w-4" strokeWidth={2.4} />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
