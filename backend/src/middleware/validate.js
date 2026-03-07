const validate = (schema) => (req, res, next) => {
  const data = { body: req.body, params: req.params, query: req.query }
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => ({ path: i.path, message: i.message }))
    const e = new Error('Validation error')
    e.status = 400
    e.details = details
    return next(e)
  }
  next()
}

module.exports = { validate }
