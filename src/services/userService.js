import { StatusCodes } from 'http-status-codes'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { pickUser } from '~/utils/formatters'
import { CLIENT_URL, SERVICE_NAME } from '~/utils/constants'
import { brevoProvider } from '~/providers/brevoProvider'
import { CONFIRMATION_EMAIL } from '~/utils/emailTemplates'
import { jwtProvider } from '~/providers/jwtProvider'
import { ENV } from '~/config/environment'
import { cloudinaryProvider } from '~/providers/cloudinaryProvider'
import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import { ObjectId } from 'mongodb'
import { checkAndCleanProfanity, cleanText, isBadWord } from '~/utils/badWordsFilter'

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
      verifyToken: uuidv4()
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
    if (existUser.verifyToken !== reqBody.token)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid verification token')

    const updatedUser = await userModel.update(existUser._id, {
      isActive: true,
      verifyToken: null
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

    let currUserSession = await userModel.findOneSession(
      existUser._id,
      deviceId
    )

    if (!currUserSession) {
      currUserSession = await userModel.insertSession({
        user_id: new ObjectId(existUser._id),
        device_id: deviceId,
        is_2fa_verified: false,
        last_login: new Date().valueOf()
      })
    }

    let resUser = pickUser(existUser)
    resUser['is_2fa_verified'] = currUserSession.is_2fa_verified
    resUser['last_login'] = currUserSession.last_login

    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) { throw error }
}

const refreshToken = async (clientRefreshToken) => {
  try {
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

    return { accessToken }
  } catch (error) { throw error }
}

const update = async (id, reqBody, avt) => {
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
    }
    else if (avt) {
      const result = await cloudinaryProvider.streamUpload(avt.buffer, 'UserAvatars')

      updatedUser = await userModel.update(id, {
        avatar: result.secure_url,
        updatedAt: Date.now()
      })
    }
    else {
      updatedUser = await userModel.update(id, {
        displayName: isBadWord(reqBody.displayName) ? `TuiKìCục_${uuidv4().slice(0, 4)}` : reqBody.displayName,
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

const setup2FA = async (userId, otpToken, deviceId) => {
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

    const updatedUser = await userModel.update(userId, {
      require_2fa: true
    }
    )

    const newUserSession = await userModel.updateSession(
      userId, deviceId,
      { is_2fa_verified: true, last_login: new Date().valueOf() }
    )

    return {
      ...pickUser(updatedUser),
      is_2fa_verified: newUserSession.is_2fa_verified,
      last_login: newUserSession.last_login
    }
  } catch (error) { throw error }
}

const verify2FA = async (userId, otpToken, deviceId) => {
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

    const updatedUserSession = await userModel.updateSession(
      userId,
      deviceId,
      { is_2fa_verified: true }
    )

    return ({
      ...pickUser(user),
      is_2fa_verified: updatedUserSession.is_2fa_verified,
      last_login: updatedUserSession.last_login
    })
  } catch (error) { throw error }
}

const logout = async (userId, deviceId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')

    await userModel.deleteSessions(userId, deviceId)
  } catch (error) { throw error }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update,
  get2FaQrCode,
  setup2FA,
  logout,
  verify2FA
}