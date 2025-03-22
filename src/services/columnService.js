/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import ApiError from '~/utils/ApiError'
import { checkAndCleanProfanity } from '~/utils/badWordsFilter'

const createNew = async (reqBody) => {
  try {
    const createdColumn = await columnModel.createNew({ ...checkAndCleanProfanity(reqBody) })

    const getNewCol = await columnModel.findOneById(createdColumn.insertedId)

    if (getNewCol) {
      getNewCol.cards = []
      await boardModel.pushColumnOrderIds(getNewCol)
    }

    return getNewCol
  } catch (error) { throw error }
}

const update = async (id, reqBody) => {
  try {
    return await columnModel.update(id, { ...checkAndCleanProfanity(reqBody), updatedAt: Date.now() })
  } catch (error) { throw error }
}

const deleteItem = async (id) => {
  try {
    const targetCol = await columnModel.findOneById(id)

    if (!targetCol) { throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found!') }

    await columnModel.deleteOneById(id)
    await cardModel.deleteManyByColId(id)
    await boardModel.pullColumnOrderIds(targetCol)

    return { deleteResult: 'Column and its cards deleted successfully!' }
  } catch (error) { throw error }
}

export const columnService = {
  createNew,
  deleteItem,
  update
}