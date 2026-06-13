const mongoose = require('mongoose');

const LimitOrderSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId:    { type: String, required: true, unique: true },
  symbol:     { type: String, required: true, uppercase: true },
  type:       { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity:   { type: Number, required: true, min: 1 },
  limitPrice: { type: Number, required: true, min: 0.01 },
  status:     { type: String, enum: ['PENDING', 'FILLED', 'CANCELLED'], default: 'PENDING' },
  filledAt:   { type: Number, default: null },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('LimitOrder', LimitOrderSchema);
