import { OAUTH_ROUTES, WHITELIST_DOMAINS } from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { ENV } from './environment'

const handleOrigin = (req, origin, callback) => {
  if (ENV.BUILD_MODE === 'dev') {
    return callback(null, true)
  }

  const isOAuthRoute = OAUTH_ROUTES.some(route => req.originalUrl.startsWith(route))

  if (isOAuthRoute) {
    if (!origin || WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }
  }
  else if (WHITELIST_DOMAINS.includes(origin)) {
    return callback(null, true)
  }

  return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
}

export const corsOptions = (req, res, next) => {
  return {
    origin: (origin, callback) => handleOrigin(req, origin, callback),
    optionsSuccessStatus: 200,
    credentials: true
  }
}