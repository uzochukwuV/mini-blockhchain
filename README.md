# Blockchain HomeTask Project

A blockchain implementation with a layered Express backend and a React frontend.

> **For Applicants:** See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for task requirements (2 tasks, 4–6 hours).
> See [SETUP.md](./SETUP.md) for a quick-start guide.

---

## Project Structure

```
hometask-blockchain/
│
├── config/
│   └── index.js                  # Environment config (port, CORS, blockchain settings)
│
├── models/
│   ├── blockchain.js             # Block, Transaction, Blockchain domain classes
│   └── index.js                  # Singleton instance + demo data seeding
│
├── utils/
│   ├── logger.js                 # Levelled logger (error / warn / info / debug)
│   ├── response.js               # Unified sendSuccess / sendCreated / sendError helpers
│   └── validator.js              # isValidAddress, isValidAmount, sanitizers
│
├── middleware/
│   ├── cors.middleware.js        # CORS policy
│   ├── logger.middleware.js      # Morgan HTTP request logger
│   ├── errorHandler.middleware.js# Centralised error handler (must be last)
│   ├── notFound.middleware.js    # 404 handler
│   ├── validateRequest.middleware.js  # validateBody / validateParams factories
│   └── rateLimit.middleware.js   # apiLimiter (100 req/min) + writeLimiter (20 req/min)
│
├── routes/
│   ├── index.js                  # Aggregates all /api sub-routes
│   ├── blockchain.routes.js      # /api/chain
│   ├── transaction.routes.js     # /api/transactions
│   ├── mining.routes.js          # /api/mine
│   ├── balance.routes.js         # /api/balance
│   ├── stats.routes.js           # /api/stats
│   └── health.routes.js          # /health (no rate limit)
│
├── controllers/
│   ├── blockchain.controller.js
│   ├── transaction.controller.js
│   ├── mining.controller.js
│   ├── balance.controller.js
│   └── stats.controller.js
│
├── src/                          # React frontend
│   ├── api/
│   │   ├── client.js             # Axios instance with request/response interceptors
│   │   ├── endpoints.js          # All API URL constants
│   │   └── blockchain.api.js     # Typed fetch functions (fetchChain, addTransaction…)
│   ├── hooks/
│   │   ├── useBlockchain.js      # Polls /api/chain + /api/stats, returns state
│   │   └── usePolling.js         # Reusable interval-based polling hook
│   ├── utils/
│   │   ├── formatters.js         # truncateHash, formatTimestamp, formatAmount
│   │   └── helpers.js            # isPositiveNumber, groupTransactionsByBlock, etc.
│   ├── constants/
│   │   └── index.js              # POLL_INTERVAL_MS, DEFAULT_MINER_ADDRESS, enums
│   ├── components/
│   │   ├── BlockchainViewer.js
│   │   ├── TransactionForm.js
│   │   ├── StatsPanel.js
│   │   ├── Header.js
│   │   └── ErrorBoundary.js      # React class error boundary
│   ├── App.js
│   └── index.js
│
├── blockchain.js                 # Backward-compat re-export → models/blockchain.js
├── server.js                     # Entry point — wires middleware, routes, starts server
├── .env.example                  # Template for environment variables
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm

### Install & Configure

```bash
npm install
cp .env.example .env   # then edit .env if you need different ports
```

### Run in Development

```bash
# Terminal 1 — React dev server on http://localhost:3000
npm start

