import express from 'express'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerMiddleware } from '~/middlewares/multerMiddleware'
import { cardValidation } from '~/validations/cardValidation'

const Router = express.Router()

Router.route('/')
  .post(authMiddleware.isAuthoried, cardValidation.createNew, cardController.createNew)

Router.route('/:id')
  .put(
    authMiddleware.isAuthoried,
    multerMiddleware.upload.single('cardCover'),
    cardValidation.update,
    cardController.update
  )

Router.route('/summarize')
  .post(authMiddleware.isAuthoried, cardController.summarize)

export const cardRoutes = Router