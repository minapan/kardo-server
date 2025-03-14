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

const getInvitations = async (userId) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const results = await invitationModel.findByUser(userId)

    // Format the data to Json object for the frontend
    const invitations = results.map(invitation => ({
      ...invitation,
      inviter: invitation.inviter[0] || {},
      invitee: invitation.invitee[0] || {},
      board: invitation.board[0] || {}
    }))

    return invitations
  } catch (error) { throw error }
}

const update = async (userId, invitationId, status) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const invitation = await invitationModel.findOneById(invitationId)

    if (!invitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found')
    if (invitation.inviteeId.toString() !== userId) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are not the invitee of this invitation')
    if (invitation.boardInvitation.status !== BOARD_INVITATION_STATUS.PENDING) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invitation already accepted or rejected')

    const board = await boardModel.findOneById(invitation.boardInvitation.boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

    const boardOwnerAndMemberIds = [...board.ownerIds, ...board.memberIds].toString()
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && boardOwnerAndMemberIds.includes(userId))
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a member of this board')

    const updatedInvitation = await invitationModel.update(
      invitationId,
      {
        boardInvitation: {
          ...invitation.boardInvitation,
          status
        },
        updatedAt: new Date()
      }
    )

    if (updatedInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
      await boardModel.pushMemberIds(invitation.boardInvitation.boardId, userId)
    }

    return updatedInvitation
  } catch (error) { throw error }
}

export const invitationService = {
  createNew,
  getInvitations,
  update
}