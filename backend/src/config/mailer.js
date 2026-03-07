const nodemailer = require('nodemailer')
const { env } = require('./env')

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
})

const sendMail = async (opts) => {
  const from = opts.from || env.MAIL_FROM
  return transporter.sendMail({ ...opts, from })
}

module.exports = { sendMail, transporter }
