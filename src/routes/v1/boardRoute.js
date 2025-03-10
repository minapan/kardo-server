import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardController } from '~/controllers/boardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { boardValidation } from '~/validations/boardValidation'

const Router = express.Router()

Router.route('/:id')
  .get(authMiddleware.isAuthoried, boardController.getDetails)
  .put(authMiddleware.isAuthoried, boardValidation.update, boardController.update)

Router.route('/supports/moving_card')
  .put(authMiddleware.isAuthoried, boardValidation.moveCardToDiffCol, boardController.moveCardToDiffCol)

Router.route('/')
  .get(authMiddleware.isAuthoried, boardController.getBoards)
  .post(authMiddleware.isAuthoried, boardValidation.createNew, boardController.createNew)

export const boardRoutes = Router
