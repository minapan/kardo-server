/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { cloudinaryProvider } from '~/providers/cloudinaryProvider'
import ApiError from '~/utils/ApiError'
import { checkAndCleanProfanity } from '~/utils/badWordsFilter'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '~/utils/constants'
import { slugify } from '~/utils/formatters'

const createNew = async (userId, reqBody) => {
  try {
    // Create a new board with the slugified title
    const createdBoard = await boardModel.createNew(userId, {
      ...checkAndCleanProfanity(reqBody),
      slug: `${slugify(reqBody.title)}-${uuidv4().slice(0, 4)}`
    })

    // Service always must return a value
    return await boardModel.findOneById(createdBoard.insertedId)
  } catch (error) { throw error }
}

const getDetails = async (boardId, userId) => {
  try {
    const board = await boardModel.getDetails(boardId, userId)
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
    return await boardModel.update(id, { ...checkAndCleanProfanity(reqBody), updatedAt: Date.now() })
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

const getBoards = async (userId, page, limit, q) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!limit) limit = DEFAULT_LIMIT

    return await boardModel.getBoards(userId, parseInt(page, 10), parseInt(limit, 10), q)
  } catch (error) { throw error }
}

const uploadCoverImage = async (file) => {
  try {
    const result = await cloudinaryProvider.streamUpload(file.buffer, 'BoardCovers')
    const thumbnailUrl = result.secure_url.replace(
      /\/upload\//,
      '/upload/w_300,h_140,c_fill/'
    )

    return {
      cover: result.secure_url,
      cover_thumb: thumbnailUrl
    }
  } catch (error) { throw error }
}

export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardToDiffCol,
  getBoards,
  uploadCoverImage
}