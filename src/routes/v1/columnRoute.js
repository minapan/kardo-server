import express from 'express'
import { columnController } from '~/controllers/columnController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { columnValidation } from '~/validations/columnValidation'

const Router = express.Router()

Router.route('/')
  .post(authMiddleware.isAuthoried, columnValidation.createNew, columnController.createNew)

Router.route('/:id')
  .put(authMiddleware.isAuthoried, columnValidation.update, columnController.update)
  .delete(authMiddleware.isAuthoried, columnValidation.deleteItem, columnController.deleteItem)

export const columnRoutes = Router