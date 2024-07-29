const mongoose = require('mongoose');

const connection = require('../connections/mongodb');
const { statusTransaction } = require('@/enums/validates');

const TransactionSchema = new mongoose.Schema(
    {
        partnerCode: { type: String },
        requestId: { type: String },
        userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        status: { type: String, enum: statusTransaction, default: 'pending' },
        payUrl: { type: String },
        qrCodeUrl: { type: String },
        responseTime: { type: Number },
        doneTime: { type: Number, default: null },
    },
    {
        timestamps: true,
    },
);

module.exports = connection.model('Transaction', TransactionSchema);
