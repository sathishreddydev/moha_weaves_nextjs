const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const jwt = require('jsonwebtoken');
const { initializeSocketServer } = require('./realtime/socket-server');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create HTTP server
const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    res.statusCode = 500;
    res.end('internal server error');
  }
});

// Initialize Socket.IO
const io = initializeSocketServer(server);

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.user = null;
      return next();
    }

    if (token === process.env.BRIDGE_TOKEN) {
      socket.isBridge = true;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

// REAL-TIME ORDER EVENTS
io.on('connection', (socket) => {
  const authenticatedSocket = socket;


  // Join user-specific room for regular users
  if (authenticatedSocket.user) {
    const { userId, role } = authenticatedSocket.user;
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
  }


  socket.on('disconnect', () => {
  });
});

app.prepare().then(() => {
  server.listen(port, (err) => {
    if (err) throw err;
  });
}).catch((err) => {
  process.exit(1);
});
