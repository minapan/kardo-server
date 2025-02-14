/* eslint-disable no-useless-catch */
import { boardModel } from '~/models/boardModel'
import { slugify } from '~/utils/formatters'

const createNew = async (reqBody) => {
  try {
    // Create a new board with the slugified title
    const createdBoard = await boardModel.createNew({
      ...reqBody,
      slug: slugify(reqBody.title)
    })

    // Update the slug with the insertedId
    await boardModel.updateById(createdBoard.insertedId, {
      slug: `${slugify(reqBody.title)}-${createdBoard.insertedId.toString()}`
    })

    // Service always must return a value
    return await boardModel.findOneById(createdBoard.insertedId)
  } catch (error) { throw error }
}

export const boardService = {
  createNew
}