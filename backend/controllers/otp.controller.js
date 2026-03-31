const User = require('../models/User');
const otpService = require('../services/otp.service');

// Utility to format phone number to E.164 if missing
const formatPhoneNumber = (phoneNumber) => {
  let numStr = String(phoneNumber).trim();
  if (numStr && !numStr.startsWith('+')) {
    return '+' + numStr;
  }
  return numStr;
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send an OTP to the given phone number.
 */
exports.sendOtp = async (req, res) => {
  let { phoneNumber, suffix, countryCode } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  let codePrefix = suffix || countryCode || '';
  if (codePrefix) {
    codePrefix = String(codePrefix).trim();
    if (!codePrefix.startsWith('+')) codePrefix = '+' + codePrefix;
    if (!String(phoneNumber).trim().startsWith('+')) {
      phoneNumber = codePrefix + String(phoneNumber).trim();
    }
  }

  phoneNumber = formatPhoneNumber(phoneNumber);

  try {
    let user = await User.findOne({ phoneNumber });
    let otpCode = generateOTP();

    // Send the OTP via Twilio
    // Note: if process.env.TWILIO_VERIFY_SID is active, otpCode passed is ignored by the service.
    await otpService.sendOtp(phoneNumber, otpCode);

    // For DB Fallback: We need to store the otp sent if we aren't using Twilio's builtin Verify Service
    if (!process.env.TWILIO_VERIFY_SID) {
      if (!user) {
        // Create the user early to store the OTP if we don't have Twilio Verify Service handling state
        user = new User({
          phoneNumber,
          phoneOtp: otpCode,
          optExpiry: Date.now() + 10 * 60 * 1000, // Expires in 10 minutes
        });
        await user.save();
      } else {
        user.phoneOtp = otpCode;
        user.optExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();
      }
    }

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};

/**
 * Verify the OTP sent to the phone number.
 */
exports.verifyOtp = async (req, res) => {
  let { phoneNumber, code, suffix, countryCode } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({ success: false, message: 'Phone number and code are required' });
  }

  let codePrefix = suffix || countryCode || '';
  if (codePrefix) {
    codePrefix = String(codePrefix).trim();
    if (!codePrefix.startsWith('+')) codePrefix = '+' + codePrefix;
    if (!String(phoneNumber).trim().startsWith('+')) {
      phoneNumber = codePrefix + String(phoneNumber).trim();
    }
  }

  phoneNumber = formatPhoneNumber(phoneNumber);

  try {
    let isVerified = false;

    // First attempt to verify via Twilio Service (if configured)
    const twilioStatus = await otpService.verifyOtpTwilioService(phoneNumber, code);

    if (twilioStatus !== null) {
      isVerified = twilioStatus;
    } else {
      // Fallback: Check standard database-stored OTP
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No OTP generated for this phone number' });
      }

      if (user.phoneOtp === String(code) && user.optExpiry > Date.now()) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP Successfully Verified!
    // Make sure User exists (if we were using Twilio Verify and they didn't exist yet)
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        // Creating a placeholder username so unique sparse index or general username references won't fail
        username: 'user_' + Math.floor(100000 + Math.random() * 900000),
      });
      await user.save();
    } else {
      // Clear the OTP fields using the DB fallback
      if (user.phoneOtp) {
        user.phoneOtp = '';
        await user.save();
      }
    }

    // In a real application, issue a JSON Web Token here
    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
};
