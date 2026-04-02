const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');
// @route   POST /api/auth/send-otp
// ---- Chat Routes (Protected) ----
router.post('/send-message', authMiddleware, upload.single('file'), chatController.sendMessage);
router.get('/messages/:conversationId', authMiddleware, chatController.getMessages);


module.exports = router;