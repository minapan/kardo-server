import express from 'express'
import { invitationController } from '~/controllers/invitationController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { invitationValidation } from '~/validations/invitationValidation'

const Router = express.Router()

Router.route('/board')
  .post(authMiddleware.isAuthoried, invitationValidation.createNew, invitationController.createNew)

export const invitationRoute = Router