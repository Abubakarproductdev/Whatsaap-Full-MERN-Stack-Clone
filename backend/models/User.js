const mongoose = require('mongoose');

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue ? normalizedValue : undefined;
};

const normalizeOptionalEmail = (value) => {
  const normalizedEmail = normalizeOptionalString(value);
  return normalizedEmail ? normalizedEmail.toLowerCase() : undefined;
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    set: normalizeOptionalEmail,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },

  phoneNumber: {
    type: String,
    trim: true,
    set: normalizeOptionalString,
    match: [/^\+?[\d\s-]{10,}$/, 'Please fill a valid phone number']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  EmailOtp: {
    type: String,
    default: ''
  },
  phoneOtp: {
    type: String,
    default: ''
  },

  optExpiry: {
    type: Date,
    default: Date.now
  },
  about: {
    type: String,
    default: 'Hey there! I am using WhatsApp Clone'
  },
  status: {
    type: String,
    default: 'Hey there! I am using WhatsApp Clone'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean, default: false

  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $exists: true } }
  }
);

userSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $exists: true } }
  }
);

module.exports = mongoose.model('User', userSchema);
