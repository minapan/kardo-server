import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  const correctSchema = Joi.object({
    title: Joi.string().min(3).max(50).required().trim().strict().messages({
      'any.required': 'Title is required',
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title must be at most 50 characters long',
      'string.trim': 'Title must not contain leading or trailing spaces'
    }),
    description: Joi.string().min(3).max(256).required().trim().strict(),
    type: Joi.string().valid('public', 'private').required()
  })
  try {
    // abortEarly: false - return all errors
    await correctSchema.validateAsync(req.body, { abortEarly: false })
    // pass to next controller
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const boardValidation = {
  createNew
}