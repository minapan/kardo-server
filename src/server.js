/* eslint-disable no-console */
import express from 'express'
import { CLOSE_DB, CONNECT_DB } from './config/mongodb'
import cors from 'cors'
import { APIs_V1 } from './routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions, handleOrigin } from './config/cors'
import { ENV } from './config/environment'
import AsyncExitHook from 'async-exit-hook'
import cookieParser from 'cookie-parser'
import http from 'http'
import socketIo from 'socket.io'
import { boardSocket } from './sockets/boardSocket'
import { CONNECT_REDIS, DISCONNECT_REDIS } from './redis/redis'
import { limiter } from './config/rateLimit'

const START_SERVER = () => {
  const app = express()

  app.use(cookieParser())

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // app.use(cors(corsOptions))
  app.use((req, res, next) => {
    cors(corsOptions(req, res, next))(req, res, next)
  })

  app.use(limiter)

  app.use(express.json()) // Middleware to parse JSON requests

  app.use('/v1', APIs_V1) // Register APIs

  app.use(errorHandlingMiddleware) // Register error handling middleware

  // Socket
  const server = http.createServer(app)
  // const io = socketIo(server, { cors: corsOptions })
  const io = socketIo(server, {
    cors: (req, callback) => {
      return handleOrigin(req, req.headers.origin, callback)
    }
  })
  // io.on('connection', (socket) => { inviteUserToBoardSocket(socket) })
  io.on('connection', socket => {
    // console.log(`Client ${socket.id} connected`)
    boardSocket(socket)
  })

  // Deploy to production or run locally development
  if (ENV.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
      console.log(`Hello Minapan, I am running in production at Port: ${process.env.PORT}`)
    })
  } else {
    server.listen(ENV.APP_PORT, ENV.APP_HOST, () => {
      console.log(`Hello Minapan, I am running in development at http://${ENV.APP_HOST}:${ENV.APP_PORT}/`)
    })
  }

  AsyncExitHook(() => {
    console.log('Goodbye Minapan! I am shutting down...')
    CLOSE_DB()
    DISCONNECT_REDIS()
  })
}

console.log('Connecting to world...')

CONNECT_DB()
  .then(() => console.log('Connected to DB'))
  .then(() => CONNECT_REDIS())
  .then(() => START_SERVER())
  .catch((error) => {
    console.error(error)
    process.exit(0)
  })