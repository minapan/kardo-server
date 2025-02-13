/**
 * Custom error class for API errors.
 * Extends the built-in Error class to include a status code.
 */
class ApiError extends Error {
  // The constructor accepts a status code and a message as parameters
  constructor(statusCode, message) {
    // Call the parent class's constructor with the message parameter
    super(message)

    this.name = 'ApiError'
    this.statusCode = statusCode

    // Capture the stack trace for where this error was instantiated
    // Helps in debugging by showing where the error originated
    Error.captureStackTrace(this, this.constructor)
  }
}

export default ApiError
