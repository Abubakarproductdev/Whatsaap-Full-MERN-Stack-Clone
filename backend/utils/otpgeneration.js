/**
 * Format phone number to E.164 format (prepends '+' if missing).
 * @param {string|number} phoneNumber - The raw phone number input.
 * @returns {string} - The formatted phone number.
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
 * @returns {string} - A 6-digit OTP code.
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Resolve and prepend a country code prefix to a phone number.
 * Accepts either 'suffix' or 'countryCode' as the prefix source.
 * @param {string|number} phoneNumber - The raw phone number.
 * @param {string} [suffix] - Optional country code (e.g., '91' or '+91').
 * @param {string} [countryCode] - Optional country code fallback.
 * @returns {string} - The fully formatted E.164 phone number.
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

module.exports = {
  formatPhoneNumber,
  generateOTP,
  buildFullPhoneNumber,
};