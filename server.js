import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
const PORT = process.env.PORT || 8080;

// Nicehash API credentials
const NICEHASH_API_ID = process.env.NICEHASH_API_ID;
const NICEHASH_API_SECRET = process.env.NICEHASH_API_SECRET;
const NICEHASH_ORG_ID = process.env.NICEHASH_ORG_ID || process.env.NICEHASH_ORGANIZATION_ID;
const NICEHASH_API_BASE = 'https://api2.nicehash.com/main/api/v2/';

const ENV_PATH = path.join(process.cwd(), '.env');

// --- Validation & Middleware ---
// Middleware
app.use(cors());
app.use(express.json());

if (!NICEHASH_API_ID || !NICEHASH_API_SECRET || !NICEHASH_ORG_ID) {
  console.warn('\n⚠️  Warning: Missing Nicehash API credentials in .env.');
  console.warn('   The server is running, but API calls to NiceHash will fail until credentials are provided');
  console.warn('   via the "Configuration" tab in the dashboard.\n');
}

// --- Signature & Request Helpers ---
function getQueryString(params) {
  if (!params) return '';
  return Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
}

let storedConfig = {
  min_delay: 300000,
  max_delay: 600000,
  selector_dropdown: 'listbox',
  selector_pool_items: 'Pool verificator',
  selector_verify_button: 'button.verify',
  selector_close_button: 'button.close'
};

async function nicehashRequest(method, path, queryParams = null, body = null) {
  const apiId = (process.env.NICEHASH_API_ID || '').trim();
  const apiSecret = (process.env.NICEHASH_API_SECRET || '').trim();
  const orgId = (process.env.NICEHASH_ORG_ID || process.env.NICEHASH_ORGANIZATION_ID || '').trim();
  let apiBase = (process.env.NICEHASH_API_BASE || NICEHASH_API_BASE).trim();

  if (!apiId || !apiSecret || !orgId) {
    throw new Error('API credentials not configured. Please check your Tool Configuration settings.');
  }

  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const query = getQueryString(queryParams);
  const bodyStr = body ? JSON.stringify(body) : '';

  // Normalize path: Strip existing prefix if present, then add standard prefix
  const strippedPath = path.replace(/^\/main\/api\/v2/, '').replace(/^\//, '');
  const finalPath = `/main/api/v2/${strippedPath}`;

  // Extract domain and remove any existing path prefix from apiBase
  const domain = apiBase.replace(/(\/main\/api\/v2\/?|\/api\/v2\/?|\/)$/, '');

  // Construct signature using null-byte joined segments (Repository Logic)
  const messageParts = [
    apiId,
    timestamp,
    nonce,
    '',
    orgId,
    '',
    method,
    finalPath,
    query || '' // Query string should NOT include '?' in the signature
  ];

  const message = messageParts.join('\x00') + (bodyStr ? '\x00' + bodyStr : '');
  
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');
  
  const headers = {
    'X-Time': timestamp,
    'X-Nonce': nonce,
    'X-Auth': `${apiId}:${signature}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  };
  
  const url = `${domain}${finalPath}${query ? '?' + query : ''}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...(body && { body: bodyStr })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error detail');
      console.error(`Nicehash API error [${method}] ${finalPath}: ${response.status} - ${errorText}`);
      throw new Error(`NiceHash API Error (${response.status}): ${errorText}`);
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: response.ok, message: text };
    }
  } catch (err) {
    console.error('Nicehash API request failed:', err);
    throw err;
  }
}

// --- App Settings & .env Management ---
function getAppSettings() {
  return {
    nicehash_api_id: process.env.NICEHASH_API_ID || '',
    nicehash_organization_id: process.env.NICEHASH_ORG_ID || process.env.NICEHASH_ORGANIZATION_ID || '',
    nicehash_api_base: NICEHASH_API_BASE,
    has_nicehash_api_secret: Boolean(process.env.NICEHASH_API_SECRET),
    port: PORT
  };
}

