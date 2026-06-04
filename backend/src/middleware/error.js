const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Not Found' })
}

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const isProduction = process.env.NODE_ENV === 'production'
  const message = status >= 500 && isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error')
  const payload = { error: message }
  if (!isProduction && err.details) payload.details = err.details
  res.status(status).json(payload)
}

module.exports = { errorHandler, notFound }
