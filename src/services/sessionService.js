/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { sessionModel } from '~/models/sessionModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'

const getSessions = async (userId, refreshToken) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    const sessions = await sessionModel.getSessions(userId)
    const currSession = await sessionModel.findOneSession(refreshToken)

    const result = sessions.map((s) => ({
      ...s,
      is_current: (s.device_id === currSession?.device_id && s.last_login === currSession?.last_login)
    }))

    return result
  } catch (error) { throw error }
}

const deleteSession = async (id, userId, refreshToken) => {
  try {
    const session = await sessionModel.findOneSessionById(id)
    if (!session) throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found')
    if (session.user_id.toString() !== userId)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are not authorized to delete this session')

    await sessionModel.deleteSession(id)

    if (session.refresh_token === refreshToken) return true
    else return false
  } catch (error) { throw error }
}

const clearSessions = async (userId, refreshToken) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    return await sessionModel.clearSessions(userId, refreshToken)
  } catch (error) { throw error }
}

const setMaxSessions = async (userId, maxSessions, refreshToken) => {
  try {
    if (!maxSessions || maxSessions < 1 || maxSessions > 10)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Max sessions must be between 1 and 10')
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    await userModel.update(userId, { max_sessions: maxSessions })

    const sessionCount = await GET_DB().collection(sessionModel.USER_SESSIONS_COLLECTION_NAME).countDocuments({ user_id: new ObjectId(userId) })

    if (sessionCount > maxSessions) {
      await sessionModel.deleteOldestSessions(userId, maxSessions)
    }

    return await getSessions(userId, refreshToken)
  } catch (error) { throw error }
}

export const sessionService = {
  getSessions,
  deleteSession,
  clearSessions,
  setMaxSessions
}