async function updateEnvFile(updates) {
  let content = '';
  try {
    content = await fs.readFile(ENV_PATH, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const lines = content.split(/\r?\n/).filter((line, index, arr) => index < arr.length - 1 || line !== '');
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !(match[1] in updates)) return line;
    seen.add(match[1]);
    return `${match[1]}=${updates[match[1]]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) nextLines.push(`${key}=${value}`);
  }

  await fs.writeFile(ENV_PATH, `${nextLines.join('\n')}\n`, 'utf8');
}

// --- Routers ---
const appSettingsRouter = express.Router();
appSettingsRouter.get('/', (req, res) => {
  res.json(getAppSettings());
});
appSettingsRouter.post('/', async (req, res) => {
  try {
    const {
      nicehash_api_id,
      nicehash_api_secret,
      nicehash_organization_id,
      nicehash_api_base
    } = req.body;

    const updates = {};
    if (typeof nicehash_api_id === 'string') {
      updates.NICEHASH_API_ID = nicehash_api_id.trim();
    }
    if (typeof nicehash_api_secret === 'string' && nicehash_api_secret.trim()) {
      updates.NICEHASH_API_SECRET = nicehash_api_secret.trim();
    }
    if (typeof nicehash_organization_id === 'string') {
      updates.NICEHASH_ORG_ID = nicehash_organization_id.trim();
    }
    if (typeof nicehash_api_base === 'string') {
      updates.NICEHASH_API_BASE = nicehash_api_base.trim() || 'https://api2.nicehash.com';
    }

    Object.assign(process.env, updates);
    await updateEnvFile(updates);

    res.json({ success: true, settings: getAppSettings() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/api/app/settings', appSettingsRouter);

const configRouter = express.Router();
configRouter.get('/', (req, res) => {
  res.json(storedConfig);
});
configRouter.post('/', (req, res) => {
  const { min_delay, max_delay, selector_dropdown, selector_pool_items, selector_verify_button, selector_close_button } = req.body;
  
  if (min_delay !== undefined) storedConfig.min_delay = min_delay;
  if (max_delay !== undefined) storedConfig.max_delay = max_delay;
  if (selector_dropdown !== undefined) storedConfig.selector_dropdown = selector_dropdown;
  if (selector_pool_items !== undefined) storedConfig.selector_pool_items = selector_pool_items;
  if (selector_verify_button !== undefined) storedConfig.selector_verify_button = selector_verify_button;
  if (selector_close_button !== undefined) storedConfig.selector_close_button = selector_close_button;
  
  res.json({ success: true, config: storedConfig });
});
app.use('/main/api/v2/config', configRouter);

const accountRouter = express.Router();
accountRouter.get('/', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/users/me');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
accountRouter.get('/balances', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/accounting/accounts2');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
accountRouter.get('/balance/:currency', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/accounting/account2/${req.params.currency}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
accountRouter.get('/activities', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/accounting/activities', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
accountRouter.get('/activities/:currency', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/accounting/activity/${req.params.currency}`, req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
accountRouter.get('/currencies', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/accounting/currencies');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
accountRouter.get('/deposits', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/accounting/deposits', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
accountRouter.get('/deposits/:currency', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/accounting/deposit/${req.params.currency}`, req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/main/api/v2/account', accountRouter);
// Alias support
app.use('/main/api/v2/balances', (req, res) => res.redirect('/main/api/v2/account/balances'));

const miningRouter = express.Router();
miningRouter.get(['/address', '/miningAddress'], async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/address');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.post('/miners', async (req, res) => {
  try {
    const { workerName, algorithm, region, customStratumHost, customStratumPort } = req.body;
    const miningAddressData = await nicehashRequest('GET', '/mining/address');
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
miningRouter.get('/markets', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/markets');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/algorithms', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/algorithms');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rigs/activeWorkers', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rigs/activeWorkers');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rigs/:rigId', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/mining/rig2/${req.params.rigId}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rig/stats/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rig/stats/algo');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rig/stats/unpaid', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rig/stats/unpaid');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/stats/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/stats/algo');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rigs/payouts', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rigs/payouts', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rigs/stats/data', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rig/stats/data', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rigs/stats/data/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rig/stats/algo', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rigs/stats/history', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rig/stats/data', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/groups', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/groups/list');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
miningRouter.get('/rigs', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/mining/rigs2');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/main/api/v2/mining', miningRouter);

const publicRouter = express.Router();
publicRouter.get('/currencies', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/public/currencies');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
publicRouter.get('/fees', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/public/service/fee/info');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
publicRouter.get('/buy-info', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/public/buy/info');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
publicRouter.get('/stats/global/current', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/public/stats/global/current');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
publicRouter.get('/orders', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/public/orders', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/main/api/v2/public', publicRouter);

const poolRouter = express.Router();
poolRouter.get('/', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/pools');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
poolRouter.get('/:poolId', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', `/pool/${req.params.poolId}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
poolRouter.post('/', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/pool', null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
poolRouter.post('/verify', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/pools/verify', null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
poolRouter.delete('/:poolId', async (req, res) => {
  try {
    const data = await nicehashRequest('DELETE', `/pool/${req.params.poolId}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('///main/api/v2/pool/', poolRouter);

const hashpowerRouter = express.Router();
hashpowerRouter.get('/myOrders', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/hashpower/myOrders', req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
hashpowerRouter.post('/order', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/hashpower/order', null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
hashpowerRouter.post('/order/:orderId', async (req, res) => {
  try {
    const path = `/hashpower/order/${req.params.orderId}/updatePriceAndLimit`;
    const data = await nicehashRequest('POST', path, null, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
hashpowerRouter.delete('/order/:orderId', async (req, res) => {
  try {
    const data = await nicehashRequest('DELETE', `/hashpower/order/${req.params.orderId}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
hashpowerRouter.get('/algorithms', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/hashpower/algorithms');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use('/main/api/v2/hashpower', hashpowerRouter);

// --- Startup ---

app.listen(PORT, () => {
  console.log(`\n✅ API server running on http://localhost:${PORT}\n`);
});
