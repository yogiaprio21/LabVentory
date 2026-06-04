require('express-async-errors')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const routes = require('./routes')
const { errorHandler, notFound } = require('./middleware/error')
const { swaggerUi, swaggerSpec } = require('./config/swagger')
const { env } = require('./config/env')

const app = express()

if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
}

app.use(helmet())
app.use(cors({
    origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true)
        return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
}))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('combined'))

// Global limiter — longgar, hanya menghindari abuse besar
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 500,
    message: { error: 'Too many requests, please try again later.' }
})
app.use(globalLimiter)

// Auth limiter — ketat, khusus endpoint login & register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 20,
    message: { error: 'Too many login attempts, please try again in 15 minutes.' }
})

const inviteResolveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many invitation checks, please try again later.' }
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authLimiter)
app.use('/api/invitations/resolve', inviteResolveLimiter)
app.use('/api', routes)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use(notFound)
app.use(errorHandler)

module.exports = app
