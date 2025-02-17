/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { slugify } from '~/utils/formatters'

const createNew = async (reqBody) => {
  try {
    // Create a new board with the slugified title
    const createdBoard = await boardModel.createNew({
      ...reqBody,
      slug: slugify(reqBody.title)
    })

    // Update the slug with the insertedId
    return await boardModel.update(createdBoard.insertedId, {
      slug: `${slugify(reqBody.title)}-${createdBoard.insertedId.toString()}`
    })

    // Service always must return a value
    // return await boardModel.findOneById(createdBoard.insertedId)
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

export const boardService = {
  createNew,
  getDetails,
  update
}