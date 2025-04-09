import { StatusCodes } from 'http-status-codes'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { generateOTP, pickUser } from '~/utils/formatters'
import { CLIENT_URL, SERVICE_NAME } from '~/utils/constants'
import { brevoProvider } from '~/providers/brevoProvider'
import { CONFIRMATION_EMAIL, FORGOT_PASSWORD_EMAIL } from '~/utils/emailTemplates'
import { jwtProvider } from '~/providers/jwtProvider'
import { ENV } from '~/config/environment'
import { cloudinaryProvider } from '~/providers/cloudinaryProvider'
import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import { ObjectId } from 'mongodb'
import { checkAndCleanProfanity, isBadWord } from '~/utils/badWordsFilter'
import { sessionModel } from '~/models/sessionModel'
import { GET_DB } from '~/config/mongodb'
const uap = require('ua-parser-js')

/* eslint-disable no-useless-catch */
const createNew = async (reqBody) => {
  try {
    // Check if email already exist
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, ('Email already exist'))
    }

    // Extract the username part from the email address
    // The email is expected to be in the format 'username@domain.com'
    // Here, we split the email string at the '@' character and take the first part which corresponds to the username
    const nameFromEmail = reqBody.email.split('@')[0]

    const createdUser = await userModel.createNew({
      email: reqBody.email,
      password: bcrypt.hashSync(reqBody.password, 8),
      // Create a unique username based on the email address
      // For example, if the email address is 'john.doe@example.com',
      // the username will be 'john_doe_1234'
      username: `${nameFromEmail.toLowerCase()}${uuidv4().slice(0, 4)}`,
      displayName: nameFromEmail,
      verifyToken: uuidv4(),
      verifyTokenExpiresAt: Date.now() + 600000 // 10 minutes
    })

    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    const verifyUrl = `${CLIENT_URL}/account/verify?email=${getNewUser.email}&token=${getNewUser.verifyToken}`

    const subject = 'Verify Your Email 📩'
    const year = new Date().getFullYear()
    const htmlContent = CONFIRMATION_EMAIL(getNewUser.displayName, verifyUrl, year)

    await brevoProvider.sendEmail(getNewUser.email, subject, htmlContent)

    return pickUser(getNewUser)
  } catch (error) { throw error }
}

const verifyAccount = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account already verified')
    if (existUser.verifyTokenExpiresAt < Date.now())
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'OTP token expired. Please request a new one!')
    if (existUser.verifyToken !== reqBody.token)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid verification token')

    const updatedUser = await userModel.update(existUser._id, {
      isActive: true,
      verifyToken: null,
      verifyTokenExpiresAt: null
    })

    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const login = async (reqBody, deviceId) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not verified')
    if (!bcrypt.compareSync(reqBody.password, existUser.password))
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your password is incorrect')

    const userInfo = { _id: existUser._id, email: existUser.email }

    const accessToken = await jwtProvider.generateToken(
      userInfo,
      ENV.ACCESS_TOKEN_SECRET_SIGNATURE,
      ENV.ACCESS_TOKEN_LIFE
    )
    const refreshToken = await jwtProvider.generateToken(
      userInfo,
      ENV.REFRESH_TOKEN_SECRET_SIGNATURE,
      ENV.REFRESH_TOKEN_LIFE
    )

    const ua = uap(deviceId)

    const sessionCount = await GET_DB().collection(sessionModel.USER_SESSIONS_COLLECTION_NAME).countDocuments({ user_id: new ObjectId(existUser._id) })
    const maxSessions = existUser.max_sessions || 2
    if (sessionCount >= maxSessions) {
      await sessionModel.deleteOldestSession(existUser._id)
    }

    let currUserSession = await sessionModel.findOneSession(refreshToken)
    if (!currUserSession) {
      currUserSession = await sessionModel.insertSession({
        user_id: new ObjectId(existUser._id),
        refresh_token: refreshToken,
        device_info: {
          browser: `${ua?.browser?.name || 'Unknown'} ${ua?.browser?.version || ''}`,
          os: `${ua?.os?.name || 'Unknown'} ${ua?.os?.version || ''}`
        },
        is_2fa_verified: false,
        last_login: new Date().valueOf(),
        last_active: new Date().valueOf()
      })
    }

    let resUser = pickUser(existUser)
    resUser.is_2fa_verified = currUserSession.is_2fa_verified
    resUser.last_login = currUserSession.last_login

    return { accessToken, refreshToken, ...resUser }
  } catch (error) { throw error }
}

