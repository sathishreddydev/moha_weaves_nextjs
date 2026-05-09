const { Server } = require('socket.io')

let io = null

const initializeSocketServer = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: ['http://localhost:3000', 'http://103.127.146.58:3000'],
        credentials: true,
      },
    })
  }
  return io
}

const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket server not initialized. Call initializeSocketServer first.')
  }
  return io
}

module.exports = {
  initializeSocketServer,
  getSocketServer,
  io
}
