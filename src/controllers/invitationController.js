import { StatusCodes } from 'http-status-codes'
import { invitationService } from '~/services/invitationService'

const createNew = async (req, res, next) => {
  try {
    const createdInvitation = await invitationService.createNew(req.body, req.jwtDecoded._id)
    res.status(StatusCodes.CREATED).json(createdInvitation)
  } catch (error) { next(error) }
}

const getInvitations = async (req, res, next) => {
  try {
    const invitations = await invitationService.getInvitations(req.jwtDecoded._id)
    res.status(StatusCodes.OK).json(invitations)
  } catch (error) { next(error) }
}

const update = async (req, res, next) => {
  try {
    const updatedInvitation = await invitationService.update(
      req.jwtDecoded._id,
      req.params.invitationId,
      req.body.status
    )
    res.status(StatusCodes.OK).json(updatedInvitation)
  } catch (error) { next(error) }
}

export const invitationController = {
  createNew,
  getInvitations,
  update
}