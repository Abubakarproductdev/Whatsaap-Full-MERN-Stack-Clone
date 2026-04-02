const Conversation = require('../models/Conversation');
const Message = require('../models/message');
const { uploadToCloudinary } = require('../config/cloudinaryConfig');

// ================================
// SEND MESSAGE
// ================================

/**
 * Send a message — supports text, image, and video.
 * Creates a new conversation if one doesn't exist.
 * Requires authentication.
 */
exports.sendMessage = async (req, res) => {
  const senderId = req.user._id;
  const { receiverId, content } = req.body;
  const file = req.file;

  if (!receiverId) {
    return res.status(400).json({
      success: false,
      message: 'Receiver ID is required',
    });
  }

  if (senderId.toString() === receiverId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot send message to yourself',
    });
  }

  try {
    // Determine content type and handle file upload
    const { mediaUrl, contentType } = await processMessageContent(file, content, res);

    // If processMessageContent returned null, response was already sent
    if (!contentType) return;

    // Find or create conversation
    const conversation = await findOrCreateConversation(senderId, receiverId);

    // Create the message
    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: contentType === 'text' ? content.trim() : '',
      imageOrVideoUrl: mediaUrl,
      contentType,
      messageStatus: 'sent',
    });

    await newMessage.save();

    // Update conversation with last message
    conversation.lastMessage = newMessage._id;
    conversation.unreadCount += 1;
    await conversation.save();

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: newMessage._id,
        conversationId: conversation._id,
        sender: newMessage.sender,
        receiver: newMessage.receiver,
        content: newMessage.content,
        imageOrVideoUrl: newMessage.imageOrVideoUrl,
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
// GET MESSAGES
// ================================

/**
 * Get all messages for a specific conversation.
 * Requires authentication.
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
    // Verify user is part of this conversation
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

    // Get all messages for this conversation
    const messages = await Message.find({ conversationId })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    // Reset unread count since user is viewing the messages
    conversation.unreadCount = 0;
    await conversation.save();

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
// HELPER FUNCTIONS
// ================================

/**
 * Process message content — handle file upload or text.
 * @param {Object} file - Multer file object (from req.file).
 * @param {string} content - Text content from req.body.
 * @param {Object} res - Express response (to send error if needed).
 * @returns {{ mediaUrl: string|null, contentType: string|null }}
 */
async function processMessageContent(file, content, res) {
  let mediaUrl = null;
  let contentType = null;

  if (file) {
    // ---- File Upload ----
    const uploadResult = await uploadToCloudinary(file.buffer, 'chat_media');

    if (!uploadResult?.secure_url) {
      res.status(400).json({
        success: false,
        message: 'Failed to upload media',
      });
      return { mediaUrl: null, contentType: null };
    }

    mediaUrl = uploadResult.secure_url;

    // Detect content type from mimetype
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
    // ---- Text Message ----
    contentType = 'text';
  } else {
    // ---- No Content ----
    res.status(400).json({
      success: false,
      message: 'Message content is required (text, image, or video)',
    });
    return { mediaUrl: null, contentType: null };
  }

  return { mediaUrl, contentType };
}

/**
 * Find existing conversation or create a new one.
 * @param {ObjectId} senderId
 * @param {ObjectId} receiverId
 * @returns {Document} - Conversation document.
 */
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