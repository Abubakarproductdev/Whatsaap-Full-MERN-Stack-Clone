const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP to the given email address.
 * @param {string} email - Recipient email address.
 * @param {string} otpCode - The OTP code to send.
 * @returns {Promise<object>} - Nodemailer send result.
 */
const sendOtpEmail = async (email, otpCode) => {
  const mailOptions = {
    from: `"${process.env.APP_NAME || 'MyApp'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification Code',
    text: `Your OTP verification code is: ${otpCode}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333; text-align: center;">Verification Code</h2>
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0;">
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; margin: 0;">
            ${otpCode}
          </p>
        </div>
        <p style="color: #666; text-align: center; font-size: 14px;">
          This code will expire in <strong>10 minutes</strong>.
        </p>
        <p style="color: #999; text-align: center; font-size: 12px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    return result;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email: ' + error.message);
  }
};

/**
 * Verify transporter connection (optional health check).
 * @returns {Promise<boolean>}
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email service connection failed:', error);
    return false;
  }
};

module.exports = {
  sendOtpEmail,
  verifyConnection,
};