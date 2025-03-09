import express from 'express'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerMiddleware } from '~/middlewares/multerMiddleware'
import { userValidation } from '~/validations/userValidation'

const Router = express.Router()

Router.route('/register')
  .post(userValidation.createNew, userController.createNew)

Router.route('/login')
  .post(userValidation.login, userController.login)

Router.route('/verify')
  .put(userValidation.verifyAccount, userController.verifyAccount)

Router.route('/logout')
  .delete(userController.logout)

Router.route('/refresh-token')
  .get(userController.refreshToken)

Router.route('/update')
  .put(
    authMiddleware.isAuthoried,
    multerMiddleware.upload.single('avatar'),
    userValidation.update,
    userController.update
  )

export const userRoutes = Router
