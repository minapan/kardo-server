/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import ApiError from '~/utils/ApiError'
import { slugify } from '~/utils/formatters'

const createNew = async (reqBody) => {
  try {
    // Create a new board with the slugified title
    const createdBoard = await boardModel.createNew({
      ...reqBody,
      slug: `${slugify(reqBody.title)}-${uuidv4().slice(0, 6)}`
    })

    // Service always must return a value
    return await boardModel.findOneById(createdBoard.insertedId)
  } catch (error) { throw error }
}

const getDetails = async (id) => {
  try {
    const board = await boardModel.getDetails(id)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // Clone board to avoid changing the original data
    const resBoard = cloneDeep(board)

    // Group cards into columns
    resBoard.columns?.forEach(column => {
      // Filter cards that belongs to the current column
      column.cards = resBoard.cards?.filter(card => card.columnId.equals(column._id))
    })

    // Remove cards from the board because it's already included in columns
    delete resBoard.cards

    return resBoard
  } catch (error) { throw error }
}

const update = async (id, reqBody) => {
  try {
    return await boardModel.update(id, { ...reqBody, updatedAt: Date.now() })
  } catch (error) { throw error }
}

const moveCardToDiffCol = async (reqBody) => {
  try {
    // Update arr cardOrderIds of previous column (remove _id of card out of array)
    await columnModel.update(reqBody.prevColId, {
      cardOrderIds: reqBody.prevCardOrderIds,
      updatedAt: Date.now()
    })

    // Update arr cardOrderIds of next column (add _id of card in of array)
    await columnModel.update(reqBody.nextColId, {
      cardOrderIds: reqBody.nextCardOrderIds,
      updatedAt: Date.now()
    })

    // Update new field columnId of dragged card
    await cardModel.update(reqBody.currCardId, {
      columnId: reqBody.nextColId
    })

    return { updateResult: 'Successfully!' }
  } catch (error) { throw error }
}

export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardToDiffCol
}