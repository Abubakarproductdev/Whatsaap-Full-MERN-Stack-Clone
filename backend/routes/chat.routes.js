const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');
const chatController = require('../controllers/chat.controller');
// @route   POST /api/auth/send-otp
// ---- Chat Routes (Protected) ----
router.get('/conversations', authMiddleware, chatController.getConversations);
router.get('/messages/:conversationId', authMiddleware, chatController.getMessages);
router.delete('/conversation/:conversationId', authMiddleware, chatController.deleteConversation);
router.delete('/message/:messageId', authMiddleware, chatController.deleteMessage);

module.exports = router;