const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  stocks: [
    {
      symbol:      { type: String, required: true, uppercase: true, trim: true },
      companyName: { type: String, required: true },
      sector:      { type: String, default: 'Unknown' },
      quantity:    { type: Number, required: true, min: 0 },
      avgBuyPrice: { type: Number, required: true, min: 0 },
    },
  ],
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
