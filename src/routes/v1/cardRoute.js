import express from 'express'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { cardValidation } from '~/validations/cardValidation'

const Router = express.Router()

Router.route('/')
  .post(authMiddleware.isAuthoried, cardValidation.createNew, cardController.createNew)

export const cardRoutes = Router