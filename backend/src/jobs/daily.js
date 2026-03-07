const cron = require('node-cron')
const { markLateAndDueReminders } = require('../services/borrowing.service')
const { sendMail } = require('../config/mailer')

const startDailyJobs = () => {
  cron.schedule('0 9 * * *', async () => {
    await markLateAndDueReminders(sendMail)
  })
}

module.exports = { startDailyJobs }
