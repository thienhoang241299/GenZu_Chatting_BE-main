const mongoose = require('mongoose');

const connection = require('../connections/mongodb');

const FriendRequestSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
        receiver: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
        isRead: { type: Boolean, default: false },
        status: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

module.exports = connection.model('FriendRequest', FriendRequestSchema);
