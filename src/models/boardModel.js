/* eslint-disable no-useless-catch */
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { pagingSkip } from '~/utils/algorithms'
import { userModel } from './userModel'
import { initLabels } from '~/utils/constants'

const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().min(3).max(50).required().trim().strict(),
  description: Joi.string().max(256).trim().strict().allow(''),
  slug: Joi.string().min(3).required().trim().strict(),
  // type: Joi.string().valid('public', 'private').required(),
  cover: Joi.string().default(null),
  cover_small: Joi.string().default(null),

  labels: Joi.array().items({
    id: Joi.string().required(),
    name: Joi.string().min(1).max(12).required().trim().strict(),
    color: Joi.string().required()
  }).default(initLabels),

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
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'ownerIds',
          foreignField: '_id',
          as: 'owners',
          // $project 0: exclude
          pipeline: [
            { $match: { _destroy: false } },
            { $project: { password: 0, verifyToken: 0 } }
          ]
        }
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'memberIds',
          foreignField: '_id',
          as: 'members',
          pipeline: [
            { $match: { _destroy: false } },
            { $project: { password: 0, verifyToken: 0 } }
          ]
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

    const board = await findOneById(id)

    if (updateData.columnOrderIds)
      updateData.columnOrderIds = updateData.columnOrderIds.map(_id => (new ObjectId(_id)))

    else if (updateData.newLabel) {
      updateData = {
        labels: [...board.labels, updateData.newLabel],
        updateAt: updateData.updatedAt
      }
      delete updateData.newLabel
    }

    else if (updateData.updatedLabel) {
      const updatedLabel = updateData.updatedLabel
      const updatedLabels = board.labels.map(label =>
        label.id.toString() === updatedLabel.id.toString()
          ? { ...label, name: updatedLabel.name, color: updatedLabel.color }
          : label
      )
      updateData = {
        labels: updatedLabels,
        updatedAt: updateData.updatedAt
      }
      delete updateData.updatedLabel
    }

    else if (updateData.removeLabelId) {
      const removeLabelId = updateData.removeLabelId
      const updatedLabels = board.labels.filter(
        label => label.id.toString() !== removeLabelId.toString()
      )
      updateData = {
        labels: updatedLabels,
        updatedAt: updateData.updatedAt
      }
      delete updateData.removeLabelId

      await GET_DB()
        .collection(cardModel.CARD_COLLECTION_NAME)
        .updateMany(
          { boardId: new ObjectId(id), labelIds: removeLabelId },
          { $pull: { labelIds: removeLabelId } }
        )
    }

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

const getBoards = async (id, page, limit, q) => {
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

    if (q) {
      Object.keys(q).forEach(fieldName => {
        // Distinguish between capital and lowercase
        // queryConditions.push({ [fieldName]: { $regex: q[fieldName] } })

        // Non distinguish between capital and lowercase
        queryConditions.push({ [fieldName]: { $regex: new RegExp(q[fieldName], 'i') } })
      })
    }

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

const pushMemberIds = async (boardId, userId) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $push: { memberIds: new ObjectId(userId) } },
      { returnDocument: 'after' }
    )
  } catch (error) { throw new Error(error) }
}

const deleteOneById = async (id) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) })
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
  getBoards,
  pushMemberIds,
  deleteOneById
}