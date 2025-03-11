/* eslint-disable no-useless-catch */
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { pagingSkip } from '~/utils/algorithms'

const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().min(3).max(50).required().trim().strict(),
  description: Joi.string().min(3).max(256).required().trim().strict(),
  type: Joi.string().valid('public', 'private').required(),
  slug: Joi.string().min(3).required().trim().strict(),

  columnOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),
  ownerIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),
  memberIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validate = async (data) => {
  try {
    return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) { throw new Error(error) }
}

const createNew = async (userId, data) => {
  try {
    const validData = await validate(data)
    validData.ownerIds = [new ObjectId(userId)]
    return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validData)
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
  } catch (error) { throw new Error(error) }
}

const getDetails = async (boardId, userId) => {
  try {
    const queryConditions = [
      { _id: new ObjectId(boardId) },
      { _destroy: false },
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(userId)] } },
          { memberIds: { $all: [new ObjectId(userId)] } }
        ]
      }
    ]

    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      { $match: { $and: queryConditions } },
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
      },
      { $limit: 1 }
    ]).toArray()

    return result.length > 0 ? result[0] : null
  } catch (error) { throw new Error(error) }
}

const update = async (id, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) delete updateData[fieldName]
    })

    if (updateData.columnOrderIds)
      updateData.columnOrderIds = updateData.columnOrderIds.map(_id => (new ObjectId(_id)))

    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result.matchedCount === 0) {
      throw new Error('Board not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

const getBoards = async (id, page, limit) => {
  try {
    const queryConditions = [
      { _destroy: false },
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(id)] } },
          { memberIds: { $all: [new ObjectId(id)] } }
        ]
      }
    ]

    const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      { $match: { $and: queryConditions } },
      { $sort: { createdAt: -1 } },
      {
        // $facet is a new stage that allows you to run multiple aggregation pipelines
        $facet: {
          // 01: query boards
          'queryBoards': [
            { $skip: pagingSkip(page, limit) },
            { $limit: limit }
          ],
          // 02: query total boards
          'queryTotalBoards': [
            { $count: 'total' }
          ]
        }
      }
    ],
    { collation: { locale: 'en', numericOrdering: true } }
    ).toArray()

    const result = query[0]
    // console.log('🚀 ~ getBoards ~ result:', result)

    return {
      boards: result.queryBoards || [],
      total: result.queryTotalBoards?.[0]?.total || 0
    }

  } catch (error) { throw new Error(error) }
}

const pushColumnOrderIds = async (col) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(col.boardId) },
      { $push: { columnOrderIds: new ObjectId(col._id) } },
      { returnDocument: 'after' }
    )
  } catch (error) { throw new Error(error) }
}

const pullColumnOrderIds = async (col) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(col.boardId) },
      { $pull: { columnOrderIds: new ObjectId(col._id) } },
      { returnDocument: 'after' }
    )
  } catch (error) { throw new Error(error) }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  getDetails,
  pushColumnOrderIds,
  pullColumnOrderIds,
  getBoards
}