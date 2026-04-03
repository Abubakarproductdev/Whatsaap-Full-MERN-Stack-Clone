const Conversation = require('../models/conversation');
const Message = require('../models/message');
const { uploadToCloudinary } = require('../config/cloudinaryConfig');
const User = require('../models/User');
const { getIO, getReceiverSocketId } = require('../services/socket');

// ================================
// SEND MESSAGE
// ================================

exports.sendMessage = async (req, res) => {
  const senderId = req.user._id;
  const file = req.file;
  const { receiverEmail, receiverPhone, content } = req.body;

  if (!receiverEmail && !receiverPhone) {
    return res.status(400).json({
      success: false,
      message: 'Receiver email or phone number is required',
    });
  }

  try {
    const receiver = await findReceiver(receiverEmail, receiverPhone);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    const receiverId = receiver._id;

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself',
      });
    }

    const { mediaUrl, contentType } = await processMessageContent(file, content, res);
    if (!contentType) return;

    const conversation = await findOrCreateConversation(senderId, receiverId);
    const receiverSocketId = getReceiverSocketId(receiverId);

    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: contentType === 'text' ? content.trim() : '',
      ImageOrVideoUrl: mediaUrl,
      contentType,
      messageStatus: receiverSocketId ? 'delivered' : 'sent',
    });

    await newMessage.save();

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .lean();

    const io = getIO();

    io.to(conversation._id.toString()).emit('newMessage', {
      conversationId: conversation._id,
      message: populatedMessage,
    });

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', {
        conversationId: conversation._id,
        message: populatedMessage,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: newMessage._id,
        conversationId: conversation._id,
        sender: newMessage.sender,
        receiver: newMessage.receiver,
        content: newMessage.content,
        imageOrVideoUrl: newMessage.ImageOrVideoUrl,
        contentType: newMessage.contentType,
        messageStatus: newMessage.messageStatus,
        createdAt: newMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// ================================
// GET ALL CONVERSATIONS
// ================================

/**
 * Get all conversations for the logged-in user.
 * Returns: other user's info, last message, and unread count.
 */
exports.getConversations = async (req, res) => {
  const userId = req.user._id;

  try {
    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate('participants', 'username profilePicture isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'content contentType sender receiver messageStatus createdAt ImageOrVideoUrl',
      })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUser = conversation.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );

        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          receiver: userId,
          messageStatus: { $ne: 'read' },
        });

        return {
          conversationId: conversation._id,
          user: {
            id: otherUser._id,
            username: otherUser.username,
            profilePicture: otherUser.profilePicture || null,
            isOnline: otherUser.isOnline,
            lastSeen: otherUser.lastSeen,
          },
          lastMessage: conversation.lastMessage || null,
          unreadCount,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error('Error in getConversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message,
    });
  }
};

// ================================
// GET MESSAGES (Auto marks as read)
// ================================

/**
 * Get all messages for a conversation.
 * Automatically marks messages as read.
 */
exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      message: 'Conversation ID is required',
    });
  }

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .sort({ createdAt: 1 })
      .lean();

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

    const io = getIO();
    io.to(conversationId.toString()).emit('messagesRead', {
      conversationId,
      readBy: userId,
    });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message,
    });
  }
};

// ================================
// DELETE CONVERSATION
// ================================

exports.deleteConversation = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      message: 'Conversation ID is required',
    });
  }

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    const io = getIO();
    io.to(conversationId.toString()).emit('conversationDeleted', {
      conversationId,
    });

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: error.message,
    });
  }
};

// ================================
// DELETE MESSAGE
// ================================

exports.deleteMessage = async (req, res) => {
  const userId = req.user._id;
  const { messageId } = req.params;

  if (!messageId) {
    return res.status(400).json({
      success: false,
      message: 'Message ID is required',
    });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
      });
    }

    const conversationId = message.conversationId;

    await Message.findByIdAndDelete(messageId);
    await updateLastMessage(conversationId);

    const io = getIO();
    io.to(conversationId.toString()).emit('messageDeleted', {
      conversationId,
      messageId,
    });

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
};

// ================================
// HELPER FUNCTIONS
// ================================

async function updateLastMessage(conversationId) {
  const lastMessage = await Message.findOne({ conversationId })
    .sort({ createdAt: -1 })
    .lean();

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: lastMessage ? lastMessage._id : null,
  });
}

async function processMessageContent(file, content, res) {
  let mediaUrl = null;
  let contentType = null;

  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer, 'chat_media');

    if (!uploadResult?.secure_url) {
      res.status(400).json({
        success: false,
        message: 'Failed to upload media',
      });
      return { mediaUrl: null, contentType: null };
    }

    mediaUrl = uploadResult.secure_url;

    if (file.mimetype.startsWith('image')) {
      contentType = 'image';
    } else if (file.mimetype.startsWith('video')) {
      contentType = 'video';
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported file type. Only images and videos are allowed.',
      });
      return { mediaUrl: null, contentType: null };
    }
  } else if (content && content.trim()) {
    contentType = 'text';
  } else {
    res.status(400).json({
      success: false,
      message: 'Message content is required (text, image, or video)',
    });
    return { mediaUrl: null, contentType: null };
  }

  return { mediaUrl, contentType };
}

async function findOrCreateConversation(senderId, receiverId) {
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = new Conversation({
      participants: [senderId, receiverId],
    });
    await conversation.save();
  }

  return conversation;
}

async function findReceiver(email, phone) {
  if (email) {
    return await User.findOne({ email: email.trim().toLowerCase() });
  }
  if (phone) {
    return await User.findOne({ phoneNumber: phone.trim() });
  }
  return null;
}