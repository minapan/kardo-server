import express from 'express'
import { boardController } from '~/controllers/boardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerMiddleware } from '~/middlewares/multerMiddleware'
import { boardValidation } from '~/validations/boardValidation'

const Router = express.Router()

Router.route('/:id')
  .get(authMiddleware.isAuthoried, boardController.getDetails)
  .put(authMiddleware.isAuthoried, boardValidation.update, boardController.update)

Router.route('/supports/moving_card')
  .put(authMiddleware.isAuthoried, boardValidation.moveCardToDiffCol, boardController.moveCardToDiffCol)

Router.route('/supports/upload-cover')
  .post(
    authMiddleware.isAuthoried,
    multerMiddleware.upload.single('boardCover'),
    boardController.uploadCoverImage
  )

Router.route('/')
  .get(authMiddleware.isAuthoried, boardController.getBoards)
  .post(authMiddleware.isAuthoried, boardValidation.createNew, boardController.createNew)

Router.route('/:id')
  .delete(authMiddleware.isAuthoried, boardController.deleteBoard)

export const boardRoutes = Router
