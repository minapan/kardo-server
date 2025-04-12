import { StatusCodes } from 'http-status-codes'
import { ENV } from '~/config/environment'
import { jwtProvider } from '~/providers/jwtProvider'
import { GET_REDIS } from '~/redis/redis'
import ApiError from '~/utils/ApiError'

const isAuthoried = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken

  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Access token not found)'))
    return
  }

  try {
    const accessTokenDecoded = await jwtProvider.verifyToken(clientAccessToken, ENV.ACCESS_TOKEN_SECRET_SIGNATURE)

    req.jwtDecoded = accessTokenDecoded

    const sessionStatus = await GET_REDIS(`session:${accessTokenDecoded.session_id}`)
    if (!sessionStatus || sessionStatus === 'revoked') {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Session has been revoked!'))
    }

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