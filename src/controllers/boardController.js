import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    const createdBoard = await boardService.createNew(req.jwtDecoded._id, req.body)
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) { next(error) }
}

const getDetails = async (req, res, next) => {
  try {
    const board = await boardService.getDetails(req.params.id, req.jwtDecoded._id)
    res.status(StatusCodes.OK).json(board)
  } catch (error) { next(error) }
}

const update = async (req, res, next) => {
  try {
    const updatedBoard = await boardService.update(req.params.id, req.body)
    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) { next(error) }
}

const moveCardToDiffCol = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDiffCol(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const getBoards = async (req, res, next) => {
  try {
    const { page, limit, q } = req.query
    const boards = await boardService.getBoards(req.jwtDecoded._id, page, limit, q)
    res.status(StatusCodes.OK).json(boards)
  } catch (error) { next(error) }
}

const uploadCoverImage = async (req, res, next) => {
  try {
    const result = await boardService.uploadCoverImage(req.file)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const boardController = {
  createNew,
  getDetails,
  update,
  moveCardToDiffCol,
  getBoards,
  uploadCoverImage
}
