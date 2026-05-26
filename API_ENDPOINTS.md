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
- **GET** `/main/api/v2/account` - Account information
- **GET** `/main/api/v2/account/balances` - Multi-currency balances
- **GET** `/main/api/v2/account/balance/:currency` - Balance for specific currency (e.g., `BTC`, `USD`)
- **GET** `/main/api/v2/account/activities` - All currency activities
- **GET** `/main/api/v2/account/activities/:currency` - Activities for specific currency
- **GET** `/main/api/v2/account/currencies` - Available currencies
- **GET** `/main/api/v2/account/deposits` - All deposits
- **GET** `/main/api/v2/account/deposits/:currency` - Deposits for specific currency

### Hashpower (Buying)
- **GET** `/main/api/v2/hashpower/myOrders` - List your hashpower orders
- **POST** `/main/api/v2/hashpower/order` - Create a new hashpower order
- **POST** `/main/api/v2/hashpower/order/:orderId` - Update price/limit for an order
- **GET** `/main/api/v2/public/orders` - View public order book (market prices)

### Mining
- **GET** `/main/api/v2/mining/rigs` - All mining rigs
- **GET** `/main/api/v2/mining/rigs/activeWorkers` - Active workers
- **GET** `/main/api/v2/mining/rigs/:rigId` - Details for specific rig
- **GET** `/main/api/v2/mining/rig/stats/algo` - Rig statistics by algorithm
- **GET** `/main/api/v2/mining/rig/stats/unpaid` - Unpaid statistics
- **GET** `/main/api/v2/mining/stats/algo` - Miner statistics by algorithm
- **GET** `/main/api/v2/mining/rigs/payouts` - Payout history
- **GET** `/main/api/v2/mining/rigs/stats/data` - Daily earnings
- **GET** `/main/api/v2/mining/rigs/stats/data/algo` - Daily earnings per algorithm
- **GET** `/main/api/v2/mining/rigs/stats/history` - Earnings history
- **GET** `/main/api/v2/mining/groups` - Mining groups
- **GET** `/main/api/v2/mining/algorithms` - Available mining algorithms
- **GET** `/main/api/v2/mining/markets` - Mining markets

### Public
- **GET** `/main/api/v2/public/currencies` - Public currencies
- **GET** `/main/api/v2/public/fees` - Fee information

### Pools
- **GET** `///main/api/v2/pool/` - List all pools
- **GET** `///main/api/v2/pool//:poolId` - Details for specific pool
- **POST** `///main/api/v2/pool/` - Create or edit a pool
- **POST** `///main/api/v2/pool//verify` - Verify a pool
- **DELETE** `///main/api/v2/pool//:poolId` - Delete a pool

### Config (Tool Configuration)
- **GET** `/api/nicehash/config` - Get current tool configuration
- **POST** `/api/nicehash/config` - Save tool configuration

---

## Request Examples

### Get Account Info
```bash
curl http://localhost:8080/main/api/v2/account
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
