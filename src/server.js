/* eslint-disable no-console */
import express from 'express'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import cors from 'cors'
import { APIs_V1 } from './routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import { ENV } from './config/environment'
import AsyncExitHook from 'async-exit-hook'
import cookieParser from 'cookie-parser'
import http from 'http'
import socketIo from 'socket.io'
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'

const START_SERVER = () => {
  const app = express()

  app.use(cookieParser())

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.use(cors(corsOptions))

  app.use(express.json()) // Middleware to parse JSON requests

  app.use('/v1', APIs_V1) // Register APIs

  app.use(errorHandlingMiddleware) // Register error handling middleware

  // Socket
  const sever = http.createServer(app)
  const io = socketIo(sever, { cors: corsOptions })
  io.on('connection', (socket) => { inviteUserToBoardSocket(socket) })

  // Deploy to production or run locally development
  if (ENV.BUILD_MODE === 'production') {
    sever.listen(process.env.PORT, () => {
      console.log(`Hello Minapan, I am running in production at Port: ${process.env.PORT}`)
    })
  } else {
    sever.listen(ENV.APP_PORT, ENV.APP_HOST, () => {
      console.log(`Hello Minapan, I am running in development at http://${ENV.APP_HOST}:${ENV.APP_PORT}/`)
    })
  }

  AsyncExitHook(() => {
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