const loginWithGoogle = async (user, deviceId) => {
  try {
    const userInfo = await userModel.findOneByEmail(user.email)

    const accessToken = await jwtProvider.generateToken(
      userInfo,
      ENV.ACCESS_TOKEN_SECRET_SIGNATURE,
      ENV.ACCESS_TOKEN_LIFE
    )
    const refreshToken = await jwtProvider.generateToken(
      userInfo,
      ENV.REFRESH_TOKEN_SECRET_SIGNATURE,
      ENV.REFRESH_TOKEN_LIFE
    )

    const ua = uap(deviceId)

    const sessionCount = await GET_DB().collection(sessionModel.USER_SESSIONS_COLLECTION_NAME).countDocuments({ user_id: new ObjectId(userInfo._id) })
    const maxSessions = userInfo.max_sessions || 2
    if (sessionCount >= maxSessions) {
      await sessionModel.deleteOldestSession(userInfo._id)
    }

    let currUserSession = await sessionModel.findOneSession(refreshToken)
    if (!currUserSession) {
      currUserSession = await sessionModel.insertSession({
        user_id: new ObjectId(userInfo._id),
        refresh_token: refreshToken,
        device_info: {
          browser: `${ua?.browser?.name || 'Unknown'} ${ua?.browser?.version || ''}`,
          os: `${ua?.os?.name || 'Unknown'} ${ua?.os?.version || ''}`
        },
        is_2fa_verified: false,
        last_login: new Date().valueOf(),
        last_active: new Date().valueOf()
      })
    }

    return { accessToken, refreshToken }
  } catch (error) {
    throw error
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    const existSession = await sessionModel.findOneSession(clientRefreshToken)
    if (!existSession) throw new ApiError(StatusCodes.FORBIDDEN, 'Please login!')

    const refreshTokenDecoded = await jwtProvider.verifyToken(
      clientRefreshToken,
      ENV.REFRESH_TOKEN_SECRET_SIGNATURE
    )

    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email
    }

    const accessToken = await jwtProvider.generateToken(
      userInfo,
      ENV.ACCESS_TOKEN_SECRET_SIGNATURE,
      ENV.ACCESS_TOKEN_LIFE
    )

    await sessionModel.updateSession(clientRefreshToken, { last_active: new Date().valueOf() })

    return { accessToken }
  } catch (error) { throw error }
}

const update = async (id, reqBody, avt, refreshToken) => {
  try {
    const existUser = await userModel.findOneById(id)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not verified')

    let updatedUser = {}

    if (reqBody.current_password && reqBody.new_password) {
      if (!bcrypt.compareSync(reqBody.current_password, existUser.password))
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your current password is incorrect')

      updatedUser = await userModel.update(id, {
        password: bcrypt.hashSync(reqBody.new_password, 8),
        updatedAt: Date.now()
      })

      await sessionModel.clearSessions(existUser._id, refreshToken)
    }

    else if (reqBody.new_password) {
      updatedUser = await userModel.update(id, {
        password: bcrypt.hashSync(reqBody.new_password, 8),
        updatedAt: Date.now()
      })
    }

    else if (avt) {
      const result = await cloudinaryProvider.streamUpload(avt.buffer, 'UserAvatars')
      const regularUrl = result.secure_url.replace(/\/upload\//, '/upload/w_100,h_100,c_fill/')

      updatedUser = await userModel.update(id, {
        avatar: regularUrl,
        updatedAt: Date.now()
      })
    }
    else {
      updatedUser = await userModel.update(id, {
        displayName: isBadWord(reqBody.displayName) ? `I'm.Stupid.${uuidv4().slice(0, 6)}` : reqBody.displayName,
        bio: checkAndCleanProfanity(reqBody.bio),
        updatedAt: Date.now()
      })
    }

    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const get2FaQrCode = async (userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (!user.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not verified')

    let twoFactorSecretKeyValue = null
    const twoFactorSecretKey = await userModel.findOne2FASecretKey(userId)

    if (!twoFactorSecretKey) {
      const newTwoFactorSecretKey = await userModel.insert2FASecretKey({
        user_id: new ObjectId(userId),
        value: authenticator.generateSecret()
      })
      twoFactorSecretKeyValue = newTwoFactorSecretKey.value
    } else {
      twoFactorSecretKeyValue = twoFactorSecretKey.value
    }

    const optAuthToken = authenticator.keyuri(
      user.username,
      SERVICE_NAME,
      twoFactorSecretKeyValue
    )

    const QRCodeImgUrl = await qrcode.toDataURL(optAuthToken)

    return { qrcode: QRCodeImgUrl }
  } catch (error) { throw error }
}

const setup2FA = async (userId, otpToken, refreshToken) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    const twoFactorSecretKey = await userModel.findOne2FASecretKey(userId)
    if (!twoFactorSecretKey) throw new ApiError(StatusCodes.NOT_FOUND, '2FA secret key not found!')
    if (!otpToken) throw new ApiError(StatusCodes.NOT_FOUND, 'OTP token not found!')

    const isValid = authenticator.verify({
      token: otpToken,
      secret: twoFactorSecretKey.value
    })
    if (!isValid) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid 2FA token!')

    const toggledRequire2FA = !user.require_2fa
    const updatedUser = await userModel.update(userId, {
      require_2fa: toggledRequire2FA
    }
    )

    const newUserSession = await sessionModel.updateSession(
      refreshToken,
      { is_2fa_verified: toggledRequire2FA, last_login: new Date().valueOf() }
    )

    await sessionModel.clearSessions(userId, refreshToken)

    return {
      ...pickUser(updatedUser),
      is_2fa_verified: newUserSession.is_2fa_verified,
      last_login: newUserSession.last_login
    }
  } catch (error) { throw error }
}

const verify2FA = async (userId, otpToken, refreshToken) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    const twoFactorSecretKey = await userModel.findOne2FASecretKey(userId)
    if (!twoFactorSecretKey) throw new ApiError(StatusCodes.NOT_FOUND, '2FA secret key not found!')
    if (!otpToken) throw new ApiError(StatusCodes.NOT_FOUND, 'OTP token not found!')

    const isValid = authenticator.verify({
      token: otpToken,
      secret: twoFactorSecretKey.value
    })

    if (!isValid) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid 2FA token!')

    const updatedUserSession = await sessionModel.updateSession(
      refreshToken,
      { is_2fa_verified: true }
    )

    return ({
      ...pickUser(user),
      is_2fa_verified: updatedUserSession.is_2fa_verified,
      last_login: updatedUserSession.last_login
    })
  } catch (error) { throw error }
}

