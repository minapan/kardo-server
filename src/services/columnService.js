/* eslint-disable no-useless-catch */
import { boardModel } from '~/models/boardModel'
import { columnModel } from '~/models/columnModel'

const createNew = async (reqBody) => {
  try {
    const createdColumn = await columnModel.createNew({ ...reqBody })

    const getNewCol = await columnModel.findOneById(createdColumn.insertedId)

    if (getNewCol) {
      getNewCol.cards = []
      await boardModel.pushColumnOrderIds(getNewCol)
    }

    return getNewCol
  } catch (error) { throw error }
}

export const columnService = {
  createNew
}