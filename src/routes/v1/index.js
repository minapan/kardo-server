import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoutes } from './boardRoute'
import { columnRoutes } from './columnRoute'
import { cardRoutes } from './cardRoute'
import { userRoutes } from './userRoute'
import { invitationRoutes } from './invitationRoute'
import { getRandomItem } from '~/utils/formatters'
import { quotes } from '~/utils/quotes'
import { sessionRoutes } from './sessionRoute'

const Router = express.Router()

Router.get('/', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use' })
})

Router.get('/status', (req, res) => {
  const timestamp = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date())
  const quote = getRandomItem(quotes)

  process.stdout.write(`\n[PING ${timestamp}] - "${quote}"\n`)
  res.status(StatusCodes.OK).json({ content: quote, timestamp })
})

Router.get('/server-time', (req, res) => {
  const serverTimestamp = Date.now()
  res.status(200).json({ serverTime: serverTimestamp })
})

Router.use('/users', userRoutes)
Router.use('/invitations', invitationRoutes)
Router.use('/boards', boardRoutes)
Router.use('/columns', columnRoutes)
Router.use('/cards', cardRoutes)
Router.use('/sessions', sessionRoutes)

export const APIs_V1 = Router