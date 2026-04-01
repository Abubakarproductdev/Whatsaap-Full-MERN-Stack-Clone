const mongoose = require('mongoose');   // ❌ You had "import moongoose" (typo + wrong syntax)

const ConversationSchema = new mongoose.Schema({

    participants:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastmessage:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCount:{
        type: Number,
        default:0
    }

},{timestamps:true});
module.exports = mongoose.model('Conversation', ConversationSchema);