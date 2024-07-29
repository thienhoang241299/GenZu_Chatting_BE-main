const mongoose = require('mongoose');

const connection = require('../connections/mongodb');

const ParticipantSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cser',
            required: true
        },
        conversation_id: {
            ref: 'Conversation',
            type: String,
            required: true
        },
        rule: {
            type: Number,
            required: true
        },
        is_translate: {
            type: Boolean,
            required: true
        },
        is_block: {
            type: Boolean,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = connection.model('participant', ParticipantSchema);
