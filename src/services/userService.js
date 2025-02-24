import { StatusCodes } from 'http-status-codes'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { pickUser } from '~/utils/formatters'
import { CLIENT_URL } from '~/utils/constants'
import { brevoProvider } from '~/providers/brevoProvider'
import { CONFIMATION_EMAIL, CONFIRMATION_EMAIL } from '~/utils/emailTemplates'

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

export const userService = {
  createNew
}