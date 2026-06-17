import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const DEFAULTS = {
  binance:     { futures: { maker: 0.0002, taker: 0.0005 }, spot: { maker: 0.001, taker: 0.001 } },
  bybit:       { futures: { maker: 0.0001, taker: 0.0006 }, spot: { maker: 0.001, taker: 0.001 } },
  gateio:      { futures: { maker: 0.00015, taker: 0.0005 }, spot: { maker: 0.002, taker: 0.002 } },
  hyperliquid: { futures: { maker: 0.0001, taker: 0.00035 }, spot: { maker: 0.00015, taker: 0.00035 } },
  okx:         { futures: { maker: 0.0002, taker: 0.0005 }, spot: { maker: 0.0008, taker: 0.001 } },
};

export const fetchAllFees = internalAction({
  args: {},
  handler: async (ctx) => {
    const exchanges = [
      { name: "binance", defaults: DEFAULTS.binance },
      { name: "bybit", defaults: DEFAULTS.bybit },
      { name: "gateio", defaults: DEFAULTS.gateio },
      { name: "hyperliquid", defaults: DEFAULTS.hyperliquid },
      { name: "okx", defaults: DEFAULTS.okx },
    ];

    for (const ex of exchanges) {
      for (const market of ["futures", "spot"] as const) {
        try {
          await ctx.runMutation(internal.fees.upsertFeeRate, {
            exchange: ex.name,
            market,
            makerFee: ex.defaults[market].maker,
            takerFee: ex.defaults[market].taker,
            stale: false,
          });
        } catch (e) {
          console.error(`Failed to upsert ${ex.name} ${market}:`, e);
        }
      }
    }
  },
});