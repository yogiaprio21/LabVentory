export type AuditDetailRow = {
  label: string
  value?: string
  oldValue?: string
  newValue?: string
  type: 'attribute' | 'change' | 'message' | 'metadata'
}

export type FormattedAuditDetails = {
  summary: string
  rows: AuditDetailRow[]
  rawJson: string
  hasDetails: boolean
}

const FIELD_LABELS: Record<string, string> = {
  adminUserId: 'First admin user ID',
  availableStock: 'Available stock',
  categoryId: 'Category ID',
  condition: 'Condition',
  domain: 'Domain',
  email: 'Email',
  expiresAt: 'Expires at',
  hasLab: 'Has assigned lab',
  institutionId: 'Institution',
  invite: 'Invite registration',
  inviteeEmail: 'Invitee email',
  labId: 'Lab',
  location: 'Location',
  maxUses: 'Maximum uses',
  minStock: 'Minimum stock',
  name: 'Name',
  passwordUpdated: 'Password updated',
  previousInstitutionId: 'Previous institution',
  reason: 'Reason',
  registrationMode: 'Registration mode',
  role: 'Role',
  slug: 'Slug',
  status: 'Status',
  totalStock: 'Total stock'
}

const titleize = (value: string) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^./, char => char.toUpperCase())

export const labelForAuditField = (field: string) => FIELD_LABELS[field] || titleize(field)

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isChangeRecord = (value: unknown): value is { old: unknown; new: unknown } => (
  isRecord(value) && ('old' in value || 'new' in value)
)

const isEmptyValue = (value: unknown) => value === undefined || value === null || value === ''

export const formatAuditValue = (value: unknown): string => {
  if (isEmptyValue(value)) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    const timestamp = Date.parse(value)
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(timestamp)) {
      return new Date(value).toLocaleString()
    }
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const stringifyRaw = (details: unknown) => {
  if (details === undefined || details === null || details === '') return ''
  if (typeof details === 'string') return details
  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
}

const rowsFromAttributes = (attributes: unknown): AuditDetailRow[] => {
  if (!Array.isArray(attributes)) return []
  return attributes
    .filter(isRecord)
    .map(entry => ({
      type: 'attribute' as const,
      label: formatAuditValue(entry.label || entry.field || 'Detail'),
      value: formatAuditValue(entry.value)
    }))
}

const rowsFromChanges = (changes: unknown): AuditDetailRow[] => {
  if (Array.isArray(changes)) {
    return changes
      .filter(isRecord)
      .map(entry => ({
        type: 'change' as const,
        label: labelForAuditField(formatAuditValue(entry.field || entry.label || 'Field')),
        oldValue: formatAuditValue(entry.old),
        newValue: formatAuditValue(entry.new)
      }))
  }

  if (isRecord(changes)) {
    const rows: AuditDetailRow[] = []
    for (const [field, value] of Object.entries(changes)) {
      if (!isChangeRecord(value)) continue
      rows.push({
        type: 'change' as const,
        label: labelForAuditField(field),
        oldValue: formatAuditValue(value.old),
        newValue: formatAuditValue(value.new)
      })
    }
    return rows
  }

  return []
}

const rowsFromMetadata = (metadata: unknown): AuditDetailRow[] => {
  if (!isRecord(metadata)) return []
  return Object.entries(metadata).map(([field, value]) => ({
    type: 'metadata' as const,
    label: labelForAuditField(field),
    value: formatAuditValue(value)
  }))
}

const rowsFromLegacyObject = (details: Record<string, unknown>): AuditDetailRow[] => {
  const rows: AuditDetailRow[] = []
  for (const [field, value] of Object.entries(details)) {
    if (['summary', 'attributes', 'changes', 'metadata'].includes(field)) continue
    if (isChangeRecord(value)) {
      rows.push({
        type: 'change' as const,
        label: labelForAuditField(field),
        oldValue: formatAuditValue(value.old),
        newValue: formatAuditValue(value.new)
      })
      continue
    }
    rows.push({
      type: field === 'message' ? 'message' as const : 'attribute' as const,
      label: labelForAuditField(field),
      value: formatAuditValue(value)
    })
  }
  return rows
}

export const formatAuditDetails = (details: unknown): FormattedAuditDetails => {
  const rawJson = stringifyRaw(details)
  if (isEmptyValue(details)) {
    return { summary: 'No details recorded', rows: [], rawJson, hasDetails: false }
  }

  if (typeof details === 'string') {
    return {
      summary: details,
      rows: [{ type: 'message', label: 'Message', value: details }],
      rawJson,
      hasDetails: true
    }
  }

  if (Array.isArray(details)) {
    const rows = details.map((value, index) => ({
      type: 'attribute' as const,
      label: `Item ${index + 1}`,
      value: formatAuditValue(value)
    }))
    return { summary: `${rows.length} detail item${rows.length === 1 ? '' : 's'}`, rows, rawJson, hasDetails: rows.length > 0 }
  }

  if (!isRecord(details)) {
    const value = formatAuditValue(details)
    return {
      summary: value,
      rows: [{ type: 'message', label: 'Value', value }],
      rawJson,
      hasDetails: true
    }
  }

  const structuredRows = [
    ...rowsFromChanges(details.changes),
    ...rowsFromAttributes(details.attributes),
    ...rowsFromMetadata(details.metadata)
  ]
  const legacyRows = rowsFromLegacyObject(details)
  const rows = structuredRows.length ? structuredRows : legacyRows
  const explicitSummary = typeof details.summary === 'string'
    ? details.summary
    : typeof details.message === 'string'
      ? details.message
      : ''
  const summary = explicitSummary || (rows.length
    ? `${rows.length} audit detail${rows.length === 1 ? '' : 's'}`
    : 'No details recorded')

  return { summary, rows, rawJson, hasDetails: rows.length > 0 || !!explicitSummary }
}
