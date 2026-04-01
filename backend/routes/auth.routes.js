const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');
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

module.exports = router;
