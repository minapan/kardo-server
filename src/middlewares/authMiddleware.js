import { StatusCodes } from 'http-status-codes'
import { ENV } from '~/config/environment'
import { sessionModel } from '~/models/sessionModel'
import { jwtProvider } from '~/providers/jwtProvider'
import ApiError from '~/utils/ApiError'

const isAuthoried = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken
  const mySession = await sessionModel.findOneSession(req.cookies?.refreshToken)

  if (!mySession) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Session not found)'))
    return
  }

  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Access token not found)'))
    return
  }

  try {
    const accessTokenDecoded = await jwtProvider.verifyToken(clientAccessToken, ENV.ACCESS_TOKEN_SECRET_SIGNATURE)

    req.jwtDecoded = accessTokenDecoded

    next()
  } catch (error) {
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token! (Access token expired)'))
      return
    }

    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}

export const authMiddleware = { isAuthoried }