require('dotenv').config()
const app = require('./app')
const { env } = require('./config/env')
const { startDailyJobs } = require('./jobs/daily')

const port = env.PORT
app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})
startDailyJobs()
