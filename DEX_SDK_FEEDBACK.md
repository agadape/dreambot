# DreamDEX Event Contracts – SDK & Docs Feedback

_Compiled from our hands-on experience building "DreamBot Signal" during the Hackathon._

## Documentation

1. [x] **Hidden GraphQL Indexer URL for Shannon Testnet**. In the SDK documentation (e.g., Quick Start), the `indexerUrl` parameter is listed as required, yet the actual URL value is never explicitly documented. As new developers to the ecosystem, we initially guessed REST API URLs (`stg.api.dreamdex.io/v0`) before realizing they don't serve event contracts via the SDK. We eventually had to inspect the Network Tab on `tvlr.tech` to discover `https://tvlr.tech/v1/graphql` and `https://markets.stg.somnia.host/v1/graphql`. It is highly recommended to explicitly state the public `indexerUrl` endpoint in the "Quick Start" guide.
2. [x] **SDK Endpoint Fallbacks**. If `indexerUrl` is indeed required, ideally `@somnia-chain/markets-sdk` should provide a default constant/URL for the Shannon Testnet, or at least expose it in easily accessible enums/configs out-of-the-box.

## Infrastructure & Event Contracts Endpoints

1. [x] **SSL / TLS Certificate Mismatch**. The URL `https://tvlr.tech/v1/graphql` has an SSL certificate issued for the domain `markets.stg.somnia.host`. Consequently, modern Node.js environments (like Node 22 using native Undici `fetch`) throw an `ERR_TLS_CERT_ALTNAME_INVALID` error when the SDK is invoked, which the SDK then unhelpfully wraps as a generic `connection error`. Our workaround was setting `NODE_TLS_REJECT_UNAUTHORIZED=0` or directly querying `https://markets.stg.somnia.host/v1/graphql`. Please resolve the certificate mismatch for seamless server-to-server bot integrations.
2. [x] **Indexer Error Handling**. When the Somnia/DreamDEX staging database goes down (we encountered internal `postgres-error` responses), the HTTP response still returns 200 OK with a JSON payload containing GraphQL Errors. The SDK (`graphqlBoundary.js`) correctly throws this, but wraps it in a generic `connection error` message. This leaves developers guessing whether their internet connection failed or DNS is down, when in reality it's a database error on the DreamDEX server side. Indexer/Envio error handling could be more transparent.

## SDK / Bot Kit

1. [x] **Order Placement Architecture**. The instructions and implementation for placing orders are extremely intuitive. The *mint-a-pair* approach without needing a counterparty (just *Buy Up x Buy Down*) is a brilliant AMM collateral-swap architecture that heavily simplifies bot creation without *inventory* risk.
2. [x] **Typing for Binary Markets**. The `EventContractMarket` type (or its descendants from `listLiveBinaryMarkets`) is well-structured and easily pairs with `fetchOrderBook`. However, it would be beneficial if `outcomes` were guaranteed to exist on the base type when it's strictly a *Binary Market* (without requiring optional chaining `?.symbol`). This would eliminate many type assumptions on the TypeScript side.

## The Good Stuff (Praise where it's due)

1. [x] Using `@somnia-chain/markets-sdk` is immensely helpful compared to calling raw smart contracts via `viem`. The abstraction layer hits the perfect sweet spot.
2. [x] The documentation around **Session Keys** is a lifesaver for hackathons. It enforces security best practices, eliminating the need to expose a main wallet's private key inside a server `.env`.
3. [x] The **Unified Indexer** feature (a single query endpoint for spot, perps, and event contracts) is futuristic and makes querying data much faster and more reliable compared to listening to a sluggish sub-graph.
