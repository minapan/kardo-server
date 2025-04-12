/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { ENV } from '~/config/environment'
import { GET_DB } from '~/config/mongodb'
import { sessionModel } from '~/models/sessionModel'
import { userModel } from '~/models/userModel'
import { MULTI_REDIS, SETEX_REDIS } from '~/redis/redis'
import ApiError from '~/utils/ApiError'

const getSessions = async (userId, sessionId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    const sessions = await sessionModel.getSessions(userId)

    const result = sessions.map((s) => ({
      ...s,
      is_current: s._id.toString() === sessionId
    }))

    return result
  } catch (error) { throw error }
}

const deleteSession = async (id, userId, currSessionId) => {
  try {
    const session = await sessionModel.findOneSessionById(id)
    if (!session) throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found')
    if (session.user_id.toString() !== userId)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are not authorized to delete this session')
    if (session._id.toString() === currSessionId) return true

    await sessionModel.deleteSession(id)
    await SETEX_REDIS(`session:${id}`, ENV.SESSION_LIFE, 'revoked')

    return false
  } catch (error) { throw error }
}

const clearSessions = async (userId, sessionId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    const sessionsDeleted = await sessionModel.clearSessions(userId, sessionId)
    sessionsDeleted.forEach(session => MULTI_REDIS(`session:${session._id}`, ENV.SESSION_LIFE, 'revoked'))

  } catch (error) { throw error }
}

const setMaxSessions = async (userId, maxSessions, sessionId) => {
  try {
    if (!maxSessions || maxSessions < 1 || maxSessions > 10)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Max sessions must be between 1 and 10')
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    await userModel.update(userId, { max_sessions: maxSessions })

    const sessionCount = await GET_DB().collection(sessionModel.USER_SESSIONS_COLLECTION_NAME).countDocuments({ user_id: new ObjectId(userId) })

    if (sessionCount > maxSessions) {
      const deletedSessions = await sessionModel.deleteOldestSessions(userId, parseInt(maxSessions))

      deletedSessions.forEach(session => MULTI_REDIS(`session:${session._id}`, ENV.SESSION_LIFE, 'revoked'))
    }

    return await getSessions(userId, sessionId)
  } catch (error) { throw error }
}

export const sessionService = {
  getSessions,
  deleteSession,
  clearSessions,
  setMaxSessions
}