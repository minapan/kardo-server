import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { initLabels } from '~/utils/constants'

const createNew = async (req, res, next) => {
  const correctSchema = Joi.object({
    title: Joi.string().min(3).max(50).required().trim().strict().messages({
      'any.required': 'Title is required',
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title must be at most 50 characters long',
      'string.trim': 'Title must not contain leading or trailing spaces'
    }),
    description: Joi.string().max(256).trim().strict().allow(''),
    cover: Joi.string().default(null),
    cover_small: Joi.string().default(null)
    // type: Joi.string().valid('public', 'private').required()
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

const update = async (req, res, next) => {
  const correctSchema = Joi.object({
    title: Joi.string().min(3).max(50).trim().strict(),
    description: Joi.string().min(3).max(256).trim().strict(),
    // type: Joi.string().valid('public', 'private'),
    columnOrderIds: Joi.array().items(
      Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    ),
    labels: Joi.array().items({
      id: Joi.string().required(),
      name: Joi.string().min(1).max(12).required().trim().strict(),
      color: Joi.string().required()
    }).default(initLabels)
  })
  try {
    // abortEarly: false - return all errors
    await correctSchema.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    // pass to next controller
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

const moveCardToDiffCol = async (req, res, next) => {
  const correctSchema = Joi.object({
    currCardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    prevColId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    prevCardOrderIds: Joi.array().required().items(
      Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    ),
    nextColId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    nextCardOrderIds: Joi.array().required().items(
      Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
    )
  })
  try {
    await correctSchema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }
}

export const boardValidation = {
  createNew,
  update,
  moveCardToDiffCol
}