const logout = async (refreshToken) => {
  try {
    const session = await sessionModel.findOneSession(refreshToken)
    if (session) await sessionModel.deleteSession(session._id)

    return true
  } catch (error) { throw error }
}

const getUser = async (refreshToken, userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')

    let currUserSession = await sessionModel.findOneSession(refreshToken)

    let resUser = pickUser(user)
    resUser.is_2fa_verified = currUserSession.is_2fa_verified
    resUser.last_login = currUserSession.last_login

    return resUser
  } catch (error) { throw error }
}

const forgotPassword = async (reqBody) => {
  try {
    const user = await userModel.findOneByEmail(reqBody.email)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    const lastRequest = user.verifyTokenExpiresAt - 600000 // 10 minutes
    const waitTime = lastRequest + 60 * 1000 - Date.now() // 1 minute - current time

    if (user.verifyToken && user.verifyTokenExpiresAt > Date.now() && waitTime > 0)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, `Please wait ${Math.ceil(waitTime / 1000)} seconds to request again!`)

    const otpToken = generateOTP()

    await userModel.update(user._id, {
      require_2fa: false,
      verifyToken: bcrypt.hashSync(otpToken, 8),
      verifyTokenExpiresAt: Date.now() + 600000 // 10 minutes
    })

    const subject = 'Reset Your Password 🔑'
    const year = new Date().getFullYear()
    const htmlContent = FORGOT_PASSWORD_EMAIL(user.displayName, otpToken, year)

    await brevoProvider.sendEmail(user.email, subject, htmlContent)

    return otpToken
  } catch (error) { throw error }
}

const resetPassword = async (reqBody, refreshToken) => {
  try {
    const user = await userModel.findOneByEmail(reqBody.email)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    if (user.verifyTokenExpiresAt < Date.now())
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'OTP token expired. Please request a new one!')

    const isValid = bcrypt.compareSync(reqBody.otpToken, user.verifyToken)
    if (!isValid) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid OTP token!')

    await userModel.update(user._id, {
      password: bcrypt.hashSync(reqBody.password, 8),
      verifyToken: null,
      verifyTokenExpiresAt: null
    })

    await sessionModel.clearSessions(user._id, refreshToken)

    return true
  } catch (error) { throw error }
}

const deleteAccount = async (userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')

    await userModel.update(userId, {
      isActive: false,
      require_2fa: false,
      googleId: null,
      _destroy: true
    })

    await sessionModel.clearSessions(user._id, refreshToken)
    return true
  } catch (error) { throw error }
}

export const userService = {
  deleteAccount,
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update,
  get2FaQrCode,
  setup2FA,
  logout,
  verify2FA,
  loginWithGoogle,
  getUser,
  forgotPassword,
  resetPassword
}