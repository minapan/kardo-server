import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const USER_SESSIONS_COLLECTION_NAME = 'user_sessions'
const USER_SESSIONS_COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  device_info: Joi.object({
    userAgent: Joi.string(),
    browser: Joi.string(),
    os: Joi.string()
  }).allow(null),
  is_2fa_verified: Joi.boolean().default(false),
  last_login: Joi.date().timestamp('javascript').default(null),
  last_active: Joi.date().timestamp('javascript').default(null)
})

// const validate = async (data) => {
//   return await USER_SESSIONS_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
// }

const deleteOldestSession = async (user_id) => {
  try {
    const session = await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME)
      .find({ user_id: new ObjectId(user_id) })
      .sort({ last_active: 1 })
      .limit(1)
      .toArray()
    const idDelete = session[0]._id.toString()

    await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).deleteOne({ _id: session[0]._id })
    return idDelete
  } catch (error) { throw new Error(error) }
}

const deleteOldestSessions = async (user_id, maxSessions) => {
  try {
    const sessionsToKeep = await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME)
      .find({ user_id: new ObjectId(user_id) })
      .sort({ last_active: -1 })
      .limit(maxSessions)
      .toArray()
    const keepIds = sessionsToKeep.map(s => s._id)

    const sessionsToDelete = await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME)
      .find({ user_id: new ObjectId(user_id), _id: { $nin: keepIds } })
      .toArray()

    await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).deleteMany({
      user_id: new ObjectId(user_id),
      _id: { $nin: keepIds }
    })

    return sessionsToDelete
  } catch (error) { throw new Error(error) }
}

const findOneSession = async (userId, userAgent) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).findOne({
      user_id: new ObjectId(userId),
      'device_info.userAgent': userAgent
    })
  } catch (error) { throw new Error(error) }
}

const findOneSessionById = async (id) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
  } catch (error) { throw new Error(error) }
}

const getSessions = async (userId) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME)
      .find({ user_id: new ObjectId(userId) })
      .project({ refresh_token: 0 })
      .sort({ last_active: -1 })
      .toArray()
  } catch (error) { throw new Error(error) }
}

const insertSession = async (data) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).insertOne(data)
  } catch (error) { throw new Error(error) }
}

const updateSession = async (sessionId, updateData) => {
  try {
    const result = await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(sessionId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result.matchedCount === 0) {
      throw new Error('Session not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

const deleteSession = async (id) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) })
  } catch (error) { throw new Error(error) }
}

const clearSessions = async (userId, sessionId) => {
  try {
    const sessionsToDel = await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME)
      .find({ user_id: new ObjectId(userId), _id: { $ne: new ObjectId(sessionId) } })
      .toArray()

    const deleteIds = sessionsToDel.map(s => s._id)

    await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).deleteMany({
      user_id: new ObjectId(userId),
      _id: { $in: deleteIds }
    })

    return sessionsToDel
  } catch (error) { throw new Error(error) }
}

export const sessionModel = {
  USER_SESSIONS_COLLECTION_NAME,
  USER_SESSIONS_COLLECTION_SCHEMA,
  getSessions,
  updateSession,
  findOneSession,
  findOneSessionById,
  insertSession,
  deleteSession,
  clearSessions,
  deleteOldestSession,
  deleteOldestSessions
}