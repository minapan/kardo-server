import Joi from 'joi'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { CARD_MEMBER_ACTIONS } from '~/utils/constants'

const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  cover: Joi.string().default(null),
  cover_small: Joi.string().default(null),

  memberIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  labelIds: Joi.array().items(
    Joi.string().required()
  ),

  checklists: Joi.array().items({
    id: Joi.string().required(),
    title: Joi.string().required().min(1).max(32).trim().strict(),
    items: Joi.array().items({
      id: Joi.string().required(),
      name: Joi.string().required().min(1).max(500).trim().strict(),
      completed: Joi.boolean().default(false)
    })
  }),

  startDate: Joi.date().timestamp('javascript').default(null),
  dueDate: Joi.date().timestamp('javascript').default(null),

  comments: Joi.array().items({
    userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    userAvatar: Joi.string(),
    userDisplayName: Joi.string(),
    content: Joi.string(),
    commentedAt: Joi.date().timestamp()
  }),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']

const validate = async (data) => {
  try {
    return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
  } catch (error) { throw new Error(error) }
}

const createNew = async (data) => {
  try {
    const validData = await validate(data)
    return await GET_DB().collection(CARD_COLLECTION_NAME).insertOne({
      ...validData,
      boardId: new ObjectId(validData.boardId),
      columnId: new ObjectId(validData.columnId)
    })
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(CARD_COLLECTION_NAME).findOne({ _id: new ObjectId(id) })
  } catch (error) { throw new Error(error) }
}

const update = async (id, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) delete updateData[fieldName]
    })

    if (updateData.columnId) updateData.columnId = new ObjectId(updateData.columnId)

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result.matchedCount === 0) {
      throw new Error('Card not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

const updateMembers = async (id, memberInfo) => {
  try {
    let updateCondition = {}
    if (memberInfo.action === CARD_MEMBER_ACTIONS.ADD)
      updateCondition = { $push: { memberIds: new ObjectId(memberInfo.userId) } }
    if (memberInfo.action === CARD_MEMBER_ACTIONS.REMOVE)
      updateCondition = { $pull: { memberIds: new ObjectId(memberInfo.userId) } }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateCondition,
      { returnDocument: 'after' }
    )

    if (result.matchedCount === 0) {
      throw new Error('Card not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

const updateLabels = async (id, labelInfo) => {
  try {
    let updateCondition = {}
    if (labelInfo.action === CARD_MEMBER_ACTIONS.ADD)
      updateCondition = { $push: { labelIds: labelInfo.labelId } }
    if (labelInfo.action === CARD_MEMBER_ACTIONS.REMOVE)
      updateCondition = { $pull: { labelIds: labelInfo.labelId } }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateCondition,
      { returnDocument: 'after' }
    )

    if (result.matchedCount === 0) {
      throw new Error('Card not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

const deleteManyByColId = async (columnId) => {
  try {
    return await GET_DB().collection(CARD_COLLECTION_NAME).deleteMany({ columnId: new ObjectId(columnId) })
  } catch (error) { throw new Error(error) }
}

const unshiftNewComment = async (cardId, commentData) => {
  try {
    return await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      // $each and $position 0 to push the new comment to the top
      { $push: { comments: { $each: [commentData], $position: 0 } } },
      { returnDocument: 'after' }
    )
  } catch (error) { throw new Error(error) }
}

const updateChecklists = async (cardId, checklists) => {
  try {
    let updateCondition = { $set: { updatedAt: Date.now() } }
    let options = { returnDocument: 'after' }

    if (checklists.action === 'ADD_CHECKLIST') {
      updateCondition.$push = { checklists: checklists.newChecklist }
    } else if (checklists.action === 'DELETE_CHECKLIST') {
      updateCondition.$pull = { checklists: { id: checklists.checklistId } }
    } else if (checklists.action === 'ADD_ITEM') {
      updateCondition.$push = {
        'checklists.$[checklist].items': checklists.newItem
      }
      options.arrayFilters = [{ 'checklist.id': checklists.checklistId }]
    } else if (checklists.action === 'DELETE_ITEM') {
      updateCondition.$pull = {
        'checklists.$[checklist].items': { id: checklists.itemId }
      }
      options.arrayFilters = [{ 'checklist.id': checklists.checklistId }]
    } else if (checklists.action === 'TOGGLE_ITEM') {
      const card = await GET_DB()
        .collection(CARD_COLLECTION_NAME)
        .findOne({ _id: new ObjectId(cardId) })

      if (!card) {
        throw new Error('Card not found')
      }

      const checklist = card.checklists.find((c) => c.id === checklists.checklistId)
      if (!checklist) {
        throw new Error('Checklist not found')
      }

      const item = checklist.items.find((i) => i.id === checklists.itemId)
      if (!item) {
        throw new Error('Item not found')
      }

      updateCondition.$set = {
        'checklists.$[checklist].items.$[item].completed': !item.completed,
        updatedAt: Date.now()
      }
      options.arrayFilters = [
        { 'checklist.id': checklists.checklistId },
        { 'item.id': checklists.itemId }
      ]
    }

    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(cardId) }, // Filter
        updateCondition, // Update
        options // Options (bao gồm arrayFilters)
      )

    if (!result) {
      throw new Error('Card not found')
    }

    return result
  } catch (error) { throw new Error(error) }
}

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  deleteManyByColId,
  unshiftNewComment,
  updateMembers,
  updateLabels,
  updateChecklists
}