import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { brevoProvider } from '~/providers/brevoProvider'
import { WELCOME_GOOGLE_EMAIL } from '~/utils/emailTemplates'
import { CLIENT_URL } from '~/utils/constants'

const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin'
}

const LOGIN_TYPES = {
  EMAIL: 'email',
  GOOGLE: 'google'
}

const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
  password: Joi.string().allow(null),
  username: Joi.string().required().trim().strict(),
  displayName: Joi.string().required().trim().strict(),
  avatar: Joi.string().default(null),
  role: Joi.string().valid(USER_ROLES.CLIENT, USER_ROLES.ADMIN).default(USER_ROLES.CLIENT),
  typeLogin: Joi.string().valid(LOGIN_TYPES.EMAIL, LOGIN_TYPES.GOOGLE).default(LOGIN_TYPES.EMAIL),
  googleId: Joi.string().default(null),

  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(),
  verifyTokenExpiresAt: Joi.date().timestamp('javascript').default(null),

  require_2fa: Joi.boolean().default(false),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const TWO_FA_SECRET_KEYS_COLLECTION_NAME = 'two_fa_secret_keys'
const TWO_FA_SECRET_KEYS_COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  value: Joi.string().required()
})

const USER_SESSIONS_COLLECTION_NAME = 'user_sessions'
const USER_SESSIONS_COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  device_id: Joi.string().required(),
  is_2fa_verified: Joi.boolean().default(false),
  last_login: Joi.date().timestamp('javascript').default(null)
})

const INVALID_UPDATE_FIELDS = ['_id', 'email', 'createdAt', 'username']

const validate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    return await GET_DB().collection(USER_COLLECTION_NAME).insertOne(await validate(data))
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(USER_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
  } catch (error) { throw new Error(error) }
}

const findOneByEmail = async (email) => {
  try {
    return await GET_DB().collection(USER_COLLECTION_NAME).findOne({ email })
  } catch (error) { throw new Error(error) }
}

const findOrCreateGoogleUser = async (profile) => {
  try {
    const googleId = profile.id
    const email = profile.emails[0].value

    const existingUser = await findOneByEmail(email)
    if (existingUser) {
      if (existingUser.googleId === googleId) return existingUser
      if (!existingUser.googleId) {
        const updatedUser = await GET_DB().collection(USER_COLLECTION_NAME).findOneAndUpdate(
          { email },
          { $set: { googleId, isActive: true, updatedAt: Date.now() } },
          { returnDocument: 'after' }
        )
        return updatedUser
      }
    }

    const newUser = {
      email: profile.emails[0].value,
      username: `${profile.emails[0].value.split('@')[0].toLowerCase()}${uuidv4().slice(0, 4)}`,
      displayName: profile.displayName,
      googleId: profile.id,
      typeLogin: LOGIN_TYPES.GOOGLE,
      avatar: profile.photos?.[0]?.value || null,
      password: null,
      role: USER_ROLES.CLIENT,
      isActive: true
    }

    const validatedUser = await validate(newUser)
    const result = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validatedUser)

    const subject = 'WELCOME TO MINAPAN 🎉'
    const year = new Date().getFullYear()
    const htmlContent = WELCOME_GOOGLE_EMAIL(validatedUser.displayName, `${CLIENT_URL}/login`, year)

    await brevoProvider.sendEmail(validatedUser.email, subject, htmlContent)

    return { _id: result.insertedId, ...validatedUser }

  } catch (error) { throw new Error(error) }
}

const update = async (id, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) delete updateData[fieldName]
    })

    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result.matchedCount === 0) {
      throw new Error('User not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

const findOne2FASecretKey = async (user_id) => {
  try {
    return await GET_DB().collection(TWO_FA_SECRET_KEYS_COLLECTION_NAME).findOne({ user_id: new ObjectId(user_id) })
  } catch (error) { throw new Error(error) }
}

const insert2FASecretKey = async (data) => {
  try {
    return await GET_DB().collection(TWO_FA_SECRET_KEYS_COLLECTION_NAME).insertOne(data)
  } catch (error) { throw new Error(error) }
}

const findOneSession = async (user_id, device_id) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).findOne({ user_id: new ObjectId(user_id), device_id })
  } catch (error) { throw new Error(error) }
}

const insertSession = async (data) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).insertOne(data)
  } catch (error) { throw new Error(error) }
}

const updateSession = async (userId, deviceId, updateData) => {
  try {
    const result = await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).findOneAndUpdate(
      { user_id: new ObjectId(userId), device_id: deviceId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result.matchedCount === 0) {
      throw new Error('Session not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

const deleteSessions = async (userId, deviceId) => {
  try {
    return await GET_DB().collection(USER_SESSIONS_COLLECTION_NAME).deleteMany({ user_id: new ObjectId(userId), device_id: deviceId })
  } catch (error) { throw new Error(error) }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  TWO_FA_SECRET_KEYS_COLLECTION_NAME,
  TWO_FA_SECRET_KEYS_COLLECTION_SCHEMA,
  USER_SESSIONS_COLLECTION_NAME,
  USER_SESSIONS_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByEmail,
  update,
  findOne2FASecretKey,
  insert2FASecretKey,
  updateSession,
  findOneSession,
  insertSession,
  deleteSessions,
  findOrCreateGoogleUser
}