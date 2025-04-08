import express from 'express'
import { sessionController } from '~/controllers/sessionController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/')
  .get(authMiddleware.isAuthoried, sessionController.getSessions)

Router.route('/:id')
  .delete(authMiddleware.isAuthoried, sessionController.deleteSession)

Router.route('/clear')
  .put(authMiddleware.isAuthoried, sessionController.clearSessions)

Router.route('/set-max-sessions')
  .put(authMiddleware.isAuthoried, sessionController.setMaxSessions)

export const sessionRoutes = Router