# Terminal 2 — API server on http://localhost:3002, with auto-reload
npm run dev
```

The React app proxies all `/api/*` requests to the API server automatically via `src/setupProxy.js`.

### Run in Production

```bash
npm run serve   # builds the React app, then serves everything from port 3002
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `3002` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `BLOCKCHAIN_DIFFICULTY` | `2` | Proof-of-work difficulty |
| `BLOCKCHAIN_MINING_REWARD` | `100` | Coinbase reward per mined block |
| `INITIAL_MINER_ADDRESS` | `genesis-miner` | Address for the first demo block reward |
| `SEED_DEMO_DATA` | `true` | Set to `false` to start with an empty chain |
| `REACT_APP_API_URL` | `http://localhost:3002` | Used by the React app |

---

## Changes

### Cryptographic Wallet System

- Added `POST /api/wallets` to generate `secp256k1` wallet pairs on the backend using Node.js `crypto`.
- Replaced the demo transaction-validation bypass with real transaction signing and verification.
- Updated transaction submission so the frontend signs payloads locally before sending them to the API.
- Added a `Wallet` UI that generates a wallet, keeps the private key in component state, and shows the current balance for the generated public key.

### Blockchain Persistence

- Added `services/persistence.service.js` to save, load, and clear blockchain state in `blockchain.json` at the project root.
- Updated model bootstrap to restore persisted state on startup before considering demo seeding.
- Added automatic persistence after successful transaction creation and mining.
- Added safe fallbacks for missing files, invalid JSON, and invalid restored chains.

### New Env Vars

- No new environment variables were introduced for these changes.

### Known Limitations / Trade-offs

- The generated wallet private key is intentionally kept only in React component state, so a browser refresh or tab close discards it.
- Persisted state restores the blockchain and pending transactions, but not any client-side wallet keys.
- The persistence layer uses synchronous file I/O for simplicity and predictability in this small project.

---

## API Reference

All API responses share a common envelope:

```json
{ "success": true, ...payload }
{ "success": false, "error": "message" }
```

### Chain

| Method | Path | Description |
|---|---|---|
| GET | `/api/chain` | Full chain + length |
| GET | `/api/chain/valid` | `{ isValid: bool }` |

### Transactions

| Method | Path | Description |
|---|---|---|
| POST | `/api/transactions` | Add a pending transaction |
| GET | `/api/transactions/pending` | All pending transactions |
| GET | `/api/transactions/all` | All confirmed transactions |

**POST `/api/transactions` body:**
```json
{
  "fromAddress": "04...",
  "toAddress": "04...",
  "amount": 100,
  "timestamp": 1712050000000,
  "signature": "3045..."
}
```

### Wallets

| Method | Path | Description |
|---|---|---|
| POST | `/api/wallets` | Generate a new `{ publicKey, privateKey }` pair |

### Mining

| Method | Path | Description |
|---|---|---|
| POST | `/api/mine` | Mine pending transactions into a new block |

**POST `/api/mine` body:**
```json
{ "miningRewardAddress": "miner1" }
```

### Balance

| Method | Path | Description |
|---|---|---|
| GET | `/api/balance/:address` | Confirmed balance of an address |

### Stats

| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Chain length, difficulty, validity, pending count |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server uptime, env, timestamp — no rate limit |

---

## Frontend Architecture

The React app is organised into distinct concerns:

- **`src/api/`** — all network calls live here. Components never call `fetch`/`axios` directly.
- **`src/hooks/useBlockchain`** — single source of truth for chain + stats state; polls every 5 s.
- **`src/utils/formatters`** — pure formatting functions (hash truncation, timestamps, amounts).
- **`src/constants/`** — magic strings and numbers in one place.
- **`ErrorBoundary`** — catches any unhandled React render errors gracefully.

---

## Technologies

### Backend
- Node.js + Express
- `morgan` — HTTP request logging
- `dotenv` — environment variable loading
- `express-rate-limit` — API rate limiting
- `cors` — CORS policy middleware
- Node.js built-in `crypto` — SHA-256 hashing

### Frontend
- React 18
- Axios (with interceptors)
- CSS3 (glassmorphism, gradients, animations)

---

## Troubleshooting

**Port already in use**
```bash
# Use a different port
PORT=3003 npm run dev
```

**Frontend can't reach the API**
- Confirm `npm run dev` is running on port 3002
- Check `REACT_APP_API_URL` in your `.env`
- Confirm `src/setupProxy.js` target matches `PORT`

**Need to reset blockchain state**
- Delete `blockchain.json` or call the persistence service `clear()` helper in a test/script

---

## License

MIT — for learning and assessment purposes.
