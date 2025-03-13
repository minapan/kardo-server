import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoutes } from './boardRoute'
import { columnRoutes } from './columnRoute'
import { cardRoutes } from './cardRoute'
import { userRoutes } from './userRoute'
import { invitationRoute } from './invitationRoute'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use' })
})

Router.use('/users', userRoutes)
Router.use('/invitations', invitationRoute)
Router.use('/boards', boardRoutes)
Router.use('/columns', columnRoutes)
Router.use('/cards', cardRoutes)

export const APIs_V1 = Router