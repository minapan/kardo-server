/* eslint-disable no-useless-catch */
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'

const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().min(3).max(50).required().trim().strict(),
  description: Joi.string().min(3).max(256).required().trim().strict(),
  type: Joi.string().valid('public', 'private').required(),

  slug: Joi.string().min(3).required().trim().strict(),

  columnOrderIds: Joi.array().items(Joi.string()).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validate = async (data) => {
  try {
    return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) { throw new Error(error) }
}

const createNew = async (data) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(await validate(data))
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
  } catch (error) { throw new Error(error) }
}

const getDetails = async (id) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      {
        $match: {
          _id: new ObjectId(id),
          _destroy: false
        }
      },
      {
        $lookup: {
          from: columnModel.COLUMN_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'columns'
        }
      },
      {
        $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'cards'
        }
      }
    ]).toArray()[0] || {}
  } catch (error) { throw new Error(error) }
}

const updateById = async (id, updateData) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      throw new Error('Board not found')
    }

    return result
  } catch (error) {
    throw error
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  updateById,
  getDetails
}