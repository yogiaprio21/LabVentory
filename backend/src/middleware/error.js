const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Not Found' })
}

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  const details = err.details
  res.status(status).json({ error: message, details })
}

module.exports = { errorHandler, notFound }
