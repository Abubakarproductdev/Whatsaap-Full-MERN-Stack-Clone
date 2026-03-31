const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');

// @route   POST /api/auth/send-otp
// @desc    Send an OTP via message to the user's phone number
// @access  Public
router.post('/send-otp', otpController.sendOtp);

// @route   POST /api/auth/verify-otp
// @desc    Verify the received OTP and log user in / sign up
// @access  Public
router.post('/verify-otp', otpController.verifyOtp);

module.exports = router;
