const EventEmitter = require("events");

class TradeEvents extends EventEmitter {}

const tradeEvents = new TradeEvents();

module.exports = tradeEvents;
const EventEmitter = require("events");

class TradeEvents extends EventEmitter {}

const tradeEvents = new TradeEvents();

tradeEvents.on(
  "orderCreated",
  (order) => {
    console.log(
      `ORDER CREATED:
       ${order.side}
       ${order.symbol}
       ${order.quantity}`
    );
  }
);

tradeEvents.on(
  "orderMatched",
  (data) => {
    console.log(
      `ORDER MATCHED:
       ${data.buyOrder.symbol}`
    );
  }
);

module.exports = tradeEvents;