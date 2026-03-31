const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },

  phoneNumber: {
    type: String,
    required: true,
    unique: true,
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
  isVerified:{
    type:Boolean, default:false

  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);