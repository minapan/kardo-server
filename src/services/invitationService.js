import { StatusCodes } from 'http-status-codes'
import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { BOARD_INVITATION_STATUS, INVITATION_TYPES } from '~/utils/constants'
import { pickUser } from '~/utils/formatters'

const createNew = async (reqBody, inviterId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const inviter = await userModel.findOneById(inviterId)
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)
    const board = await boardModel.findOneById(reqBody.boardId)

    if (!inviter) throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter not found')
    if (!invitee) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitee not found')
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

    const invitation = {
      inviterId,
      inviteeId: invitee._id.toString(),
      type: INVITATION_TYPES.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING
      }
    }

    const createdInvitation = await invitationModel.createNew(invitation)
    const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId.toString())

    return {
      ...getInvitation,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee),
      board
    }
  } catch (error) { throw error }
}

export const invitationService = {
  createNew
}