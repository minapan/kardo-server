export const inviteUserToBoardSocket = (socket) => {
  // Listening to events
  socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
    // Emit to all clients except the sender
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })
}
