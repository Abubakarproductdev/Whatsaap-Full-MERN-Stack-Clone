const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');
const chatController = require('../controllers/chat.controller');
// @route   POST /api/auth/send-otp
// @desc    Send an OTP via message to the user's phone number
// @access  Public
router.post('/send-otp', otpController.sendOtp);

// @route   POST /api/auth/verify-otp
// @desc    Verify the received OTP and log user in / sign up
// @access  Public
router.post('/verify-otp', otpController.verifyOtp);

// ---- Protected Routes (Auth required) ----
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/update-profile', authMiddleware, upload.single('profilePicture'), authController.updateProfile);
router.post('/logout', authMiddleware, authController.logout);
router.get('/all-users', authMiddleware, authController.getAllUsers);


//Chat routes
router.post('/send-message', authMiddleware, upload.single('file'), chatController.sendMessage);
router.get('/messages/:conversationId', authMiddleware, chatController.getMessages);
router.put('/mark-read/:conversationId', authMiddleware, chatController.markAsRead);
router.delete('/conversation/:conversationId', authMiddleware, chatController.deleteConversation);
router.delete('/message/:messageId', authMiddleware, chatController.deleteMessage);

module.exports = router;
