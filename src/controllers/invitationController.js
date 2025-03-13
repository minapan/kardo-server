import { StatusCodes } from 'http-status-codes'
import { invitationService } from '~/services/invitationService'

const createNew = async (req, res, next) => {
  try {
    const createdInvitation = await invitationService.createNew(req.body, req.jwtDecoded._id)
    res.status(StatusCodes.CREATED).json(createdInvitation)
  } catch (error) { next(error) }
}

export const invitationController = { createNew }