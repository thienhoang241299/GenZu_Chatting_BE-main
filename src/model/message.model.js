const mongoose = require('mongoose');

const connection = require('../connections/mongodb');

const MessageSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'notification', 'video', 'file', 'audio'],
            default: 'text',
        },
        isSpoiled: {
            type: Boolean,
            default: true,
        },
        message: {
            type: String,
            required: true,
        },
        replyMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        translateMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MessageTranslate',
        },
        status: {
            type: String,
            default: 'active',
        },
        deleteBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        emojiBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Emoji' }],
        styles: {
            fontSize: {
                type: Number,
                default: false,
            },
            bold: {
                type: Boolean,
                default: false,
            },
            italic: {
                type: Boolean,
                default: false,
            },
            underline: {
                type: Boolean,
                default: false,
            },
        },
        affected_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        translations: { type: Object, default: {} },
    },
    {
        timestamps: true,
    },
);

module.exports = connection.model('Message', MessageSchema);
