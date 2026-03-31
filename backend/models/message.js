import moongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    conversationId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',    },
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiver:{
        type: moongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    content:{
        type:String
    },
    ImageOrVideoUrl:{type:String},
    contentType:{type:String, enum:[
        'image','video','text']
    },
    reactions:[
        {
            user:{type:moongoose.Schema.Types.ObjectId, ref:'User'},
            emoji:String

        }
    ],
    messageStatus:{
        type:String, default:'send'
    }

},{timestamps:true});

module.exports = mongoose.model('Message', MessageSchema);