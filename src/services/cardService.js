/* eslint-disable no-useless-catch */
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { cloudinaryProvider } from '~/providers/cloudinaryProvider'

const createNew = async (reqBody) => {
  try {
    const createdCard = await cardModel.createNew({ ...reqBody })

    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)
    }

    return getNewCard
  } catch (error) { throw error }
}

const update = async (id, reqBody, cardCover, user) => {
  try {
    let updatedCard = {}

    if (cardCover) {
      const result = await cloudinaryProvider.streamUpload(cardCover.buffer, 'CardCovers')

      updatedCard = await cardModel.update(id, { cover: result.secure_url, updatedAt: Date.now() })
    }
    else if (reqBody.commentToAdd) {
      const commentData = {
        ...reqBody.commentToAdd,
        commentedAt: Date.now(),
        userId: user._id,
        userEmail: user.email
      }

      updatedCard = await cardModel.unshiftNewComment(id, commentData)
    }
    else if (reqBody.memberInfo) {
      updatedCard = await cardModel.updateMembers(id, reqBody.memberInfo)
    }
    else {
      updatedCard = await cardModel.update(id, { ...reqBody, updatedAt: Date.now() })
    }

    return updatedCard
  } catch (error) { throw error }
}

export const cardService = {
  createNew,
  update
}