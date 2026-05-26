# Nicehash API Server

This backend server exposes the complete Nicehash REST API with proper authentication.

## Running the Server

```bash
npm run api
# or
node server.js
```

Server runs on `http://localhost:8080`

---

## API Endpoints

### Accounting
- **GET** `//main/api/v2/account` - Account information
- **GET** `/api/nicehash/balances` - Multi-currency balances
- **GET** `/api/nicehash/balance/:currency` - Balance for specific currency (e.g., `BTC`, `USD`)
- **GET** `/api/nicehash/activities` - All currency activities
- **GET** `/api/nicehash/activities/:currency` - Activities for specific currency
- **GET** `/api/nicehash/currencies` - Available currencies
- **GET** `/api/nicehash/deposits` - All deposits
- **GET** `/api/nicehash/deposits/:currency` - Deposits for specific currency

### Hashpower (Buying)
- **GET** `/api/nicehash/hashpower/myOrders` - List your hashpower orders
- **POST** `/api/nicehash/hashpower/order` - Create a new hashpower order
- **POST** `/api/nicehash/hashpower/order/:orderId` - Update price/limit for an order
- **GET** `/api/nicehash/public/orders` - View public order book (market prices)

### Mining
- **GET** `/api/nicehash/mining/rigs` - All mining rigs
- **GET** `/api/nicehash/mining/rigs/activeWorkers` - Active workers
- **GET** `/api/nicehash/mining/rigs/:rigId` - Details for specific rig
- **GET** `/api/nicehash/mining/rig/stats/algo` - Rig statistics by algorithm
- **GET** `/api/nicehash/mining/rig/stats/unpaid` - Unpaid statistics
- **GET** `/api/nicehash/mining/stats/algo` - Miner statistics by algorithm
- **GET** `/api/nicehash/mining/rigs/payouts` - Payout history
- **GET** `/api/nicehash/mining/rigs/stats/data` - Daily earnings
- **GET** `/api/nicehash/mining/rigs/stats/data/algo` - Daily earnings per algorithm
- **GET** `/api/nicehash/mining/rigs/stats/history` - Earnings history
- **GET** `/api/nicehash/mining/groups` - Mining groups
- **GET** `/api/nicehash/mining/algorithms` - Available mining algorithms
- **GET** `/api/nicehash/mining/markets` - Mining markets

### Public
- **GET** `/api/nicehash/public/currencies` - Public currencies
- **GET** `/api/nicehash/public/fees` - Fee information

### Pools
- **GET** `/api/nicehash/pools` - List all pools
- **GET** `/api/nicehash/pools/:poolId` - Details for specific pool
- **POST** `/api/nicehash/pools` - Create or edit a pool
- **POST** `/api/nicehash/pools/verify` - Verify a pool
- **DELETE** `/api/nicehash/pools/:poolId` - Delete a pool

### Config (Tool Configuration)
- **GET** `/api/nicehash/config` - Get current tool configuration
- **POST** `/api/nicehash/config` - Save tool configuration

---

## Request Examples

### Get Account Info
```bash
curl http://localhost:8080//main/api/v2/account
```

### Get All Rigs
```bash
curl http://localhost:8080/api/nicehash/mining/rigs
```

### Get BTC Balance
```bash
curl http://localhost:8080/api/nicehash/balance/BTC
```

### Create/Edit Pool
```bash
curl -X POST http://localhost:8080/api/nicehash/pools \
  -H "Content-Type: application/json" \
  -d '{"poolId":"your-pool-id","algorithm":"sha256","name":"My Pool"}'
```

### Verify Pool
```bash
curl -X POST http://localhost:8080/api/nicehash/pools/verify \
  -H "Content-Type: application/json" \
  -d '{"poolId":"your-pool-id"}'
```

### Save Tool Configuration
```bash
curl -X POST http://localhost:8080/api/nicehash/config \
  -H "Content-Type: application/json" \
  -d '{
    "min_delay": 300000,
    "max_delay": 600000,
    "selector_dropdown": ".my-dropdown",
    "selector_pool_items": ".pool-item",
    "selector_verify_button": ".verify-btn",
    "selector_close_button": ".close-btn"
  }'
```

---

## Authentication

All Nicehash API requests are automatically authenticated using HMAC-SHA256 with your API credentials:
- API ID: `69189c7f-33af-4996-8ef6-6730cd6bd9c9`
- API Secret: `820968ce-481c-441e-bdf0-8c752283a6b2b9f80090-5039-4906-aee9-0eb600473671`

No additional authentication header is needed when calling these endpoints from your frontend.

---

## Using from Frontend

```javascript
// Get account info
const response = await fetch('http://localhost:8080//main/api/v2/account');
const account = await response.json();

// Get mining rigs
const rigsResponse = await fetch('http://localhost:8080/api/nicehash/mining/rigs');
const rigs = await rigsResponse.json();

// Save config
const configResponse = await fetch('http://localhost:8080/api/nicehash/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    min_delay: 300000,
    max_delay: 600000,
    selector_dropdown: '.dropdown',
    selector_pool_items: '.pool',
    selector_verify_button: '.verify',
    selector_close_button: '.close'
  })
});
const result = await configResponse.json();
```

---

## References

- [Nicehash REST API Documentation](https://www.nicehash.com/docs/rest)
- [Official API Guide](https://www.nicehash.com/docs)
