import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 8080;

// Nicehash API credentials
const NICEHASH_API_ID = process.env.NICEHASH_API_ID;
const NICEHASH_API_SECRET = process.env.NICEHASH_API_SECRET;
const NICEHASH_ORG_ID = process.env.NICEHASH_ORG_ID || process.env.NICEHASH_ORGANIZATION_ID;
const NICEHASH_API_BASE = 'https://api2.nicehash.com';

// Validate environment variables
if (!NICEHASH_API_ID || !NICEHASH_API_SECRET || !NICEHASH_ORG_ID) {
  console.error('\n❌ Error: Missing Nicehash API credentials.');
  console.error('   Please ensure NICEHASH_API_ID, NICEHASH_API_SECRET, and NICEHASH_ORG_ID (or NICEHASH_ORGANIZATION_ID) are set in your .env file.\n');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Helper to format query string for signature
function getQueryString(params) {
  if (!params) return '';
  return Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
}

// In-memory config storage
let storedConfig = {
  min_delay: 300000,
  max_delay: 600000,
  selector_dropdown: 'listbox',
  selector_pool_items: 'Pool verificator',
  selector_verify_button: 'button.verify',
  selector_close_button: 'button.close'
};

// Nicehash API request helper
async function nicehashRequest(method, path, queryParams = null, body = null) {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const query = getQueryString(queryParams);
  const bodyStr = body ? JSON.stringify(body) : '';

  // Construct signature using null-byte joined segments (Repository Logic)
  const messageParts = [
    NICEHASH_API_ID,
    timestamp,
    nonce,
    '',
    NICEHASH_ORG_ID,
    '',
    method,
    path,
    query || '' // Signature segment must NOT include the '?' character
  ];

  const message = messageParts.join('\x00') + (bodyStr ? '\x00' + bodyStr : '');
  
  const signature = crypto
    .createHmac('sha256', NICEHASH_API_SECRET)
    .update(message)
    .digest('hex');
  
  const headers = {
    'X-Time': timestamp,
    'X-Nonce': nonce,
    'X-Auth': `${NICEHASH_API_ID}:${signature}`,
    'X-Organization-Id': NICEHASH_ORG_ID,
    'Content-Type': 'application/json'
  };
  
  const url = `${NICEHASH_API_BASE}${path}${query ? '?' + query : ''}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body && { body: bodyStr })
    });
    
    if (!response.ok) {
      console.error(`Nicehash API error: ${response.status}`, await response.text());
      throw new Error(`API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('Nicehash API request failed:', err);
    throw err;
  }
}

// GET config
app.get('/api/nicehash/config', (req, res) => {
  res.json(storedConfig);
});

// POST config
app.post('/api/nicehash/config', (req, res) => {
  const { min_delay, max_delay, selector_dropdown, selector_pool_items, selector_verify_button, selector_close_button } = req.body;
  
  if (min_delay !== undefined) storedConfig.min_delay = min_delay;
  if (max_delay !== undefined) storedConfig.max_delay = max_delay;
  if (selector_dropdown !== undefined) storedConfig.selector_dropdown = selector_dropdown;
  if (selector_pool_items !== undefined) storedConfig.selector_pool_items = selector_pool_items;
  if (selector_verify_button !== undefined) storedConfig.selector_verify_button = selector_verify_button;
  if (selector_close_button !== undefined) storedConfig.selector_close_button = selector_close_button;
  
  res.json({ success: true, config: storedConfig });
});

