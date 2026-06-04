const parseOrigins = (value) => (value || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:5173'),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@example.com',
  INITIAL_SUPERADMIN_EMAIL: process.env.INITIAL_SUPERADMIN_EMAIL,
  INITIAL_SUPERADMIN_PASSWORD: process.env.INITIAL_SUPERADMIN_PASSWORD,
}

if (env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || env.JWT_SECRET === 'change-me')) {
  throw new Error('JWT_SECRET must be configured with a strong value in production')
}

if (env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS && !process.env.FRONTEND_ORIGIN) {
  throw new Error('CORS_ORIGINS or FRONTEND_ORIGIN must be configured in production')
}

module.exports = { env }
