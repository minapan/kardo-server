import express from 'express'
import { authLimiter } from '~/config/rateLimit'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerMiddleware } from '~/middlewares/multerMiddleware'
import { userValidation } from '~/validations/userValidation'

const Router = express.Router()

Router.route('/register')
  .post(authLimiter, userValidation.createNew, userController.createNew)

Router.route('/login')
  .post(authLimiter, userValidation.login, userController.login)

Router.route('/verify')
  .put(userValidation.verifyAccount, userController.verifyAccount)

Router.route('/logout')
  .put(authMiddleware.isAuthoried, userController.logout)

Router.route('/logged-out')
  .put(userController.logout)

Router.route('/refresh-token')
  .get(userController.refreshToken)

Router.route('/forgot-password')
  .post(authLimiter, userController.forgotPassword)

Router.route('/reset-password')
  .put(userValidation.resetPassword, userController.resetPassword)

Router.route('/delete-account')
  .put(authMiddleware.isAuthoried, userController.deleteAccount)

Router.route('/google')
  .get(userController.googleLogin)
Router.route('/google/callback')
  .get(userController.googleCallback)
Router.route('/get-user')
  .get(authMiddleware.isAuthoried, userController.getUser)

Router.route('/update')
  .put(
    authMiddleware.isAuthoried,
    multerMiddleware.upload.single('avatar'),
    userValidation.update,
    userController.update
  )

Router.route('/get_2fa_qr_code')
  .get(authMiddleware.isAuthoried, userController.get2FaQrCode)

Router.route('/setup_2fa')
  .post(authMiddleware.isAuthoried, userController.setup2FA)

Router.route('/verify_2fa')
  .put(authMiddleware.isAuthoried, userController.verify2FA)

export const userRoutes = Router
