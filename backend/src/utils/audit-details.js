const isPresent = (value) => value !== undefined

const compactObject = (value) => Object.fromEntries(
  Object.entries(value || {}).filter(([, entry]) => isPresent(entry))
)

const buildChanges = (before, after, fields) => fields
  .filter(field => isPresent(after[field]) && before[field] !== after[field])
  .map(field => ({ field, old: before[field] ?? null, new: after[field] ?? null }))

const auditDetails = ({ summary, attributes, changes, metadata }) => compactObject({
  summary,
  attributes: Array.isArray(attributes)
    ? attributes.filter(entry => entry && isPresent(entry.value))
    : undefined,
  changes: Array.isArray(changes)
    ? changes.filter(entry => entry && entry.field && (entry.old !== entry.new))
    : undefined,
  metadata: metadata ? compactObject(metadata) : undefined
})

module.exports = { auditDetails, buildChanges, compactObject }
