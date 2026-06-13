const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol:      { type: String, required: true, uppercase: true, trim: true },
  companyName: { type: String, required: true },
  sector:      { type: String, default: 'Unknown' },
  type:        { type: String, enum: ['BUY', 'SELL'], required: true },
  orderType:   { type: String, enum: ['MARKET', 'LIMIT'], default: 'MARKET' },
  quantity:    { type: Number, required: true, min: 1 },
  priceAtTransaction: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  // Filled in on SELL to track realised P&L per transaction
  costBasis:   { type: Number, default: 0 },
  realisedPL:  { type: Number, default: 0 },
  timestamp:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
