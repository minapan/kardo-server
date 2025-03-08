import { StatusCodes } from 'http-status-codes'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { pickUser } from '~/utils/formatters'
import { CLIENT_URL } from '~/utils/constants'
import { brevoProvider } from '~/providers/brevoProvider'
import { CONFIRMATION_EMAIL } from '~/utils/emailTemplates'
import { jwtProvider } from '~/providers/jwtProvider'
import { ENV } from '~/config/environment'

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

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not verified')
    if (!bcrypt.compareSync(reqBody.password, existUser.password))
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Your password is incorrect')

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

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken
}