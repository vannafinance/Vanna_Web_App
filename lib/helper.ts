import { formatUnits, parseUnits } from "viem";
import {
  ActivePositionType,
  OpenOrderType,
  OrderPlacementFormValues,
} from "./types";

export function mapOrderToActivePosition(
  order: OrderPlacementFormValues,
  currentPrice: number
): ActivePositionType {
  // TAKE PROFIT MAPPING
  let takeProfit: { label: string; value: number }[] | undefined = undefined;

  // Case 1: Multiple TP
  if (
    order.takeProfitEnabled &&
    order.multipleTpEnabled &&
    order.multipleTakeProfits?.length
  ) {
    takeProfit = order.multipleTakeProfits.map((tp, idx) => ({
      label: `Tp${idx + 1}`,
      value: tp.profitAmount ?? 0,
    }));
  }

  // Case 2: Single TP
  if (
    order.takeProfitEnabled &&
    !order.multipleTpEnabled &&
    order.singleTakeProfit?.profitAmount
  ) {
    takeProfit = [
      {
        label: "Tp1",
        value: order.singleTakeProfit.profitAmount,
      },
    ];
  }
  return {
    id: crypto.randomUUID(),

    dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),

    pair: "BTC/USDT",

    type: order.orderType === "market" ? "Market" : "Limit",

    side: order.orderSide === "buy" ? "Buy" : "Sell",

    qty: `${order.totalUnits ?? 0} BTC`,

    estFilledPrice: `${currentPrice} USDT`,

    takeProfit,

    slTriggerPrice: order.stopLoss?.triggerPrice ?? undefined,
    slLimit: order.stopLoss?.limitPrice ?? undefined,

    trailPctOrUsd: order.stopLoss?.trailVariance
      ? `${order.stopLoss.trailVariance} ${order.stopLoss.trailVarianceUnit}`
      : undefined,

    loop: order.loopEnabled ? `${order.noOfLoops ?? "-"}` : undefined,

    currentPnlUsd: "+0",
    currentPnlPct: "0%",

    status: "Active",
  };
}

export function mapOrderToOpenOrder(
  order: OrderPlacementFormValues
): OpenOrderType {
  return {
    id: crypto.randomUUID(),

    dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),

    pair: "BTC/USDT",

    type:
      order.orderType === "limit"
        ? "Limit"
        : order.orderType === "market"
        ? "Market"
        : "Trigger",

    side: order.orderSide === "buy" ? "Buy" : "Sell",

    qty: `${order.totalUnits ?? 0}`,

    price: order.entryPrice ?? 0,

    takeProfit: order.takeProfitEnabled
      ? order.multipleTpEnabled && order.multipleTakeProfits?.length
        ? order.multipleTakeProfits.map((tp, idx) => ({
            label: `TP${idx + 1}`,
            value: tp.profitAmount ?? 0,
          }))
        : order.singleTakeProfit
        ? [
            {
              label: "TP",
              value: order.singleTakeProfit.profitAmount ?? 0,
            },
          ]
        : []
      : [],

    slTriggerPrice: order.stopLossEnabled
      ? order.stopLoss?.triggerPrice ?? 0
      : 0,

    slLimit: order.stopLossEnabled ? order.stopLoss?.limitPrice ?? 0 : 0,

    trail: order.stopLoss?.trailVariance ? order.stopLoss.trailVariance : 0,

    loop: order.loopEnabled
      ? order.noOfLoops === null
        ? "∞"
        : String(order.noOfLoops)
      : "-",

    triggerCondition:
      order.orderType === "trigger"
        ? `${order.triggerMode?.toUpperCase()} @ ${order.triggerPrice}`
        : "-",

    total: order.totalAmount ? `$${order.totalAmount}` : "-",
  };
}


export const sleep = (duration: number) => {
  // duration = 1000 => 1 second
  return new Promise<void>(function (resolve) {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};


export const formatBignumberToUnits = (coin: string, balance: number) => {
  let units = 18;
  if (coin == "USDC" || coin == "USDT") {
    units = 6;
  }

  return formatUnits(BigInt(balance), units);
};

export const formatStringToUnits = (coin: string, balance: number) => {
  let units = 18;
  if (coin == "USDC" || coin == "USDT") {
    units = 6;
  }

  return parseUnits(String(balance), units);
};


// Order book helpers for spot trading
export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  side: "buy" | "sell";
}

export function groupOrdersByTick(
  orders: OrderBookEntry[],
  tick: number
): OrderBookEntry[] {
  if (!orders.length || tick <= 0) return orders;

  const grouped = new Map<number, OrderBookEntry>();

  for (const order of orders) {
    const bucket = Math.floor(order.price / tick) * tick;
    const key = parseFloat(bucket.toFixed(10));

    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.amount += order.amount;
      existing.total += order.total;
    } else {
      grouped.set(key, { ...order, price: key });
    }
  }

  return Array.from(grouped.values());
}

export function calculateRatio(
  buys: OrderBookEntry[],
  sells: OrderBookEntry[]
): { buyRatio: number; sellRatio: number } {
  const buyTotal = buys.reduce((sum, o) => sum + o.amount, 0);
  const sellTotal = sells.reduce((sum, o) => sum + o.amount, 0);
  const total = buyTotal + sellTotal;

  if (total === 0) return { buyRatio: 50, sellRatio: 50 };

  return {
    buyRatio: Math.round((buyTotal / total) * 100),
    sellRatio: Math.round((sellTotal / total) * 100),
  };
}

export const ceilWithPrecision = (n: string, precision = 3) => {
  const num = parseFloat(n);
  // Check if the conversion was successful
  if (isNaN(num)) {
    return n;
  }
  return num.toFixed(precision);
};
