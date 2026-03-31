const User = require('../models/User');
const otpService = require('../services/otp.service');
const { generateOTP, buildFullPhoneNumber } = require('../utils/otpgeneration');
const generateWebToken = require('../utils/genrateWebtoken');

const OTP_EXPIRY_DURATION = 10 * 60 * 1000; // 10 minutes
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

/**
 * Send an OTP to the given phone number.
 */
exports.sendOtp = async (req, res) => {
  const { phoneNumber: rawPhone, suffix, countryCode } = req.body;

  if (!rawPhone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const phoneNumber = buildFullPhoneNumber(rawPhone, suffix, countryCode);

  try {
    const otpCode = generateOTP();

    await otpService.sendOtp(phoneNumber, otpCode);

    // DB Fallback: Store OTP only when NOT using Twilio's Verify Service
    if (!process.env.TWILIO_SERVICE_SID) {
      const otpData = {
        phoneOtp: otpCode,
        optExpiry: Date.now() + OTP_EXPIRY_DURATION,
      };

      let user = await User.findOne({ phoneNumber });

      if (!user) {
        user = new User({ phoneNumber, ...otpData });
      } else {
        Object.assign(user, otpData);
      }

      await user.save();
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

/**
 * Verify the OTP sent to the phone number.
 */
exports.verifyOtp = async (req, res) => {
  const { phoneNumber: rawPhone, code, suffix, countryCode } = req.body;

  if (!rawPhone || !code) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and code are required',
    });
  }

  const phoneNumber = buildFullPhoneNumber(rawPhone, suffix, countryCode);

  try {
    let isVerified = false;

    const twilioStatus = await otpService.verifyOtpTwilioService(phoneNumber, code);

    if (twilioStatus !== null) {
      isVerified = twilioStatus;
    } else {
      const user = await User.findOne({ phoneNumber });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No OTP generated for this phone number',
        });
      }

      if (user.phoneOtp === String(code) && user.optExpiry > Date.now()) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = new User({
        phoneNumber,
        username: 'user_' + generateOTP(),
      });
      await user.save();
    } else if (user.phoneOtp) {
      user.phoneOtp = '';
      await user.save();
    }

    // Generate JWT and set it as an HTTP-only cookie
    const token = generateWebToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
    });

    // Send response AFTER setting the cookie
    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        username: user.username,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};