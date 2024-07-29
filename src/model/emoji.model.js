const mongoose = require('mongoose');

const connection = require('../connections/mongodb');

const EmojiSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        emoji: {
            type: String,
        },
        status: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = connection.model('Emoji', EmojiSchema);
