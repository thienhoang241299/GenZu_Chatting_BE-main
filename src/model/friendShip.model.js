const mongoose = require('mongoose');

const connection = require('../connections/mongodb');

const FriendShipSchema = new mongoose.Schema(
    {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }],
        friendRequest: { type: mongoose.Schema.ObjectId, ref: 'FriendRequest', required: true },
        status: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

module.exports = connection.model('Friend', FriendShipSchema);
