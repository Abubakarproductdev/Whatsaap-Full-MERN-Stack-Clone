const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/User');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

let io;
const onlineUsers = new Map(); // userId -> Set<socketId>

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const initSocket = (server) => {
  const allowedOrigins = (
    process.env.CLIENT_URLS
      ? process.env.CLIENT_URLS.split(',').map((o) => o.trim()).filter(Boolean)
      : DEFAULT_ALLOWED_ORIGINS
  );

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error('Authentication error: No cookie found'));
      }

      const cookies = cookie.parse(cookieHeader);
      const token = cookies.auth_token || cookies.token;

      if (!token) {
        return next(new Error('Authentication error: No token found'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId;
      const user = await User.findById(userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = {
        _id: user._id.toString(),
        username: user.username,
      };

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id;

    // Multi-session: add this socket to the user's set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    io.emit('userOnlineStatus', {
      userId,
      isOnline: true,
    });

    // Room authorization: only join if user is a participant
    socket.on('joinConversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: { $in: [userId] },
        });
        if (conversation) {
          socket.join(conversationId);
        }
      } catch (error) {
        console.error('joinConversation auth error:', error);
      }
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('typing', ({ conversationId, receiverId }) => {
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        for (const sid of receiverSockets) {
          io.to(sid).emit('typing', {
            conversationId,
            userId,
          });
        }
      }
    });

    socket.on('stopTyping', ({ conversationId, receiverId }) => {
      const receiverSockets = onlineUsers.get(receiverId);
      if (receiverSockets) {
        for (const sid of receiverSockets) {
          io.to(sid).emit('stopTyping', {
            conversationId,
            userId,
          });
        }
      }
    });

    // Authorization check: only mark as read if user belongs to conversation
    socket.on('markMessagesAsRead', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: { $in: [userId] },
        });

        if (!conversation) return;

        await Message.updateMany(
          {
            conversationId,
            receiver: userId,
            messageStatus: { $ne: 'read' },
          },
          {
            $set: { messageStatus: 'read' },
          }
        );

        io.to(conversationId).emit('messagesRead', {
          conversationId,
          readBy: userId,
        });
      } catch (error) {
        console.error('Socket markMessagesAsRead error:', error);
      }
    });

    // Multi-session disconnect: only mark offline when last socket gone
    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          io.emit('userOnlineStatus', {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const getReceiverSocketId = (userId) => {
  const sockets = onlineUsers.get(userId.toString());
  if (sockets && sockets.size > 0) {
    return [...sockets][0]; // Return first socket for delivery
  }
  return undefined;
};

const getReceiverSocketIds = (userId) => {
  const sockets = onlineUsers.get(userId.toString());
  return sockets ? [...sockets] : [];
};

module.exports = {
  initSocket,
  getIO,
  getReceiverSocketId,
  getReceiverSocketIds,
};