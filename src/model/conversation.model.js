const mongoose = require('mongoose');

const connection = require('../connections/mongodb');
const Message = require('./message.model');

const ConversationSchema = mongoose.Schema(
    {
        chatName: { type: String, trim: true },
        avatar: { type: String, default: null },
        background: {
            url: { type: String, default: null },
            backgroundType: { type: String, default: 'color', enum: ['color', 'image'] },
        },
        isGroupChat: { type: Boolean, default: false },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        autoTranslateList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        deleteBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
        status: { type: mongoose.Schema.Types.ObjectId },
    },
    {
        timestamps: true,
    },
);

ConversationSchema.pre('deleteOne', async function (next) {
    try {
        const query = this.getFilter();
        await Message.deleteMany({ conversation: query._id });
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = connection.model('Conversation', ConversationSchema);
