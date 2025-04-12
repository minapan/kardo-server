import { StatusCodes } from 'http-status-codes'
import { sessionService } from '~/services/sessionService'

const getSessions = async (req, res, next) => {
  try {
    const result = await sessionService.getSessions(req.jwtDecoded._id, req.jwtDecoded.session_id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const deleteSession = async (req, res, next) => {
  try {
    const isDeletedMySelf = await sessionService.deleteSession(req.params.id, req.jwtDecoded._id, req.jwtDecoded.session_id)

    res.status(StatusCodes.OK).json({ deleted: true, isDeletedMySelf })
  } catch (error) { next(error) }
}

const clearSessions = async (req, res, next) => {
  try {
    const result = await sessionService.clearSessions(req.jwtDecoded._id, req.jwtDecoded.session_id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const setMaxSessions = async (req, res, next) => {
  try {
    const result = await sessionService.setMaxSessions(req.jwtDecoded._id, req.body.max_sessions, req.jwtDecoded.session_id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const sessionController = {
  getSessions,
  deleteSession,
  clearSessions,
  setMaxSessions
}