// GET Nicehash account info
app.get('//main/api/v2/account', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/users/me');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Multi-currency balances
app.get('/api/nicehash/balances', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/accounting/accounts2');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Balance for specific currency
app.get('/api/nicehash/balance/:currency', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/main/api/v2/accounting/account2/${req.params.currency}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Activities
app.get('/api/nicehash/activities', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/accounting/activities', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/nicehash/activities/:currency', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/main/api/v2/accounting/activity/${req.params.currency}`, req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Currencies
app.get('/api/nicehash/currencies', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/accounting/currencies');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Nicehash mining address
app.get(['/api/nicehash/mining/address', '/api/nicehash/mining/miningAddress'], async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/address');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET buy information and price limits
app.get('/api/nicehash/public/buy-info', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/buy/info/');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET current global mining stats
app.get('/api/nicehash/public/stats/global/current', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/stats/global/current');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE miner connection config
app.post('/api/nicehash/mining/miners', async (req, res) => {
  try {
    const { workerName, algorithm, region, customStratumHost, customStratumPort } = req.body;
    const miningAddressData = await nicehashRequest('GET', '/main/api/v2/mining/address');
    const miningAddress = miningAddressData.miningAddress || miningAddressData.btcAddress || miningAddressData.address;

    if (!miningAddress) {
      return res.status(502).json({ error: 'NiceHash did not return a mining address' });
    }

    const cleanWorkerName = String(workerName || 'worker1').trim() || 'worker1';
    const cleanAlgorithm = String(algorithm || 'AUTOLYKOS').trim().toUpperCase();
    const cleanRegion = String(region || 'USA').trim().toLowerCase();
    const stratumHost = String(customStratumHost || `${cleanAlgorithm.toLowerCase()}.${cleanRegion}.nicehash.com`).trim();
    const stratumPort = Number.parseInt(customStratumPort || '9200', 10);

    res.json({
      miningAddress,
      workerName: cleanWorkerName,
      username: `${miningAddress}.${cleanWorkerName}`,
      password: 'x',
      algorithm: cleanAlgorithm,
      region: cleanRegion,
      stratumHost,
      stratumPort,
      stratumUrl: `stratum+tcp://${stratumHost}:${stratumPort}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Mining Markets (needed for CreateMinerSection)
app.get('/api/nicehash/mining/markets', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/markets');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Mining Algorithms (needed for CreateMinerSection)
app.get('/api/nicehash/mining/algorithms', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/algorithms');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Active workers (Must come BEFORE /rigs/:rigId to avoid parameter collision)
app.get('/api/nicehash/mining/rigs/activeWorkers', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/activeWorkers');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mining Rigs detail
app.get('/api/nicehash/mining/rigs/:rigId', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/main/api/v2/mining/rig2/${req.params.rigId}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rig stats by algo
app.get('/api/nicehash/mining/rig/stats/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/algo');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unpaid stats
app.get('/api/nicehash/mining/rig/stats/unpaid', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/unpaid');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Miner stats by algo
app.get('/api/nicehash/mining/stats/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/stats/algo');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payouts
app.get('/api/nicehash/mining/rigs/payouts', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/payouts', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily earnings
app.get('/api/nicehash/mining/rigs/stats/data', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/data', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily earnings per algo
app.get('/api/nicehash/mining/rigs/stats/data/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/data', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Earnings history
app.get('/api/nicehash/mining/rigs/stats/history', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/history', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mining groups
app.get('/api/nicehash/mining/groups', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/groups/list');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Nicehash mining rigs
app.get('/api/nicehash/mining/rigs', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs2');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Public currencies
app.get('/api/nicehash/public/currencies', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/currencies');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Fee info
app.get('/api/nicehash/public/fees', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/service/fee/info');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Pools
app.get('/api/nicehash/pools', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/pools');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Pool details
app.get('/api/nicehash/pools/:poolId', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/main/api/v2/pool/${req.params.poolId}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create pool
app.post('/api/nicehash/pools', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/main/api/v2/pool', null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Verify pool
app.post('/api/nicehash/pools/verify', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/main/api/v2/pools/verify', null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE pool
app.delete('/api/nicehash/pools/:poolId', async (req, res) => {
  try {
    const data = await nicehashRequest('DELETE', `/main/api/v2/pool/${req.params.poolId}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Hashpower Order Endpoints (Buying logic from NiceHashBot) ---

// GET My Orders
app.get('/api/nicehash/hashpower/myOrders', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/hashpower/myOrders', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create Order
app.post('/api/nicehash/hashpower/order', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/main/api/v2/hashpower/order', null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Update Order Price/Limit
app.post('/api/nicehash/hashpower/order/:orderId', async (req, res) => {
  try {
    const path = `/main/api/v2/hashpower/order/${req.params.orderId}/updatePriceAndLimit`;
    const data = await nicehashRequest('POST', path, null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Public Orders (Market conditions)
app.get('/api/nicehash/public/orders', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/orders', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Existing Endpoints ---

app.listen(PORT, () => {
  console.log(`\n✅ API server running on http://localhost:${PORT}\n`);
});
