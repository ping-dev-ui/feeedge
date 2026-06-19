# Maker vs taker fees explained — and why most traders pay the expensive one

*Draft for a future /guides page. Target keywords: "maker vs taker fees", "what is a maker fee", "taker fee crypto".*

If you trade crypto, the single easiest way to cut your costs isn't switching exchanges — it's understanding the difference between a **maker** and a **taker** fee, and trading in a way that pays the cheaper one. On most venues the gap is 2–3× per trade. Over a year of active trading, that's real money.

## What's the difference?

Every exchange runs an order book. When you place an order, you either *add* liquidity to that book or *remove* it:

- **Maker order** — a limit order that sits on the book waiting to be filled (e.g. "buy BTC at $60,000" when the price is $60,100). You're *making* liquidity. Exchanges reward this with a **lower fee** — sometimes zero, sometimes even a rebate.
- **Taker order** — a market order (or a limit order that fills instantly) that takes existing liquidity off the book. You're *taking* liquidity, and you pay the **higher fee** for the convenience of an immediate fill.

A typical entry-tier perp schedule looks like **0.02% maker / 0.05% taker** — the taker pays 2.5× more for the same trade.

## Why most traders overpay

Market orders are the default. They're one tap, they fill instantly, and when you're chasing a move it *feels* necessary. But every market order is a taker order — the expensive side. Traders who hammer the buy/sell button are quietly paying the top rate on every fill.

## How to pay the maker fee instead

- **Use limit orders.** Set your price and let the order rest on the book. If it fills, you paid the maker rate.
- **Use "post-only" mode** where available — it guarantees your order is treated as a maker order (it cancels rather than crossing the spread and becoming a taker).
- **Be patient on entries and exits.** A limit order a tick or two from the market often fills within seconds, at a fraction of the taker cost.

The trade-off is fill certainty: a limit order might not fill if the price runs away. For scalpers grabbing fast moves, takers are sometimes unavoidable — which is exactly why your maker/taker *mix* matters when comparing exchanges.

## Your mix changes which exchange is cheapest

Here's the part most fee tables miss: the "cheapest exchange" depends on **how much of your volume is maker vs taker**. An exchange with a great maker rate but a poor taker rate is cheap for a patient limit-order trader and expensive for a market-order scalper — and vice versa.

That's the whole idea behind [FeeEdge](https://feeedge.com): you set your real maker/taker mix and volume, and it ranks every exchange by what *you'd* actually pay — not a generic headline rate.

## The quick version
- Maker = limit order that adds liquidity = cheaper.
- Taker = market order that removes liquidity = pricier (often 2–3×).
- Use limit / post-only orders to pay the maker fee.
- Your maker/taker mix determines which exchange is cheapest for you — [check yours here](https://feeedge.com).

*FeeEdge provides estimates for informational purposes only and is not financial advice.*
