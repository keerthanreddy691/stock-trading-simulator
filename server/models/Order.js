const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  symbol: {
    type: String,
    required: true,
    uppercase: true
  },

  companyName: {
    type: String,
    required: true
  },

  side: {
    type: String,
    enum: ["BUY", "SELL"],
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["OPEN", "MATCHED"],
    default: "OPEN"
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model("Order", OrderSchema);