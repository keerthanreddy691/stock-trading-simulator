const Order = require("../models/Order");

const {
  matchOrder
} = require("../services/matchingEngine");

const tradeEvents =
  require("../utils/tradeEvents");

const createOrder = async (req, res) => {
  try {

    const {
      symbol,
      companyName,
      side,
      quantity,
      price
    } = req.body;

    if (
      !symbol ||
      !companyName ||
      !side ||
      !quantity ||
      !price
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const order =
      await Order.create({
        userId: req.user.id,

        symbol: symbol.toUpperCase(),

        companyName,

        side: side.toUpperCase(),

        quantity,

        price
      });

    tradeEvents.emit(
      "orderCreated",
      order
    );

    const matchedOrder =
      await matchOrder(order);

    res.status(201).json({
      success: true,

      order,

      matched: !!matchedOrder,

      matchingOrder: matchedOrder
    });

  } catch (error) {

    console.error(
      "Create Order Error:",
      error
    );

    res.status(500).json({
      message: "Server Error"
    });

  }
};

const getOrders = async (req, res) => {
  try {

    const orders =
      await Order.find({
        userId: req.user.id
      }).sort({
        createdAt: -1
      });

    res.json(orders);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};

module.exports = {
  createOrder,
  getOrders
};