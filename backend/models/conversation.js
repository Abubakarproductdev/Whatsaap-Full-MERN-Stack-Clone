const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  // ❌ Remove unreadCount — we'll calculate it from messages instead
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);