import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import { passportProvider } from '~/providers/passportProvider'
import { userService } from '~/services/userService'
import ApiError from '~/utils/ApiError'
import { CLIENT_URL } from '~/utils/constants'
import { pickUser } from '~/utils/formatters'

const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) { next(error) }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const forgotPassword = async (req, res, next) => {
  try {
    const result = await userService.forgotPassword(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body, req.headers['user-agent'])

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.status(StatusCodes.OK).json(pickUser(result))
  } catch (error) { next(error) }
}

const logout = async (req, res, next) => {
  try {
    await userService.logout(req.jwtDecoded._id, req.headers['user-agent'])

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) { next(error) }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(new ApiError(StatusCodes.FORBIDDEN, 'Please login!')) }
}

const update = async (req, res, next) => {
  try {
    const updatedUser = await userService.update(req.jwtDecoded._id, req.body, req.file)
    res.status(StatusCodes.OK).json(updatedUser)
  } catch (error) { next(error) }
}

const get2FaQrCode = async (req, res, next) => {
  try {
    const result = await userService.get2FaQrCode(req.jwtDecoded._id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const setup2FA = async (req, res, next) => {
  try {
    const result = await userService.setup2FA(req.jwtDecoded._id, req.body.otpToken, req.headers['user-agent'])
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const verify2FA = async (req, res, next) => {
  try {
    const result = await userService.verify2FA(req.jwtDecoded._id, req.body.otpToken, req.headers['user-agent'])
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const googleLogin = passportProvider.ggAuth().authenticate('google', { scope: ['profile', 'email'] })

const googleCallback = [
  passportProvider.ggAuth().authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user
      const deviceId = req.headers['user-agent'] || 'unknown_device'
      const result = await userService.loginWithGoogle(user, deviceId)

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ms('14 days')
      })

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ms('14 days')
      })

      res.redirect(`${CLIENT_URL}/auth/callback`)
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message })
    }
  }
]

const getUser = async (req, res, next) => {
  try {
    const result = await userService.getUser(req.jwtDecoded._id, req.headers['user-agent'])
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  logout,
  refreshToken,
  update,
  get2FaQrCode,
  setup2FA,
  verify2FA,
  forgotPassword,
  googleLogin,
  googleCallback,
  getUser
}
