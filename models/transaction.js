const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    chain: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    user: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    releasedAt: { type: Date },
});

module.exports = mongoose.model('Transaction', transactionSchema);
