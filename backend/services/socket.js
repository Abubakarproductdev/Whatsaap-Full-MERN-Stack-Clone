const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/message');

let io;
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
      const token = cookies.token;

      if (!token) {
        return next(new Error('Authentication error: No token found'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

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
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    io.emit('userOnlineStatus', {
      userId,
      isOnline: true,
    });

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('typing', ({ conversationId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', {
          conversationId,
          userId,
        });
      }
    });

    socket.on('stopTyping', ({ conversationId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stopTyping', {
          conversationId,
          userId,
        });
      }
    });

    socket.on('markMessagesAsRead', async ({ conversationId }) => {
      try {
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

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          io.to(conversationId).emit('messagesRead', {
            conversationId,
            readBy: userId,
          });
        }
      } catch (error) {
        console.error('Socket markMessagesAsRead error:', error);
      }
    });

    socket.on('disconnect', async () => {
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
  return onlineUsers.get(userId.toString());
};

module.exports = {
  initSocket,
  getIO,
  getReceiverSocketId,
};