const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_SERVICE_SID;         // If using Twilio Verify Service
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // If using regular Programmable SMS

let client;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (error) {
    console.error("Twilio client initialization failed:", error.message);
  }
}

/**
 * Send an OTP to a phone number. 
 * Automatically uses Twilio Verify if TWILIO_VERIFY_SID is present.
 * Otherwise, falls back to sending a regular SMS with a passed code.
 */
const sendOtp = async (phoneNumber, otpCode = null) => {
  if (!client) {
    console.log(`[MOCK OTP] Would send to ${phoneNumber}: Code ${otpCode}`);
    return { status: 'mocked' };
  }

  try {
    if (verifySid) {
      // Using Twilio Verify Service (Best Practice)
      const verification = await client.verify.v2.services(verifySid)
        .verifications
        .create({ to: phoneNumber, channel: 'sms' });
      return verification;
    } else {
      // Fallback: Using basic Programmable SMS
      if (!twilioPhoneNumber) {
        throw new Error("TWILIO_PHONE_NUMBER is required in .env to use programmable SMS fallback");
      }
      const message = await client.messages.create({
        body: `Your WhatsApp Clone verification code is: ${otpCode}. Do not share this code with anyone.`,
        from: twilioPhoneNumber,
        to: phoneNumber,
      });
      return message;
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

/**
 * Verifies an OTP if using Twilio Verify API.
 * Returns null if we should fall back to database manual verification.
 */
const verifyOtpTwilioService = async (phoneNumber, code) => {
  if (client && verifySid) {
    try {
      const verificationCheck = await client.verify.v2.services(verifySid)
        .verificationChecks
        .create({ to: phoneNumber, code: code });

      return verificationCheck.status === 'approved';
    } catch (error) {
      console.error('Error verifying OTP with Twilio verify:', error);
      throw error;
    }
  }
  return null; // Use DB fallback
};

module.exports = {
  sendOtp,
  verifyOtpTwilioService
};
