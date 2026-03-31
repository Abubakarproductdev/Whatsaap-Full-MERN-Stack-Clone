/**
 * Format phone number to E.164 format (prepends '+' if missing).
 * @param {string|number} phoneNumber
 * @returns {string}
 */
const formatPhoneNumber = (phoneNumber) => {
  const numStr = String(phoneNumber).trim();
  if (numStr && !numStr.startsWith('+')) {
    return '+' + numStr;
  }
  return numStr;
};

/**
 * Generate a random 6-digit OTP string.
 * @returns {string}
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Resolve and prepend a country code prefix to a phone number.
 * @param {string|number} phoneNumber
 * @param {string} [suffix]
 * @param {string} [countryCode]
 * @returns {string}
 */
const buildFullPhoneNumber = (phoneNumber, suffix, countryCode) => {
  let codePrefix = suffix || countryCode || '';

  if (codePrefix) {
    codePrefix = String(codePrefix).trim();
    if (!codePrefix.startsWith('+')) {
      codePrefix = '+' + codePrefix;
    }
    if (!String(phoneNumber).trim().startsWith('+')) {
      phoneNumber = codePrefix + String(phoneNumber).trim();
    }
  }

  return formatPhoneNumber(phoneNumber);
};

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
};

module.exports = {
  formatPhoneNumber,
  generateOTP,
  buildFullPhoneNumber,
  isValidEmail,
};