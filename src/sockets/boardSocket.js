// export const inviteUserToBoardSocket = (socket) => {
//   // Listening to events
//   socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
//     // Emit to all clients except the sender
//     socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
//   })
// }

export const boardSocket = (socket) => {
  const joinedBoards = new Set()

  socket.on('disconnect', () => {
    // console.log(`Client ${socket.id} disconnected`)
    joinedBoards.forEach(boardId => {
      socket.leave(boardId)
    })
    joinedBoards.clear()
  })

  socket.on('FE_USER_JOINED_ROOM', (boardId) => {
    if (joinedBoards.has(boardId)) {
      // console.log(`BE Client ${socket.id} already in room ${boardId}`)
      return
    }

    socket.join(boardId)
    joinedBoards.add(boardId)
    // console.log(`BE Client ${socket.id} joined room ${boardId}`)

    // socket.broadcast.to(boardId).emit('BE_USER_JOINED_ROOM', socket.id)
  })

  socket.on('FE_USER_LEFT_ROOM', (boardId) => {
    socket.leave(boardId)
    joinedBoards.delete(boardId)
    // console.log(`BE Client ${socket.id} left room ${boardId}`)
  })

  socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })

  socket.on('FE_USER_ACCEPTED_INVITATION', ({ boardId, user }) => {
    if (!joinedBoards.has(boardId)) {
      socket.join(boardId)
      joinedBoards.add(boardId)
      // console.log(`BE Client ${socket.id} - User ${user._id} joined room ${boardId}`)
    }

    socket.broadcast.to(boardId).emit('BE_USER_ACCEPTED_INVITATION', user)
  })

  socket.on('FE_CREATED_NEW_COLUMN', ({ createdCol, boardId }) => {
    socket.broadcast.to(boardId).emit('BE_CREATED_NEW_COLUMN', createdCol)
  })

  socket.on('FE_DELETED_COLUMN', ({ deletedColId, boardId }) => {
    socket.broadcast.to(boardId).emit('BE_DELETED_COLUMN', deletedColId)
  })

  socket.on('FE_CREATED_NEW_CARD', ({ createdCard, boardId }) => {
    socket.broadcast.to(boardId).emit('BE_CREATED_NEW_CARD', createdCard)
  })

  socket.on('FE_MOVED_COLUMNS', ({ boardId, dndOrderedColumnIds, dndOrderedColumns }) => {
    socket.broadcast.to(boardId).emit('BE_MOVED_COLUMNS', { dndOrderedColumnIds, dndOrderedColumns })
  })

  socket.on('FE_MOVED_CARDS_IN_SAME_COLUMN', ({ boardId, columnId, dndOrderedCardIDs, dndOrderedCards }) => {
    socket.broadcast.to(boardId).emit('BE_MOVED_CARDS_IN_SAME_COLUMN',
      { columnId, dndOrderedCardIDs, dndOrderedCards })
  })

  socket.on('FE_MOVED_CARD_TO_DIFF_COLUMN', ({ boardId, dndOrderedColumnIds, dndOrderedColumns }) => {
    socket.broadcast.to(boardId).emit('BE_MOVED_CARD_TO_DIFF_COLUMN',
      { dndOrderedColumnIds, dndOrderedColumns })
  })

  socket.on('FE_UPDATED_CARD', ({ boardId, updatedCard }) => {
    socket.broadcast.to(boardId).emit('BE_UPDATED_CARD', updatedCard)
  })

  socket.on('FE_UPDATED_BOARD_LABELS', ({ boardId, labels }) => {
    socket.broadcast.to(boardId).emit('BE_UPDATED_BOARD_LABELS', labels)
  })
}