# dreamDEX — Quick Start

> Source: https://docs.dreamdex.io/developers/quick-start
> Docs are published with GitBook. Markdown versions of pages are available by appending `.md` to the page URL.

This guide walks through placing your first order on dreamDEX, describing how you can interact with both the HTTP API and on-chain smart contracts to trade tokens.

The guide shows three paths: the [dreamDEX CLI](https://github.com/somnia-chain/somnia-dex-cli/) for the fastest experience, the HTTP API with `curl` for full control, and [Foundry's `cast`](https://book.getfoundry.sh/) for direct contract interaction.

> **Building an automated bot or agent?** Use the default **wallet funding** flow — there is no vault deposit step, just a one-time ERC-20 approval to the pool. See [Choose a Funding Source](#3-choose-a-funding-source).

## Prerequisites

Before you can perform any trades, you need:

- An EVM wallet connected to **Somnia mainnet** (chain ID `5031`).
- Tokens to trade (the base token of the market you want to trade on).
- Your private key is assumed to be in your environment as `$PRIVATE_KEY`.
- An HTTP client that can call REST endpoints; we will assume `curl` is on your path.
- The [dreamDEX CLI](https://github.com/somnia-chain/somnia-dex-cli/) for the simplest workflow (`go install github.com/somnia-chain/somnia-dex-cli/cmd/dreamdex@latest`), and/or [Foundry](https://book.getfoundry.sh/) (`cast`) for direct contract interaction.

## Choose an Environment

Set `BASE_URL` once and every `curl` example below targets the right environment. The `/v0` path segment is part of the base URL on both environments - omitting it returns a 404.

```sh
# Mainnet (Somnia, chain ID 5031)
BASE_URL="https://api.dreamdex.io/v0"

# Testnet (Somnia Shannon, chain ID 50312) - uncomment to use instead
# BASE_URL="https://stg.api.dreamdex.io/v0"
```

This guide uses mainnet addresses, chain ID, and RPC throughout. To run it against testnet, switch `BASE_URL` above and substitute the [testnet contract addresses, chain ID, and RPC](/developers/contracts/contract-specifications.md#testnet-somnia-shannon-chain-id-50312). See the [HTTP API base URLs](/developers/http-api.md#base-urls) for the full per-environment reference.

> **Getting testnet funds.** Trading on Somnia Shannon testnet (chain ID `50312`) needs test funds - no mainnet capital required:
>
> - **STT (gas):** claim from the [Somnia testnet faucet](https://testnet.somnia.network/) (or the [Google Cloud Web3 faucet](https://cloud.google.com/web3/faucet?network=somnia)). You need STT to pay gas for any transaction.
> - **Test trading tokens** (SOMI, WBTC, WETH): mint from the testnet token faucet contract `0x89Ebc05dE83aB9752B95030218BB10A542b96B7C` via `requestTokens(address[] tokens, uint256[] amounts)` (all 18 decimals).
> - **USDso (the quote token):** acquire by swapping from a token you hold on a live testnet market (e.g. sell SOMI on `SOMI:USDso`) or via [Simple Swap](/trading/readme-1/simple-swap.md). Testnet books can be thin - if a market is empty, post a resting order and wait, or start from the most active pair.

## 1. Discover Markets

Fetch the available trading pairs via the [Market Data](/developers/http-api/market-data.md) endpoint. This step is required regardless of which path you use - it is the simplest way to obtain the contract and token addresses for a market.

```sh
curl $BASE_URL/markets
```

```json
{
  "markets": [
    {
      "symbol": "WETH:USDso",
      "contract": "0xa936da11B57b50A344e1293AAaE5232885ea2bDE",
      "base":     "0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8",
      "quote":    "0x00000022dA000002656c64D9eA6011ea952D008A",
      "baseDecimals": 18,
      "quoteDecimals": 18,
      "tickSize": "0.01",
      "lotSize": "0.0001",
      "minQuantity": "0.001"
    }
  ]
}
```

Note the `contract` (Pool address), `base` and `quote` (token addresses), decimal counts, and the `tickSize`, `lotSize`, and `minQuantity` constraints — your order parameters must respect these. The values above are **illustrative for one pair**; each market sets its own, and they can change. Always read them per-market from `GET /v0/markets` or on-chain `getPoolParams()` at runtime rather than hard-coding. See [Spot Contract Specifications](/developers/contracts/contract-specifications.md) for details on each field.

> **Respect `minQuantity`, `lotSize`, and `tickSize`.** An order below `minQuantity`, or whose `quantity`/`price` is not a whole multiple of `lotSize`/`tickSize`, is rejected on-chain. `minQuantity` is the most common cause of a rejected first order — check it before sizing.

If you are using the dreamDEX CLI, no manual setup is needed - it fetches market metadata automatically:

```sh
dreamdex markets
```

If you are using `cast` directly, save these values:

```bash
POOL="0xa936da11B57b50A344e1293AAaE5232885ea2bDE"         # SpotPool (WETH:USDso, Somnia mainnet)
BASE_TOKEN="0x936Ab8C674bcb567CD5dEB85D8A216494704E9D8"   # WETH
QUOTE_TOKEN="0x00000022dA000002656c64D9eA6011ea952D008A"  # USDso
BASE_DECIMALS=18
QUOTE_DECIMALS=18
RPC="https://api.infra.mainnet.somnia.network"
```

> **Native-token markets (SOMI/USDso).** The SOMI/USDso pool uses SOMI as the chain's **native token**. Under the default auto-pull flow, `placeOrder` is `payable` and pulls input from `msg.value` rather than an ERC-20 allowance; for manual vault funding, deposit with `depositNative()` and `msg.value` instead of `approve` + `deposit(token, amount)`. The rest of this guide assumes an ERC-20 base (e.g. WETH); swap in the SOMI/USDso pool address and use the native variants when trading SOMI.

## 2. Authenticate (HTTP API only)

*Skip this step if you are using the dreamDEX CLI or `cast` - both sign transactions directly with your private key. The CLI handles SIWE authentication automatically; run `dreamdex login` to import your key on first use, or set `DREAMDEX_PRIVATE_KEY` in your environment for headless/CI workflows.*

If you want to use the HTTP API to construct transactions on your behalf, you will need to authenticate first, to ensure the returned transactions reference your wallet correctly. This process does not cede any control to your wallet; you remain in full control.

dreamDEX supports [Sign-In with Ethereum (ERC-4361)](https://eips.ethereum.org/EIPS/eip-4361). First request a nonce, then sign a SIWE message with your wallet and submit it to receive a JWT bearer token. See [Authentication](/developers/http-api/authentication.md) for full details.

**Request a nonce:**

```sh
curl $BASE_URL/auth/nonce
```

```json
{ "nonce": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" }
```

**Sign in:**

Construct an ERC-4361 message containing the nonce, sign it with your wallet, and POST both to the login endpoint:

```sh
curl -X POST $BASE_URL/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "api.dreamdex.io wants you to sign in with your Ethereum account:\n0xYourAddress\n\nSign in to dreamDEX\n\nURI: https://api.dreamdex.io\nVersion: 1\nChain ID: 5031\nNonce: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6\nIssued At: 2026-01-01T00:00:00.000Z",
    "signature": "0x..."
  }'
```

```json
{
  "token": "eyJhbGciOiJFUzI1NiIs...",
  "expiresAt": 1765537769841
}
```

Include this token in all subsequent HTTP API requests to private endpoints:

```sh
TOKEN="eyJhbGciOiJFUzI1NiIs..."
```

## 3. Choose a Funding Source

dreamDEX supports two ways to fund orders:

### Option A: Wallet Funding (default)

Tokens are pulled directly from your wallet at execution time and proceeds are delivered straight back to it. This is the simplest path - no deposit step needed - but if performing many trades, may cost more in gas fees overall. It supports all [order types](/trading/common/order-types.md), including resting limit orders (GTC, PostOnly).

**Requirements:**

- You must grant the SpotPool contract an ERC-20 allowance to spend your tokens **before** submitting the order - without this the on-chain transaction will revert. (On native-token markets the input is taken from `msg.value` instead of an allowance.)

**Approve the SpotPool contract to spend your tokens:**

Using the HTTP API:

```sh
curl -X POST $BASE_URL/markets/WETH:USDso/vault/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "walletAddress": "0xYourAddress",
    "currency": "WETH",
    "amount": "1"
  }'
```

This returns an unsigned `approve(spender, amount)` transaction targeting the **token contract**, signalling that you grant permission for the contract to spend this token on your behalf. You need to sign and broadcast it.

To do this using `cast`:

```bash
# Approve the pool to spend 1 WETH (18 decimals)
cast send $BASE_TOKEN \
  "approve(address,uint256)" \
  $POOL $(cast to-wei 1) \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

If you are using the dreamDEX CLI, approval is handled automatically when placing an order (step 4) - skip ahead.

Once confirmed, the SpotPool contract can transfer up to that amount from your wallet when your order executes. Then proceed to step 4.

### Option B: Vault Funding

Pre-deposit tokens into the market's on-chain [vault](/developers/http-api/vault.md) and trade against that balance — useful if you keep a working balance in the pool (auto-pull then only tops up any shortfall from your wallet). Market makers and HFT integrators can additionally call `setManualVaultMode(true)` to settle fills to the vault rather than auto-delivering them to the wallet.

**Step 1 - Approve** (same as Option A above).

**Step 2 - Deposit:**

Using the HTTP API:

```sh
curl -X POST $BASE_URL/markets/WETH:USDso/vault/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "walletAddress": "0xYourAddress",
    "currency": "WETH",
    "amount": "1"
  }'
```

Sign and broadcast the returned transaction, e.g. using `cast`:

```bash
# Deposit 1 WETH into the vault
cast send $POOL \
  "deposit(address,uint256)" \
  $BASE_TOKEN $(cast to-wei 1) \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

Using the dreamDEX CLI:

```bash
dreamdex vault approve WETH:USDso --currency WETH --amount 1
dreamdex vault deposit WETH:USDso --currency WETH --amount 1
```

Then proceed to step 4 with vault funding.

## 4. Place an Order

### Option A: Using the HTTP API

Call the [prepare order](/developers/http-api/trading.md) endpoint to get an unsigned transaction:

```sh
curl -X POST $BASE_URL/markets/WETH:USDso/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "limit",
    "side": "buy",
    "price": "2500.00",
    "amount": "1",
    "walletAddress": "0xYourAddress",
    "fundingSource": "wallet",
    "orderType": "immediateOrCancel"
  }'
```

The server returns an unsigned EVM transaction:

```json
{
  "to": "0xPoolContract",
  "data": "0xabcdef...",
  "value": "0",
  "chainId": "5031"
}
```

Sign and broadcast it to the Somnia network, e.g. using `cast`:

```bash
cast send \
  --to "0xPoolContract" \
  --data "0xabcdef..." \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

### Option B: Using the dreamDEX CLI

The CLI handles transaction construction, signing, and broadcasting in a single command:

**Wallet funding** (default):

```bash
dreamdex order place WETH:USDso --side buy --type limit --amount 1 --price 2500
```

**Vault funding:**

```bash
dreamdex order place WETH:USDso --side buy --type limit --amount 1 --price 2500 \
  --funding-source vault --order-type postOnly
```

The CLI auto-detects whether token approval is needed and submits an approval transaction first if required. Market orders are also supported:

```bash
dreamdex order place WETH:USDso --side buy --amount 1 --slippage 0.5
```

### Option C: Using `cast`

When calling the [contract](/developers/contracts/functions.md) directly, prices and quantities must be in **raw on-chain units** - the human-readable value multiplied by `10^decimals`:

```bash
# Price: 2500.00 USDso (18 decimals) → 2500 × 10^18
export PRICE=$(cast to-wei 2500)

# Quantity: 1 WETH (18 decimals) → 1 × 10^18
export QUANTITY=$(cast to-wei 1)

# Expiration: 24 hours from now, in nanoseconds
export EXPIRE_NS=$(( ($(date +%s) + 86400) * 1000000000 ))
```

Both funding sources use the same `placeOrder` entrypoint. Under the default auto-pull flow it pulls the input from your wallet; in [manual vault mode](/developers/contracts/functions.md#setmanualvaultmode) it draws from your pre-deposited vault balance instead:

```bash
cast send $POOL \
  "placeOrder(bool,uint64,uint256,uint256,uint64,uint8,uint8,address,uint96)" \
  true 0 $PRICE $QUANTITY $EXPIRE_NS 2 0 0x0000000000000000000000000000000000000000 0 \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

The `orderType` of `2` (IOC) above is just an example — `placeOrder` accepts any order type, including resting limit orders (`0` = GTC, `3` = PostOnly). On a native-token market add `--value $(cast to-wei <amount>)` so the pool can auto-pull the input from `msg.value`.

The parameters are:

| Parameter              | Description                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `isBid`                | `true` for buy, `false` for sell                                                                                                  |
| `userData`             | Arbitrary 64-bit tag (use `0`)                                                                                                    |
| `price`                | Limit price in raw units (`value × 10^quoteDecimals`)                                                                             |
| `quantity`             | Order size in raw units (`value × 10^baseDecimals`)                                                                               |
| `expireTimestampNs`    | Expiration in nanoseconds since Unix epoch (must be a future timestamp)                                                           |
| `orderType`            | `0` = Normal (GTC), `1` = Fill-or-Kill, `2` = IOC, `3` = PostOnly                                                                 |
| `selfMatchingOption`   | `0` = cancel taker on self-match, `1` = cancel maker                                                                              |
| `builder`              | Optional builder address — see [Builder Codes](/developers/contracts/functions.md#builder-codes). Pass `0x0000...0000` if unused. |
| `builderFeeBpsTimes1k` | Per-order builder fee rate (BPS\_TIMES\_1K). Must be `0` when `builder` is the zero address.                                      |

> **Builder codes are live on mainnet and testnet.** The pool cap `getMaxBuilderFeeBpsTimes1k()` is currently `100000` (1%) on every pool on both networks; when a pool's cap is `0`, a non-zero `builder` reverts with `BuilderCodesNotSupported`. Leave both trailing arguments at the zero values shown above for an untagged order, or approve a builder first to tag one.

> **Taker orders must cross the book.** An IOC/FOK buy has to price at or above the best ask (a sell at or below the best bid) to fill; a `price` of `0` never crosses and produces no fill. Price your limit to cross, bounded by your slippage tolerance.

### Recommended workflow

1. **Simulate first.** Call the transaction via `eth_call` (or `cast call`). A rejected order **reverts**, so the simulation reverts too — decode the selector against the [Errors](/developers/contracts/errors.md#order-rejection) page to learn why. The place-order functions still return `(bool success, uint128 orderId)`, but `success` is now always `true`: if the call returned at all, the order was accepted.
2. **Sign and broadcast.** If the simulation succeeds, sign the transaction and send it to the Somnia network.
3. **Verify after confirmation.** A rejected order is now a **failed transaction** (`status: 0`), not a successful no-op — so `status: 1` does mean the book accepted your order. It still does not prove a **fill**, because an accepted order may simply be resting. Decode the receipt logs:
   - `OrderPlaced` - the order was accepted.
   - `OrderFilled` (one per fill leg) - the order actually executed. A `NormalOrder` that rests produces `OrderPlaced` with no `OrderFilled`, which is correct behaviour rather than a failure. Sum the `OrderFilled` quantities (or diff your balances) to learn how much filled.

> **This changed with the order-rejection upgrade.** Previously an order the book could not honour — an IOC that never crossed, a PostOnly that would have crossed, an already-expired order — came back as a *successful* transaction with `success = false` and no logs, which was easy to miss. Those cases now revert with a named reason. If you have logic that treats "`status: 1` and no `OrderFilled`" as a rejection, it should now branch on the revert instead; the remaining log-only case is a healthy resting order.

## 5. Track Your Order

### Option A: Poll via REST

```sh
curl -H "Authorization: Bearer $TOKEN" \
  $BASE_URL/markets/WETH:USDso/orders/<orderId>
```

### Option B: Using the dreamDEX CLI

```bash
# List open orders
dreamdex order list WETH:USDso --status open

# Get a specific order
dreamdex order get WETH:USDso <orderId>

# Stream live updates
dreamdex watch order <orderId>

# Cancel an order
dreamdex order cancel WETH:USDso <orderId>
```

### Option C: Stream via WebSocket

Connect to the [WebSocket API](/developers/websocket-api/real-time-feed.md) at `wss://api.dreamdex.io/v0/ws/public` (testnet: `wss://stg.api.dreamdex.io/v0/ws/public`) and subscribe to order updates:

```json
{
  "operation": "subscribe",
  "channel": "order",
  "params": { "orderId": "0xYourOrderId" }
}
```

You will receive a snapshot of the current order state followed by real-time updates as the order fills or is cancelled.

### Option D: Query via `cast`

```bash
# Get order details by ID (OrderId is a uint128 on-chain)
cast call $POOL \
  "getOrder(uint128)" \
  $ORDER_ID \
  --rpc-url $RPC
```

To cancel an order:

```bash
cast send $POOL \
  "cancelOrder(uint128)" \
  $ORDER_ID \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

## Summary

| Step                 | HTTP API                 | dreamDEX CLI                                      | `cast`                                |
| -------------------- | ------------------------ | ------------------------------------------------- | ------------------------------------- |
| Discover markets     | `GET /v0/markets`        | `dreamdex markets`                                | Same (HTTP API required)              |
| Authenticate         | `POST /v0/auth/login`    | `dreamdex login`                                  | Not needed                            |
| Approve token        | `POST .../vault/approve` | Automatic                                         | `cast send <token> "approve(...)"`    |
| Deposit (vault only) | `POST .../vault/deposit` | `dreamdex vault deposit ...`                      | `cast send <pool> "deposit(...)"`     |
| Place order (wallet) | `POST .../orders`        | `dreamdex order place ...`                        | `cast send <pool> "placeOrder(...)"`  |
| Place order (vault)  | `POST .../orders`        | `dreamdex order place ... --funding-source vault` | `cast send <pool> "placeOrder(...)"`  |
| Check order          | `GET .../orders/{id}`    | `dreamdex order get ...`                          | `cast call <pool> "getOrder(...)"`    |
| Cancel order         | -                        | `dreamdex order cancel ...`                       | `cast send <pool> "cancelOrder(...)"` |

> **Useful view functions**: Call `getPoolParams()` on any SpotPool to discover its token addresses, fee rates, tick size, lot size, and min quantity. Call `getWithdrawableBalance(address, token)` to check your available balance before withdrawing. Call `getOwnOpenOrders()` to list your active orders.

## Next Steps

- [Order Types](/trading/common/order-types.md) - Learn about all supported order types and time-in-force options
- [Stop Orders](/trading/readme-1/stop-orders.md) - Set up automated stop-loss and take-profit orders
- [Contracts](/developers/contracts.md) - Full contract API reference
- [HTTP API](/developers/http-api.md) - Full REST API reference
- [WebSocket API](/developers/websocket-api.md) - Real-time market data and order tracking

---

# Next Steps — Reference Pages

The following sections were scraped from the "Next Steps" links of the Quick Start page.

## Order Types

> Source: https://docs.dreamdex.io/trading/common/order-types.md

dreamDEX supports a range of order types to accommodate different trading strategies.

> **Every order must clear the market's minimum size.** Each pair sets a `minQuantity` (minimum order size) and a `lotSize` (size increment) in base-token units, plus a `tickSize` price increment. An order below `minQuantity`, or whose size/price is not a whole multiple of `lotSize`/`tickSize`, is rejected on-chain. `minQuantity` is the most common cause of a rejected first order. Read the live values per market from `GET /v0/markets` or on-chain [`getPoolParams()`](/developers/contracts/functions.md#getpoolparams) - see [Quantizing price and quantity](/developers/contracts/functions.md#quantizing-price-and-quantity).

### Basic Order Types

#### Limit Order

Place an order at a specific price. The order rests on the book until filled or cancelled.

- **Use case**: When you want to control your entry/exit price
- **Execution**: Fills at your specified price or better

#### Market Order

Execute immediately at the best available price. Market orders are implemented as **Immediate-or-Cancel (IOC)** orders with an aggressive price — set a price well above the best ask for buys, or well below the best bid for sells. The order fills whatever is available and any unfilled remainder is cancelled.

- **Use case**: When speed of execution is more important than price
- **Execution**: Fills against resting liquidity at current market prices

### Time-in-Force Options

#### Good-Till-Cancelled (GTC)

Order remains active until filled or manually cancelled. This is the `NormalOrder` type on the contract.

- **Funding**: Any source. Under the default [wallet auto-pull](/developers/contracts/functions.md#auto-pull-and-auto-deliver) the pool pulls the input at placement and returns proceeds to your wallet; in manual vault mode it draws from a pre-deposited balance.

#### Immediate-or-Cancel (IOC)

Order executes immediately for any available quantity; unfilled portion is cancelled.

- **Use case**: Large orders where partial fills are acceptable
- **Funding**: Any source (wallet auto-pull or vault).

#### Fill-or-Kill (FOK)

Order must be filled entirely or not at all.

- **Use case**: When you need the full quantity or nothing
- **Funding**: Any source (wallet auto-pull or vault).

#### Post-Only

Order is rejected if it would immediately match (take liquidity).

- **Use case**: Ensure your order always provides liquidity (maker order)
- **Funding**: Any source (wallet auto-pull or vault).

#### What happens when an order is refused

Three of the types above exist precisely to *not* execute under some condition — IOC with nothing to fill, FOK that cannot fill in full, Post-Only that would cross. When that condition hits, the order is **rejected by reverting the transaction**, with a named reason:

| Situation                                                | Reason                    |
| -------------------------------------------------------- | ------------------------- |
| IOC filled nothing at all                                | `ImmediateOrCancelNoFill` |
| FOK could not fill in full                               | `FillOrKillNotFillable`   |
| Post-Only would have crossed                             | `PostOnlyWouldCross`      |
| Would have matched your own resting order (Cancel Taker) | `SelfMatchCancelTaker`    |
| Expiry already in the past                               | `OrderAlreadyExpired`     |

A rejection is a **failed transaction**, not a successful one that quietly did nothing — inclusion is not effect. A partially-filled IOC is *not* a rejection: it fills what it can, cancels the remainder, and succeeds normally.

If you place many orders at once, use the batch surface ([`placeOrders`](/developers/contracts/functions.md#placeorders)) instead — it flags the individual order that was refused and lets the rest go through, so one bad rung cannot discard your whole ladder. Full details in [Errors](/developers/contracts/errors.md#order-rejection).

### Advanced Order Types

#### Stop-Loss

Triggers a market or limit order when the mark price drops to a specified level. The mark price is the EMA-smoothed midpoint emitted by the SpotPool.

- **Trigger**: LTE — when mark price falls to or below your stop price
- **Use case**: Limit downside risk on open positions
- See [Stop Orders](/trading/readme-1/stop-orders.md) for full details

#### Take-Profit

Triggers an order when the mark price rises to your profit target. The mark price is the EMA-smoothed midpoint emitted by the SpotPool.

- **Trigger**: GTE — when mark price rises to or above your target price
- **Use case**: Lock in gains automatically
- See [Stop Orders](/trading/readme-1/stop-orders.md) for full details

### Order Matching

Orders are matched using **Price-Time Priority (PTP)**:

1. Best price has priority
2. Among orders at the same price, earlier orders fill first

All matching occurs on-chain with atomic settlement.

### Self-Trade Prevention (STP)

dreamDEX prevents users from trading against themselves. When placing an order, you specify one of the following behaviors for when it would match against your own resting order:

- **Cancel Taker (Default)**: The incoming (taker) order is cancelled. This prevents the trade without affecting your resting orders.
- **Cancel Maker**: The resting (maker) order is cancelled, allowing the taker order to continue matching against other orders.

Self-trading is never permitted — one side is always cancelled.

## Stop Orders

> Source: https://docs.dreamdex.io/trading/readme-1/stop-orders.md

dreamDEX supports conditional stop orders for spot markets via the **SpotStopOrderRegistry** contract. These are pending orders that activate automatically when the spot pool's mark price crosses a trigger threshold.

### How It Works

1. You create a pending order specifying a trigger price and condition (above or below), paying an exact SOMI fee with the transaction.
2. The order sits in the registry — it is **not** on the order book yet.
3. When the SpotPool's mark price crosses your trigger, [Somnia reactivity](https://docs.somnia.network/developer/reactivity) automatically fires the order.
4. The order is placed on the SpotPool as an Immediate-or-Cancel (IOC) order.
5. It fills whatever is available; any unfilled remainder is discarded.

### Mark Price (Trigger Feed)

Triggers are evaluated against the **EMA-smoothed midpoint** the SpotPool emits on [`MarkPriceUpdated`](/developers/contracts/events.md#markpriceupdated). The EMA advances at most one step per `updateIntervalSec` and is the load-bearing protection against single-block midpoint manipulation — an attacker would need to sustain a manipulated raw midpoint across multiple intervals to drag the EMA past a stop's trigger band.

The same event also carries the raw `(bestBid + bestAsk) / 2` snapshot for off-chain consumers (UIs, indexers); that raw value is **not** the trigger feed.

### Order Types

#### Limit Stop Order

You specify a limit price. When triggered, the order is placed at your limit price.

- Gives you price control over execution.
- Order may not fill if the book doesn't have liquidity at your limit price.

#### Market Stop Order

When triggered, the limit price is calculated automatically from the current mark price using the registry's slippage tolerance (`slippageToleranceBps`). You must pass `limitPrice = 0` at creation — any other value is rejected.

- For buys: `limitPrice = markPrice + (markPrice * slippageBps / 10000)`, rounded down to tick.
- For sells: `limitPrice = markPrice - (markPrice * slippageBps / 10000)`, rounded up to tick.
- Maximizes chance of fill at the cost of price control.

### Trigger Operators

| Operator | Meaning               | Triggers when...                               |
| -------- | --------------------- | ---------------------------------------------- |
| **GTE**  | Greater than or equal | Mark price **rises to or above** trigger price |
| **LTE**  | Less than or equal    | Mark price **falls to or below** trigger price |

### Use Cases

#### Stop-Loss Sell

"If the price drops to $90 or below, sell my tokens."

- **Side**: Sell (`isBid = false`)
- **Trigger**: LTE, triggerPrice = $90
- **LIMIT example**: limitPrice = $85 (willing to sell as low as $85)
- **MARKET**: limit price auto-calculated with slippage tolerance; `limitPrice` must be `0`

For LIMIT orders: `limitPrice` must be ≤ `triggerPrice`.

#### Breakout Buy

"If the price rises to $110 or above, buy tokens."

- **Side**: Buy (`isBid = true`)
- **Trigger**: GTE, triggerPrice = $110
- **LIMIT example**: limitPrice = $120 (willing to buy as high as $120)
- **MARKET**: limit price auto-calculated with slippage tolerance; `limitPrice` must be `0`

For LIMIT orders: `limitPrice` must be ≥ `triggerPrice`.

#### Buy the Dip

"If the price drops to $80 or below, buy tokens."

- **Side**: Buy (`isBid = true`)
- **Trigger**: LTE, triggerPrice = $80
- No limit/trigger price constraint for LIMIT orders.

#### Take-Profit Sell

"If the price rises to $120 or above, sell my tokens."

- **Side**: Sell (`isBid = false`)
- **Trigger**: GTE, triggerPrice = $120
- No limit/trigger price constraint for LIMIT orders.

### Creating a Stop Order

#### Using `cast`

```bash
# Create a stop-loss sell: sell if price drops to 90 USDso (6 decimals → 90000000)
# LIMIT type (0), LTE operator (1), limit price 85 USDso (→ 85000000)
# Trailing zeros are the builder address and builder fee — leave zero for an untagged order
# --value sends SOMI to cover the per-order fee — must equal somiPaymentPerOrder() exactly
cast send $STOP_REGISTRY \
  "createPendingOrder(((bool,address,uint64,uint256),uint8,uint256,uint8,uint256,address,uint96))" \
  "((false,$WALLET_ADDRESS,0,$QUANTITY),0,90000000,1,85000000,0x0000000000000000000000000000000000000000,0)" \
  --value $SOMI_PAYMENT \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

The argument is a single `PendingOrderWithTrigger` struct:

- **order**: `(isBid, owner, userData, quantity)` — `owner` must be `msg.sender`; `quantity` must be >= `minQuantity` and a multiple of `lotSize` (both from the SpotPool).
- **orderType**: `0` = LIMIT, `1` = MARKET.
- **triggerPrice**: in raw quote token units.
- **triggerOperator**: `0` = GTE, `1` = LTE.
- **limitPrice**: in raw quote token units for LIMIT orders (must be tick-aligned). Must be exactly `0` for MARKET orders.
- **builder** / **builderFeeBpsTimes1k**: see [Builder Codes](/developers/contracts/functions.md#builder-codes). Pass `address(0)` and `0` for an untagged order; to tag a builder, approve it first (builder codes are live on mainnet, disabled on testnet).

> **SOMI payment must be exact.** `createPendingOrder` is `payable` and requires `msg.value` to equal `somiPaymentPerOrder()` exactly. Both underpayment and overpayment revert with `InsufficientSomiPayment`. Read `somiPaymentPerOrder()` immediately before calling and forward that exact amount. The SOMI is refunded on cancel and consumed on trigger.

> **Minimum stop distance.** Registries may be configured with a non-zero `minStopDistanceBps`, which rejects pending orders whose `triggerPrice` is closer to the current EMA midpoint than the configured threshold. Tightens the defense against trigger manipulation for tight stops. Defaults to `0` (disabled) — check `minStopDistanceBps()` on the registry before placing tight stops.

#### Cancelling

Cancelling a pending order refunds the full SOMI payment to the order owner. If the transfer fails (e.g., the owner is a contract without a `receive`/`fallback`), the cancellation still succeeds and the refund is credited to the owner's unclaimed SOMI balance, withdrawable via `claimSomi()`.

```bash
cast send $STOP_REGISTRY \
  "cancelPendingOrder(uint128)" \
  $PENDING_ORDER_ID \
  --rpc-url $RPC --private-key $PRIVATE_KEY
```

The OrderId type is a `uint128` on-chain — pass the raw integer returned from `createPendingOrder`.

### SOMI Payment Model

Creating a stop order requires an **exact** SOMI (native token) payment sent with the transaction. This funds the Somnia reactivity handler that monitors prices and triggers orders on-chain.

| Scenario               | SOMI Behavior                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| **Order creation**     | `msg.value` must equal `somiPaymentPerOrder()` exactly                                              |
| **Order cancellation** | Full SOMI payment is refunded to the owner (or credited to unclaimed balance if the transfer fails) |
| **Order triggered**    | SOMI is consumed (not refunded), whether the resulting fill succeeds or fails                       |
| **Under-/overpayment** | Reverts with `InsufficientSomiPayment`                                                              |

The admin can rotate `somiPaymentPerOrder` mid-life via `setSomiPaymentPerOrder`. Each stored order remembers the SOMI it paid at creation, so refunds remain correct across rate changes.

### Registry Lifecycle and Dormant State

The registry must hold an active Somnia reactivity subscription before it can accept orders. Calls to `createPendingOrder` revert with `NoActiveSubscription` while the registry is dormant.

If the admin ever removes the subscription, any pending orders become **inert** — they cannot be triggered. To recover funds in that state, anyone can call `cancelInertOrders` with the affected order IDs; each order's `somiPaid` is credited to the original owner's unclaimed balance, recoverable via `claimSomi()`.

### Important Notes

- **No token escrow.** The registry does not lock your tokens. You must have sufficient balance deposited in the SpotPool vault when the order triggers. The registry performs a point-in-time balance check at creation; if your free balance drops before the trigger fires, the resulting placement fails gracefully (`PendingOrderTriggered(success=false)`), and the order is removed.
- **All triggered orders are IOC.** They never rest on the order book. If there isn't enough counterparty liquidity at the limit price, unfilled quantity is discarded.
- **Orders are one-shot.** Once triggered — whether the fill succeeds or fails — the pending order is permanently removed. It cannot be re-triggered.
- **Trigger feed.** The mark price is the EMA-smoothed midpoint emitted by the SpotPool. Triggers are processed automatically via Somnia's on-chain reactivity system.
- **Batch processing.** When a price update triggers multiple stop orders, they are processed in a single transaction. A failed order does not block the others. The trigger loop respects a configurable gas buffer to leave headroom for the precompile's own bookkeeping.
- **Quantity constraints.** Order quantity must be >= `minQuantity` and a multiple of `lotSize` from the SpotPool. Orders that don't meet these constraints are rejected at creation time.

### Contract Reference

- [Functions](/developers/contracts/functions.md#stop-orders-spotstoporderregistry) — `createPendingOrder`, `cancelPendingOrder`, `claimSomi`, admin functions and view helpers.
- [Events](/developers/contracts/events.md#stop-order-events) — `PendingOrderCreated`, `PendingOrderTriggered`, `PendingOrderCancelled`, `InertOrderCancelled`, `SomiRefundFailed`.
- [Types](/developers/contracts/types.md#stop-order-types) — `PendingOrderType`, `Operator`, `PendingOrder`, `PendingOrderWithTrigger`, `StoredPendingOrder`.

## Contracts

> Source: https://docs.dreamdex.io/developers/contracts.md

The Somnia DEX uses a distinct contract for each trading pair. To discover available markets and their contract addresses, query the [`GET /v0/markets`](/developers/http-api/market-data.md) endpoint.

### OrderBook API (SpotPool)

- [Types](/developers/contracts/types.md) — structs and enums used in function signatures and event payloads.
- [Functions](/developers/contracts/functions.md) — place, cancel, reduce, and query orders; deposit and withdraw from the vault; manage builder approvals.
- [Events](/developers/contracts/events.md) — on-chain events emitted by the order book contract.

### StopOrderRegistry API (SpotStopOrderRegistry)

Each SpotPool has a corresponding StopOrderRegistry for stop-loss, take-profit, and stop-buy orders. See [Stop Orders](/trading/readme-1/stop-orders.md) for how they work.

- [Types](/developers/contracts/types.md#stop-order-types) — `PendingOrderType`, `Operator`, `PendingOrder`, `PendingOrderWithTrigger`
- [Functions](/developers/contracts/functions.md#stop-orders-spotstoporderregistry) — `createPendingOrder`, `cancelPendingOrder`, `claimSomi`, and view functions
- [Events](/developers/contracts/events.md#stop-order-events) — `PendingOrderCreated`, `PendingOrderTriggered`, `PendingOrderCancelled`, `SomiRefundFailed`

### SpotRouter API

A multi-stage swap router that walks ordered SpotPool legs as taker orders in a single transaction. Powers the [Simple Swap](/trading/readme-1/simple-swap.md) frontend. The router is a pure orchestrator — pools auto-pull / auto-deliver between the user's wallet and the router never custodies funds across legs.

- [SpotRouter reference](/developers/contracts/spot-router.md) — functions (`swapExactIn` / `swapExactOut` / `quoteMarketExactIn` / `quoteExactIn` / `quoteExactOut`), events, errors, caller prerequisites, and the quote → swap recipe.

## HTTP API

> Source: https://docs.dreamdex.io/developers/http-api.md

The DEX HTTP API provides a programmatic REST interface that allows integrators to list the currently-available markets and currencies, prepare orders for transmission, and receive real-time updates about all orders placed on Somnia.

See also the [WebSocket API](/developers/websocket-api.md) for truly real-time communication with the DEX.

Note that, unlike some DEX services, the HTTP API is not sufficient to place an order - the client is expected to be able to connect to the Somnia network and transmit their order themselves. See the [Trading](/developers/http-api/trading.md#post-v0-markets-symbol-orders) method for more information.

### Base URLs

Every REST endpoint is served under the `/v0` path prefix. Pick the row for your target environment and prepend the base URL to the operation paths shown throughout these docs (e.g. `GET /v0/markets` becomes `https://api.dreamdex.io/v0/markets`).

| Environment              | Chain ID | REST base URL                    | WebSocket public feed                    |
| ------------------------ | -------- | -------------------------------- | ---------------------------------------- |
| Mainnet (Somnia)         | `5031`   | `https://api.dreamdex.io/v0`     | `wss://api.dreamdex.io/v0/ws/public`     |
| Testnet (Somnia Shannon) | `50312`  | `https://stg.api.dreamdex.io/v0` | `wss://stg.api.dreamdex.io/v0/ws/public` |

> The `/v0` segment is required on both environments. Omitting it (e.g. `https://stg.api.dreamdex.io/markets`) returns a 404.

The examples in these docs use the mainnet base URL. To target testnet, substitute the staging base URL above (and the [testnet contract addresses](/developers/contracts/contract-specifications.md#testnet-somnia-shannon-chain-id-50312)). The [Quick Start](/developers/quick-start.md) parameterises this as a `$BASE_URL` shell variable so a single set of commands works against either environment.

For the live markets and currency codes accepted by `{symbol}` path parameters, see [Markets and currency codes](/developers/http-api/market-data.md#markets-and-currency-codes).

## WebSocket API

> Source: https://docs.dreamdex.io/developers/websocket-api.md

The DEX WebSocket API provides a means for integrators to both receive real-time updates about the state of the DEX order book, as well as call certain API methods for cases where the [HTTP API](/developers/http-api.md) is inappropriate.

---

# Event Contracts

> Source: https://docs.dreamdex.io/developers/event-contracts.md

Event Contracts trade on the Somnia Markets on-chain order book. The developer surface is the **`@somnia-chain/markets-sdk`** (TypeScript) — the [HTTP API](/developers/http-api.md) covers spot only and has no event-contract endpoints.

With the SDK you can:

- Discover live markets and stream order books, fills, and candles in real time
- Place and cancel orders by symbol in human units (prices are Up probabilities in (0, 1))
- Mint and merge complete sets (1 USDso ⇄ 1 Up + 1 Down) for sell-side inventory
- Redeem winning positions after settlement

## Install

The SDK is public on npm. Nothing else to configure:

```bash
npm install @somnia-chain/markets-sdk viem
```

Use version 0.28.0 or newer. Two floors matter: below 0.23.0 nothing reads at all, because the indexer dropped the `longOpenInterest` column those versions still ask for and `loadMarkets` and `listBinaryMarkets` both fail; and below 0.28.0 an ordinary float price lands off the tick grid and the pool rejects it. The examples here are TypeScript, so run them with a TypeScript runner such as [`tsx`](https://tsx.is) (`npx tsx bot.ts`).

## A minimal loop

Discover a market, gate on its live on-chain state, read the book, take a position:

```ts
import { SomniaMarkets, isBinaryMarket, type PlaceOrderResult } from "@somnia-chain/markets-sdk";

const exchange = new SomniaMarkets({ indexerUrl, chain, wsRpcUrl, addresses, privateKey });
const markets = Object.values(await exchange.loadMarkets(true));

for (const m of markets) {
  // `info` is a union across market kinds; isBinaryMarket narrows it.
  if (!m.active || !isBinaryMarket(m.info)) continue;

  // The indexer lags: gate every write on the live on-chain status (1 = Trading).
  // Row ids are plain strings; the client wants them hex-typed.
  const onchain = await exchange.client.getMarketOnchain(m.info.marketId as `0x${string}`);
  if (onchain.status !== 1) continue;

  const upSymbol = m.outcomes?.[0]?.symbol;   // e.g. "BTC-0-12AUG26-1600/USDso#YES"
  if (!upSymbol) continue;
  const book = await exchange.fetchOrderBook(upSymbol, 5);
  const ask = book.asks[0]?.[0];
  if (ask === undefined) continue;                    // no resting liquidity yet

  // Cross the touch; IOC so the unfilled remainder never rests silently.
  // From 0.23.0 a reverted write throws a decoded revert error, so let it
  // propagate or catch it here rather than testing a status flag.
  const order = await exchange.createOrder(upSymbol, "limit", "buy", 5, ask + 0.02, { timeInForce: "IOC" });

  // The receipt rides on `info`; the order itself has no `receipt` field.
  const { receipt } = order.info as PlaceOrderResult;
  console.log("filled in", receipt.transactionHash);
}
```

The package README on [npm](https://www.npmjs.com/package/@somnia-chain/markets-sdk) covers the rest of the surface: realtime watches, the React hooks, and the raw trader tier. Types ship with the package, so an editor with TypeScript will autocomplete the whole API.

Go deeper: [Recipes](/developers/event-contracts/recipes.md) has a snippet for every action a bot needs, from resting a quote to redeeming after settlement; [Market Structure & Lifecycle](/developers/event-contracts/market-structure.md) explains the contract family, the four fill paths, and escrow; [Contracts & Addresses](/developers/event-contracts/contracts-and-addresses.md) lists the deployed core.

> There are no API rate limits: market data is the chain itself, and the public RPC endpoints are unthrottled. A trading system should snapshot once and stay current from on-chain events — the SDK's live watches do exactly this.

Two mechanics worth understanding before you build:

- **One book, two sides.** Up and Down trade on a single order book; a Down price is always 1 minus the Up price. Two opposite-side buyers can cross with no seller at all — the pool mints a fresh Up/Down pair from their combined collateral (so you can quote both sides with zero inventory).
- **Markets die on schedule and respawn.** Every window has a hard expiry; the venue rolls a successor automatically. Track the successor via the market list, and note that a settled market leaves the live list — winnings are claimed by scanning recently settled markets.

Read the [Gotchas](/developers/event-contracts/gotchas.md) before sending a real order.

## Recipes

> Source: https://docs.dreamdex.io/developers/event-contracts/recipes.md

Every action an event-contract bot needs, as a short snippet. All of these assume an `exchange` built as in [Building on Event Contracts](/developers/event-contracts.md), and a signer for anything that writes. Types used below (`PlaceOrderResult`) come from the same package.

Three tiers are available and you will use all of them:

| Tier            | Reach it with       | Use it for                                                                            |
| --------------- | ------------------- | ------------------------------------------------------------------------------------- |
| Unified         | `exchange.*`        | Trading by symbol in human units. Most of your bot.                                   |
| Client (reads)  | `exchange.client.*` | On-chain truth: market status, outcome balances.                                      |
| Trader (writes) | `exchange.trader.*` | The few writes the unified tier does not model, notably redeeming a specific outcome. |

### Find a market worth trading

Gate on the **on-chain** status, and skip windows that are about to close.

`listLiveBinaryMarkets` returns only the windows that are currently open, already scoped to binary markets, so there is no spot or perp to fetch and discard:

```ts
const now = Date.now() / 1000;
const candidates = [];

for (const m of await exchange.client.listLiveBinaryMarkets({ limit: 50 })) {
  // The row carries an indexer status too, but that trails the chain.
  const onchain = await exchange.client.getMarketOnchain(m.marketId as `0x${string}`);
  if (onchain.status !== 1) continue;                 // 1 = Trading
  const secondsLeft = Number(m.expiry) - now;
  if (secondsLeft < 300) continue;                    // no time for anything useful
  candidates.push({ market: m, onchain, secondsLeft });
}
```

Pass a filter to narrow by venue, asset or cadence. `loadMarkets` still works if you want one symbol-keyed map across every market kind, but for a bot that only trades event contracts this is the direct route.

Keep the `onchain` snapshot you validated and reuse it for the rest of the pass. Pools are recycled between windows, so a snapshot taken now is the one generation your reads and writes agree on.

### Read the book

```ts
const [up, down] = market.outcomes ?? [];
if (!up || !down) return;                       // not a binary market
const { yes, no } = { yes: up.symbol, no: down.symbol };
const book = await exchange.fetchOrderBook(yes, 5);
const bestBid = book.bids[0]?.[0];
const bestAsk = book.asks[0]?.[0];
```

Prices are Up probabilities in (0, 1). The Down book is the same book read from the other side: quote `no` and the SDK converts to Up terms for you.

### Read a market's volume

Every market row carries its own traded volume, so per-contract volume is a read rather than something you aggregate yourself:

```ts
const rows = await exchange.client.listBinaryMarkets({ status: "Finalized", limit: 60 });

for (const m of rows.filter((r) => Number(r.tradeCount) > 0)) {
  console.log({
    asset: m.asset,                                       // "BTC" | "ETH"
    cadence: Number(m.intervalSec) / 60 + "m",
    volume: Number(m.cumulativeQuoteVolume) / 1e18,       // collateral, USDso
    contracts: Number(m.cumulativeBaseVolume) / 1e18,
    trades: Number(m.tradeCount),
    lastPrice: m.lastPrice ? Number(m.lastPrice) / 1e18 : null,
    lastTradeAt: m.lastTradeAt,
  });
}
```

To rank markets by volume rather than scan for it, pass `orderBy: "volume"`. The sort runs server-side; the keys are `newest`, `closingSoon`, `volume` and `tradeCount`.

`cumulativeQuoteVolume` is the collateral that changed hands, counting each fill once: a direct fill is worth one side's notional, and a mint or burn is worth the whole contract because the two sides each pay their share of it. Summing your own per-trader legs instead gives a larger number, because a direct fill has both a payer and a receiver.

Divide by the collateral's decimals, not by a constant: 18 on mainnet USDso, 6 on the testnet faucet token.

For a ccxt-shaped view of the same numbers, `fetchTicker(outcomeSymbol)` returns `baseVolume` and `quoteVolume` already scaled.

### Size to the venue's lot grid

From markets-sdk 0.24.0 `amountToPrecision` reads the pool's lot size, so the unified verbs size correctly on their own. Anything below one lot floors to **zero**: ask for 0.0004 contracts on mainnet and you get `0`, with nothing thrown. Check the result and skip the order when it comes back 0, or you will send an order for nothing and wonder why the book never shows it.

You still quantize by hand when you build params for the raw trader tier, which takes exact units:

```ts
const LOT = 1_000_000_000_000_000n;           // 1e15 on an 18-decimal venue
const decimals = 18;

function quantize(human: number): number {
  const raw = BigInt(Math.floor(human * 10 ** decimals));
  const snapped = (raw / LOT) * LOT;
  return Number(snapped) / 10 ** decimals;    // 0 means "below one lot, skip"
}
```

### Price and size on the venue's grid

The pool accepts prices on a tick grid and sizes on a lot grid. Read them rather than hardcoding them, because they scale with the collateral's decimals:

```ts
const { tickSize, lotSize, minQuantity } = await exchange.client.getBinaryBookParams(pool);
// mainnet today: all three are 1e15, so 0.001 in probability and 0.001 contracts
```

From markets-sdk 0.28.0 the unified verbs snap for you. `priceToPrecision` takes `0.0512` to `0.051`, and `amountToPrecision` takes `0.137` to `0.137`, both on the venue's own grid, so ordinary numbers convert onto the grid instead of a few wei off it.

> Below 0.28.0 an ordinary float price did not land. `createOrder` converted with `parseUnits(price.toFixed(18), 18)`, and `(0.05).toFixed(18)` is `"0.050000000000000003"`, three wei off the grid, which the pool rejects with `InvalidPrice`. Only 0.25, 0.5 and 0.75 survived that conversion. If you are pinned below 0.28.0, snap prices to whole ticks and send bigints through the raw trader tier.

When you want exact units rather than the unified verbs, build them yourself and send them through the raw trader tier:

```ts
const ONE = 10n ** 18n;                 // collateral scale, 1e6 on testnet
const TICK = 1_000_000_000_000_000n;    // 1e15 = 0.001 here, 1e3 on testnet
const LOT = TICK;

const ticks = (p: number) => BigInt(Math.round(p * Number(ONE / TICK))) * TICK;
const lots = (q: number) => BigInt(Math.floor(q * Number(ONE / LOT) + 1e-9)) * LOT;

await exchange.trader.placeOrder({
  pool: onchain.pool,
  side: "BUY_YES",                      // or SELL_YES / BUY_NO / SELL_NO
  price: ticks(0.05),                   // always in YES terms: a NO price is ONE - ticks(p)
  quantity: lots(5),
  orderType: ORDER_TYPE.POST_ONLY,      // LIMIT | MARKET (IOC) | FILL_FOR_KILL | POST_ONLY
  expireTimestampNs: BigInt(Math.floor(Date.now() / 1000) + 300) * 1_000_000_000n,
});
```

### Take liquidity

Cross the touch with IOC so the remainder never rests behind your back.

```ts
const size = quantize(5);
if (size > 0 && bestAsk !== undefined) {
  const order = await exchange.createOrder(yes, "limit", "buy", size, bestAsk + 0.02, {
    timeInForce: "IOC",
  });
  // The unified result has no `receipt` of its own: it wraps the raw tx result
  // in `info`, and that is where the on-chain status lives.
  const { receipt } = order.info as PlaceOrderResult;
  if (receipt.status === "reverted") throw new Error("reverted on-chain");
  console.log(`filled ${order.filled} of ${order.amount}`);
}
```

### Rest a quote

Post-only means the order refuses to cross, so a quoting loop never pays the spread.

A post-only that would have crossed **reverts** with `PostOnlyWouldCross()`, and the call throws. It does not come back with a status for you to inspect, on either tier: the unified `createOrder` and the raw `trader.placeOrder` both raise it. Catch it and treat it as "the book moved into me", which on a quoting loop is a normal event rather than a fault.

```ts
try {
  await exchange.createOrder(yes, "limit", "buy", size, 0.45, { postOnly: true });
} catch (err) {
  if (String(err).includes("PostOnlyWouldCross")) {
    // the touch moved through our price between the read and the send; requote
  } else {
    throw err;
  }
}
```

Every order carries an expiry capped at the market's own. Set it just past your requote interval and a crashed bot's orders age off the book on their own.

### Get inventory so you can sell

You can only sell an outcome you hold, and there is no naked short. New tokens come from minting a **complete set**: collateral in, one Up plus one Down out.

```ts
await exchange.mintSet(market.symbol, 10);    // 10 collateral -> 10 Up + 10 Down
// ...later, to unwind an unsold pair back to collateral:
await exchange.burnSet(market.symbol, 10);
```

You do not need this to quote both sides. Two opposite-side buyers cross with no seller at all (the pool mints the pair from their combined collateral), so a resting Buy Up at *p* plus a Buy Down at *1 − p* is already a two-sided quote with zero inventory.

### Manage working orders

```ts
const open = await exchange.fetchOpenOrders(yes);
for (const o of open) await exchange.cancelOrder(o.id, yes);
```

Cancel refunds return to your **wallet**, in the exact amount that was escrowed, so reconcile there. The per-pool vault is a payout fallback and normally reads 0, though placement draws it first when it does hold something.

### Know what actually filled

Treat your own trade history as the source of truth for position, not what you asked for.

```ts
const trades = await exchange.fetchMyTrades(yes, since);
const shares = trades.filter((t) => t.side !== "sell").reduce((n, t) => n + t.amount, 0);
```

Indexer rows land a few seconds after the transaction confirms, so poll with a deadline rather than trusting a single read.

### Check your positions

Outcome tokens are ids on one shared ERC-6909 contract, not per-market ERC-20s, so read them by id:

```ts
const me = exchange.walletAddress;
if (!me) throw new Error("no signer");
const up = await exchange.client.getOutcomeBalance(onchain.outcomeToken, me, onchain.yesId);
const down = await exchange.client.getOutcomeBalance(onchain.outcomeToken, me, onchain.noId);
```

### Redeem after settlement

This is the step people miss, and `loadMarkets()` will not help you find it.

A settled market leaves the live list, and the registry sweep behind `loadMarkets()` skips finalized binary markets outright — so filtering it for inactive rows returns an empty set and a redeem-by-scan bot silently reports nothing to claim while real winnings sit unredeemed.

The binary tier still has them, under the terminal status `"Finalized"`:

```ts
const settled = await exchange.client.listBinaryMarkets({
  venueId,
  status: "Finalized",
  limit: 120,
});
const settledMarketIds = settled
  // The server sorts newest-created; you want newest-expired. Those agree within
  // a series but not across cadences, so over-fetch and sort before you cut.
  .sort((a, b) => Number(b.expiry ?? 0) - Number(a.expiry ?? 0))
  .slice(0, 40)
  .map((m) => m.marketId);
```

Then redeem through the trader with an explicit outcome index. The convenience method infers the winner from the market, which is meaningless on a voided market where both sides pay 0.5.

```ts
type OutcomeIdx = 0 | 1;
const UP: OutcomeIdx = 0, DOWN: OutcomeIdx = 1;

// marketIds from the query above.
for (const marketId of settledMarketIds) {
  const oc = await exchange.client.getMarketOnchain(marketId as `0x${string}`);
  if (!oc.isResolved && !oc.isVoided) continue;

  const held: Record<OutcomeIdx, bigint> = {
    [UP]: await exchange.client.getOutcomeBalance(oc.outcomeToken, me, oc.yesId),
    [DOWN]: await exchange.client.getOutcomeBalance(oc.outcomeToken, me, oc.noId),
  };

  // Voided: claim both sides at 0.5. Resolved: only the winning side pays.
  const toClaim: OutcomeIdx[] = oc.isVoided ? [UP, DOWN] : [oc.winningOutcome === 0 ? UP : DOWN];

  for (const outcome of toClaim) {
    if (held[outcome] === 0n) continue;
    const res = await exchange.trader.redeem({
      marketId: marketId as `0x${string}`,
      market: oc.marketAddress,
      outcomeToken: oc.outcomeToken,
      outcomeIdx: outcome,
      amount: held[outcome],
    });
    if (res.receipt?.status === "reverted") throw new Error("redeem reverted");
  }
}
```

Redeeming a losing position does not revert. It succeeds and pays nothing, so check the outcome before you spend gas.

### Read a settled market's history

Settled markets are not in `loadMarkets()`, and `listBinaryMarkets({ status: "Finalized" })` is only the start of what the indexer keeps. There is a purpose-built history surface:

```ts
// most-recently-expired first; filter by venue, asset, cadence; page with limit + offset
const past = await exchange.client.listPastBinaryMarkets({ status: "Finalized", asset: "BTC", limit: 50 });

const total = await exchange.client.countBinaryMarkets({});      // how far the tail goes
const res   = await exchange.client.getMarketResolution(marketId);
const open  = await exchange.client.getOpeningPrices([marketId]);
const pnl   = await exchange.client.getBinaryPositionPnL(account, marketId);
```

`getMarketResolution` returns objects rather than bare prices. The number you want is `numericValue`: compare `openingAnswer.numericValue` against `closingAnswer.numericValue` and you have the comparison the market settled on, alongside `events` for the lifecycle.

Use **`Finalized`** to reach settled markets. Resolution auto-finalizes, so markets do not linger in `Resolved`, and asking for that status returns an empty list.

> `getCandles` and `getFills` are keyed on the **pool**, and a pool serves many successive markets. One live pool has already carried 100 of them, so `getCandles(poolAddress, 60)` happily returns candles from dozens of markets that are not the one you asked about.
>
> Scope every history read to the market's own window, or filter the rows by `market` afterwards. Note the option names differ between the two calls:
>
> ```ts
> const candles = await exchange.client.getCandles(pool, 60, { from: m.tradingStart, to: m.expiry });
> const fills   = await exchange.client.getFills(pool, { since: m.tradingStart, until: m.expiry });
> ```

Candle buckets come at 60, 300, 900, 3600, 14400 and 86400 seconds. `getUserFills(account, opts)` is the same tape filtered to one wallet.

#### What is kept

Fills, orders and candles all survive settlement. A five-week-old finalized market still returns its full trade tape, its candles, and every order that ever rested on it, including the ones that were cancelled without trading.

There is no order-book snapshot table, but you do not need one: every order carries `placedAtBlock` and `lastUpdatedAtBlock`, so the resting book at any block is derivable from the order rows, and the fills carry `blockNumber` and `logIndex` for exact ordering.

Two things not to assume. `fetchPriceCandles` reads an external price feed rather than the book, and needs `priceFeed` configured. And `getMarketStatusHistory` currently returns the `Locked` transition rather than a full `Listed → Trading → … → Resolved` trail.

### Follow a series as it rolls

Windows expire on a schedule and the venue opens a successor automatically. Key your state by `marketId` or by symbol, never by pool address, and re-resolve the current window each cycle rather than caching it.

```ts
// Every cycle: re-read the market list, pick the live window for your series,
// and start a fresh position count when the symbol changes.
if (currentSymbol !== previousSymbol) resetPositionState();
```

### Where to go next

The full API surface, including realtime watches and the React hooks, is documented in the package README on [npm](https://www.npmjs.com/package/@somnia-chain/markets-sdk). Types ship with the package, so an editor with TypeScript will autocomplete everything above.

Read the [Gotchas](/developers/event-contracts/gotchas.md) before sending a real order.

## Market Structure & Lifecycle

> Source: https://docs.dreamdex.io/developers/event-contracts/market-structure.md

### One market, four contracts

Every event-contract market is a small family of contracts deployed per window:

| Piece                 | Role                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `BinaryMarketsModule` | The registry and user entry point. Holds every market's record (`markets(marketId)`), routes complete-set mints/merges and redemptions. |
| Market contract       | Per-window lifecycle state: trading window, resolution, winning outcome.                                                                |
| Pool (order book)     | The CLOB you trade on. Extends the same on-chain matching engine as spot, and owns all escrow.                                          |
| `OutcomeToken6909`    | One shared ERC-6909 singleton for all markets — Up and Down positions are token *ids* on it, not separate ERC-20 deploys.               |

Markets are identified by a `bytes32 marketId` (a module-scoped counter). **Key your state by `marketId` or symbol, never by pool address**: pools are recycled across successive windows of a series, so a pool address is a time-varying binding.

### Lifecycle

```
Listed → Trading → Locked → Resolved | Voided
  0        1          2         4        5
```

- **Listed (0)** — deployed, not yet open.
- **Trading (1)** — the only state that accepts orders. Mint/merge of complete sets is live.
- **Locked (2)** — the window ended; no new orders, cancels still work. Awaiting the settlement price.
- **Resolved (4)** — winning side fixed; winners redeem 1 USDso per contract (less the venue settlement fee — 0 on dreamDEX).
- **Voided (5)** — no reliable settlement price inside the settlement window; both sides redeem at 0.5.

Status transitions are time-derived on-chain — read the market's live status before every write; the indexed status lags by seconds. (An intermediate `Settling (3)` exists in the enum but is effectively never observable.)

### The order book: one book, two sides

Up and Down trade on a **single** order book quoted in Up terms; a Down price is always `1 − up price`. Crossing orders settle by one of four paths:

| Crossing pair        | Path            | What happens                                                            |
| -------------------- | --------------- | ----------------------------------------------------------------------- |
| Buy Up × Sell Up     | direct          | Up tokens ↔ collateral swap                                             |
| Buy Down × Sell Down | direct          | Down tokens ↔ collateral swap                                           |
| Buy Up × Buy Down    | **mint-a-pair** | Both pay collateral; the pool mints a fresh Up/Down pair, one side each |
| Sell Up × Sell Down  | burn-a-pair     | Both positions burn; each seller is paid their share                    |

Mint-a-pair is the cold-start mechanism: two opposite-side buyers need no seller and no market maker — which also means you can quote **both sides with zero inventory** (a resting Buy Up at *p* plus Buy Down at *1 − p* is a complete two-sided quote).

### Escrow and complete sets

- **Buys** escrow collateral at placement (worst case, vault-first: your per-pool vault balance is spent before your wallet).
- **Sells** escrow the outcome tokens themselves — you can only sell what you hold. New tokens come from minting a **complete set**: 1 USDso mints 1 Up + 1 Down (`mintCompleteSet`), and merging a pair returns 1 USDso (`mergeCompleteSet`).
- Refunds settle in your **wallet**. Cancelling a resting bid returns the exact escrow to it, and a taker is charged the fill price rather than the price it offered. The pool vault is a payout fallback that reads 0 in normal operation, which is why placement can draw it first without you ever seeing a balance there.

### Settlement rail

Resolution is oracle-driven and permissionless to observe: the settlement reference for each market is published, results are checked against the window's opening price, and redemption is served on-chain. The protocol supports a one-time settlement fee on winning redemptions; dreamDEX sets every fee — maker, taker, and settlement — to zero.

#### Who triggers resolution

Nobody has to — the chain does. Each market's settlement question is scheduled on the oracle hub at creation, with the gas for its future resolution reserved up front. When the oracle posts the settlement answer at expiry, **Somnia's on-chain reactivity delivers that event straight to the hub's callback** — no keeper, no cron job, no operator in the loop. The hub hands the result to the `BinaryMarketsModule` (the only address a market trusts as its settler), the market flips to Resolved or Voided, and finalization happens in the same flow, so redemption opens immediately.

Two permissionless backstops cover a missed callback:

- `pokeOracle(questionId)` pulls a posted answer manually and resolves the market.
- Once the settlement window passes with no answer, anyone can call the market's `voidExpired()` — it voids, and both sides redeem at 0.5.

A market can never strand funds waiting on someone's permission.

#### Auditing a resolution

How the *answer itself* is produced is public. A market row carries an `oracleQuestionId`, and that id is the question's number on the oracle explorer, so you can deep-link any market straight to its own resolution:

```
https://prd.oracle.somnia.host/questions/{oracleQuestionId}?view=graph
```

The Graph tab walks the pipeline for that market: the on-chain question definition, every price source with the value it returned and a receipt, the median across them, the minimum number of sources that had to succeed, and the interval the median fell into. Worth surfacing in any interface you build on top of event contracts.

## Contracts & Addresses

> Source: https://docs.dreamdex.io/developers/event-contracts/contracts-and-addresses.md

The protocol core is deployed via CREATE3, so the addresses are **identical on testnet and mainnet**:

| Contract            | Address (testnet 50312 = mainnet 5031)       |
| ------------------- | -------------------------------------------- |
| BinaryMarketsModule | `0x3ecC694Cef705358864a646142ac17A90E29e388` |
| MarketsCore         | `0x2802504314685D89bF6C992CA5a8e7cC78bc0294` |
| BinarySettlement    | `0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23` |
| OutcomeToken6909    | `0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9` |
| OracleHub           | `0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b` |
| CollateralRouter    | `0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C` |

Per-market contracts (the market and its pool) are read from the module registry — `markets(marketId)` — or from the SDK; never hardcode them, since pools are recycled across windows.

**Collateral** is per-venue:

| Network | Token | Address                                      | Decimals |
| ------- | ----- | -------------------------------------------- | -------- |
| Mainnet | USDso | `0x00000022dA000002656c64D9eA6011ea952D008A` | 18       |
| Testnet | tUSDC | `0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E` | 6        |

The two differ by a factor of 10^12. A constant that converts correctly on testnet misprices every order, book read and balance on mainnet, and nothing reverts to tell you — derive the scale from the collateral's `decimals()` rather than from a literal.

These are proxies, so each one's implementation can roll forward while the address stays put. Check any of them on the Somnia explorer: [mainnet](https://explorer.somnia.network) and [testnet](https://shannon-explorer.somnia.network).

Working from a non-JS stack? `@somnia-chain/markets-sdk` exports the ABIs you need directly (`binaryModuleReadAbi`, `binaryModuleWriteAbi`, `binarySettlementAbi`, `erc6909Abi`, `oracleHubAbi`), so you can pull them out of the package and drive the contracts with any RPC client. The package ships its own sources, so `npm pack` and open `src/` to read them as human-readable signature strings that mirror the Solidity.

> Confirm the addresses on-chain before trading real funds, and never hardcode a market or pool address: those are per-window, and pools are recycled across windows. Read them from the module registry or the SDK instead.

### Getting testnet collateral

The testnet token mints on demand, so there is no faucet page and no address to paste anywhere: `faucet(uint256 amount)` credits **`msg.sender`**, and each call is capped at **10,000 tUSDC**. Asking for more reverts with `FaucetCapExceeded`.

```ts
await exchange.trader.faucet();                       // 10,000 tUSDC, the cap
await exchange.trader.faucet({ amount: 500n * 10n ** 6n });  // raw units, 6 decimals
```
