const Order = require("../models/Order");
const tradeEvents = require("../utils/tradeEvents");

const matchOrder = async (newOrder) => {
  try {

    let matchingOrder;

    // If new order is BUY
    if (newOrder.side === "BUY") {

      matchingOrder =
        await Order.findOne({
          symbol: newOrder.symbol,

          side: "SELL",

          status: "OPEN",

          price: {
            $lte: newOrder.price
          }
        });

    }

    // If new order is SELL
    else {

      matchingOrder =
        await Order.findOne({
          symbol: newOrder.symbol,

          side: "BUY",

          status: "OPEN",

          price: {
            $gte: newOrder.price
          }
        });

    }

    // No matching order found
    if (!matchingOrder) {
      return null;
    }

    // Update status
    newOrder.status = "MATCHED";
    matchingOrder.status = "MATCHED";

    await newOrder.save();
    await matchingOrder.save();

    // Emit event
    tradeEvents.emit(
      "orderMatched",
      {
        buyOrder:
          newOrder.side === "BUY"
            ? newOrder
            : matchingOrder,

        sellOrder:
          newOrder.side === "SELL"
            ? newOrder
            : matchingOrder
      }
    );

    return matchingOrder;

  } catch (error) {

    console.error(
      "Matching Engine Error:",
      error
    );

    return null;
  }
};

module.exports = {
  matchOrder
};