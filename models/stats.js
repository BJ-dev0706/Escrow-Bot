const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: Number, required: true },
  totalAmount: { type: String, required: true },
  deals_completed: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  releasedAt: { type: Date },
});

module.exports = mongoose.model("Transaction", transactionSchema);
