/* eslint-disable no-unused-vars */
/**
 * Error handling middleware for ExpressJS.
 * This middleware will catch all errors and handle them nicely.
 * @param {Error} err - The error object.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware in the stack.
 * @returns {void}
 */
import { StatusCodes } from 'http-status-codes'

export const errorHandlingMiddleware = (err, req, res, next) => {
  // If the error does not have a statusCode, set it to 500 (Internal Server Error)
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  // Create a responseError object to control what to send back to the client
  const responseError = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode], // If the error does not have a message, use the ReasonPhrases from the http-status-codes package
    stack: err.stack
  }

  // Only send the stack trace when the environment is set to DEV
  // if (ENV.BUILD_MODE !== 'dev') delete responseError.stack

  // Send the responseError object back to the client
  res.status(responseError.statusCode).json(responseError)
}