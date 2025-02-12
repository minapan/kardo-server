/* eslint-disable no-console */
import express from 'express'
import { CLOSE_DB, CONNECT_DB, GET_DB } from './config/mongodb'
import exitHook from 'async-exit-hook'
import { ENV } from './config/environment'

const START_SERVER = () => {
  const app = express()

  app.get('/', async (req, res) => {
    console.log(await GET_DB().listCollections().toArray())
    res.end('<h1>Hello World!</h1><hr>')
  })

  app.listen(ENV.APP_PORT, ENV.APP_HOST, () => {
    console.log(`Hello Minapan, I am running at http://${ENV.APP_PORT}:${ENV.APP_HOST}/`)
  })

  exitHook(() => {
    console.log('Goodbye Minapan! I am shutting down...')
    CLOSE_DB()
  })
}

console.log('Connecting to DB...')
CONNECT_DB()
  .then(() => console.log('Connected to DB'))
  .then(() => START_SERVER())
  .catch((error) => {
    console.error(error)
    process.exit(0)
  })