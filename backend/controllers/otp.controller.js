const User = require('../models/User');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const { generateOTP, buildFullPhoneNumber, isValidEmail } = require('../utils/otpgeneration');
const generateWebToken = require('../utils/genrateWebtoken');

const OTP_EXPIRY_DURATION = 10 * 60 * 1000; // 10 minutes
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}

function setAuthCookies(res, token) {
  const cookieOptions = getCookieOptions();
  res.cookie('auth_token', token, cookieOptions);
}

// ================================
// SEND OTP ENDPOINT
// ================================

exports.sendOtp = async (req, res) => {
  const { email, phoneNumber: rawPhone, suffix, countryCode } = req.body;

  const method = email ? 'email' : rawPhone ? 'phone' : null;
  if (!method) {
    return res.status(400).json({
      success: false,
      message: 'Either email OR phone number is required',
    });
  }

  try {
    const otpCode = generateOTP();
    const otpExpiry = Date.now() + OTP_EXPIRY_DURATION;

    if (method === 'email') {
      await handleEmailSend(email, otpCode, otpExpiry);
    } else {
      await handlePhoneSend(rawPhone, suffix, countryCode, otpCode, otpExpiry);
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${method} successfully`,
    });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// ================================
// VERIFY OTP ENDPOINT
// ================================

exports.verifyOtp = async (req, res) => {
  const { email, phoneNumber: rawPhone, code, suffix, countryCode } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'OTP code is required' });
  }

  const method = email ? 'email' : rawPhone ? 'phone' : null;
  if (!method) {
    return res.status(400).json({
      success: false,
      message: 'Either email OR phone number is required',
    });
  }

  try {
    const user = await verifyByMethod(method, method === 'email' ? email : {
      rawPhone,
      suffix,
      countryCode,
    }, code);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await completeVerification(user);

    const token = generateWebToken(user._id);
    setAuthCookies(res, token);

    return res.status(200).json({
      success: true,
      message: `${method} verified successfully`,
      user: {
        id: user._id,
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
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

// ================================
// HELPER FUNCTIONS
// ================================

async function handleEmailSend(email, otpCode, otpExpiry) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const normalizedEmail = email.trim().toLowerCase();

  await emailService.sendOtpEmail(normalizedEmail, otpCode);

  await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        EmailOtp: otpCode,
        optExpiry: otpExpiry,
      },
      $setOnInsert: {
        email: normalizedEmail,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
}

async function handlePhoneSend(rawPhone, suffix, countryCode, otpCode, otpExpiry) {
  const phoneNumber = buildFullPhoneNumber(rawPhone, suffix, countryCode);

  await otpService.sendOtp(phoneNumber, otpCode);

  if (!process.env.TWILIO_SERVICE_SID) {
    await User.findOneAndUpdate(
      { phoneNumber },
      {
        $set: {
          phoneOtp: otpCode,
          optExpiry: otpExpiry,
        },
        $setOnInsert: {
          phoneNumber,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
  }
}

async function verifyByMethod(method, identifier, code) {
  let user = null;

  if (method === 'email') {
    if (!isValidEmail(identifier)) {
      throw new Error('Invalid email format');
    }

    const normalizedEmail = identifier.trim().toLowerCase();
    user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error('No OTP generated for this email');
    }

    // ✅ Check EmailOtp and optExpiry (matching your model)
    if (user.EmailOtp !== String(code) || user.optExpiry <= Date.now()) {
      return null;
    }

  } else {
    const phoneNumber = buildFullPhoneNumber(
      identifier.rawPhone,
      identifier.suffix,
      identifier.countryCode
    );

    const twilioStatus = await otpService.verifyOtpTwilioService(phoneNumber, code);

    if (twilioStatus !== null) {
      user = await User.findOne({ phoneNumber });
      if (!user) {
        user = new User({ phoneNumber });
      }
      return user;
    }

    user = await User.findOne({ phoneNumber });
    if (!user) {
      throw new Error('No OTP generated for this phone number');
    }

    // ✅ Check phoneOtp and optExpiry (matching your model)
    if (user.phoneOtp !== String(code) || user.optExpiry <= Date.now()) {
      return null;
    }
  }

  return user;
}

async function completeVerification(user) {
  user.EmailOtp = '';
  user.phoneOtp = '';
  user.isVerified = true;

  // No unique check needed — duplicates are allowed
  if (!user.username) {
    user.username = 'user_' + generateOTP();
  }

  await user.save();
  return user;
}
