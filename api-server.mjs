import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
const PORT = process.env.PORT || 8080;

// Nicehash API credentials
const ENV_PATH = path.join(process.cwd(), '.env');

// Validate environment variables
const apiId = process.env.NICEHASH_API_ID;
const apiSecret = process.env.NICEHASH_API_SECRET;
const organizationId = process.env.NICEHASH_ORG_ID || process.env.NICEHASH_ORGANIZATION_ID;

if (!apiId || !apiSecret || !organizationId) {
  console.error('\n❌ Error: Missing Nicehash API credentials.');
  console.error('   Please ensure NICEHASH_API_ID, NICEHASH_API_SECRET, and NICEHASH_ORG_ID (or NICEHASH_ORGANIZATION_ID) are set in your .env file.');
  console.error('   See DASHBOARD.md for configuration instructions.\n');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// In-memory config storage
let storedConfig = {
  min_delay: 300000,
  max_delay: 600000,
  selector_dropdown: 'listbox',
  selector_pool_items: 'Pool verificator',
  selector_verify_button: 'button.verify',
  selector_close_button: 'button.close'
};

// Helper to format query string for signature
function getQueryString(params) {
  if (!params || Object.keys(params).length === 0) return '';
  return Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
}

// Nicehash API request helper
async function nicehashRequest(method, path, body = null, queryParams = null) {
  const apiId = process.env.NICEHASH_API_ID;
  const apiSecret = process.env.NICEHASH_API_SECRET;
  const organizationId = process.env.NICEHASH_ORG_ID || process.env.NICEHASH_ORGANIZATION_ID;
  const apiBase = process.env.NICEHASH_API_BASE || 'https://api2.nicehash.com';

  if (!apiId || !apiSecret) {
    const error = new Error('Missing NICEHASH_API_ID or NICEHASH_API_SECRET in app settings');
    error.statusCode = 400;
    throw error;
  }

  if (!organizationId) {
    const error = new Error('Missing NICEHASH_ORGANIZATION_ID in .env');
    error.statusCode = 400;
    throw error;
  }

  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const query = getQueryString(queryParams);
  const queryForSignature = query ? '?' + query : '';
  
  let request_body = '';
  if (body) {
    request_body = JSON.stringify(body);
  }
  
  const messageParts = [
    apiId,
    timestamp.toString(),
    nonce,
    '',
    organizationId,
    '',
    method,
    path,
    queryForSignature
  ];

  if (body) {
    messageParts.push(request_body);
  }

  const message = messageParts.join('\x00') + (body ? '' : ''); // Ensure explicit joining
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');
  
  const headers = {
    'X-Time': timestamp.toString(),
    'X-Nonce': nonce,
    'X-Auth': `${apiId}:${signature}`,
    'Content-Type': 'application/json',
    'X-Organization-Id': organizationId,
    'X-Request-Id': crypto.randomUUID()
  };
  
  try {
    const url = `${apiBase}${path}${query ? `?${query}` : ''}`;
    const response = await fetch(url, {
      method,
      headers,
      ...(body && { body: request_body })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Nicehash API Error [${response.status}]:`, errorText);
      
      let errorMessage = errorText;
      try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.errors?.[0]?.message || parsed.message || errorText;
      } catch (e) { /* use raw text */ }

      const error = new Error(`Nicehash API [${response.status}]: ${errorMessage}`);
      error.statusCode = response.status;
      throw error;
    }
    
    return await response.json();
  } catch (err) {
    console.error('Nicehash API request failed:', err);
    throw err;
  }
}

function sendError(res, err) {
  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({ error: err.message });
}

function getAppSettings() {
  return {
    nicehash_api_id: process.env.NICEHASH_API_ID || '',
    nicehash_organization_id: process.env.NICEHASH_ORG_ID || process.env.NICEHASH_ORGANIZATION_ID || '',
    nicehash_api_base: process.env.NICEHASH_API_BASE || 'https://api2.nicehash.com',
    has_nicehash_api_secret: Boolean(process.env.NICEHASH_API_SECRET),
    port: PORT
  };
}

async function updateEnvFile(updates) {
  let content = '';
  try {
    content = await fs.readFile(ENV_PATH, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const lines = content.split(/\r?\n/).filter((line, index, arr) => index < arr.length - 1 || line !== '');
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !(match[1] in updates)) {
      return line;
    }
    seen.add(match[1]);
    return `${match[1]}=${updates[match[1]]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  await fs.writeFile(ENV_PATH, `${nextLines.join('\n')}\n`, 'utf8');
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

// GET app settings
app.get('/api/app/settings', (req, res) => {
  res.json(getAppSettings());
});

// POST app settings
app.post('/api/app/settings', async (req, res) => {
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
    sendError(res, err);
  }
});

// GET Nicehash account info
app.get('//main/api/v2/account', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/users/me');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET Nicehash account balances (multi-currency)
app.get('/api/nicehash/balances', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/accounting/accounts2');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET account balance for specific currency
app.get('/api/nicehash/balance/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const data = await nicehashRequest('GET', `/main/api/v2/accounting/account2/${currency}`);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET all currency activities
app.get('/api/nicehash/activities', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/accounting/activities', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET activities for specific currency
app.get('/api/nicehash/activities/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const data = await nicehashRequest('GET', `/main/api/v2/accounting/activity/${currency}`, null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET currencies
app.get('/api/nicehash/currencies', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/accounting/currencies');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET deposits
app.get('/api/nicehash/deposits', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/accounting/deposits', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET deposits for specific currency
app.get('/api/nicehash/deposits/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const data = await nicehashRequest('GET', `/main/api/v2/accounting/deposits/${currency}`);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET mining rigs
app.get('/api/nicehash/mining/rigs', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs2');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET mining address
app.get(['/api/nicehash/mining/address', '/api/nicehash/mining/miningAddress'], async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/address');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// CREATE miner connection config
app.post('/api/nicehash/mining/miners', async (req, res) => {
  try {
    const { workerName, algorithm, region, customStratumHost, customStratumPort } = req.body;
    const miningAddressData = await nicehashRequest('GET', '/main/api/v2/mining/address');
    const miningAddress = miningAddressData.miningAddress || miningAddressData.btcAddress || miningAddressData.address;

    if (!miningAddress) {
      const error = new Error('NiceHash did not return a mining address for this account');
      error.statusCode = 502;
      throw error;
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
    sendError(res, err);
  }
});

// GET active workers
app.get('/api/nicehash/mining/rigs/activeWorkers', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/activeWorkers');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET rig details
app.get('/api/nicehash/mining/rigs/:rigId', async (req, res) => {
  try {
    const { rigId } = req.params;
    const data = await nicehashRequest('GET', `/main/api/v2/mining/rig2/${rigId}`);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET rig statistics by algorithm
app.get('/api/nicehash/mining/rig/stats/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/algo', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET rig statistics (unpaid)
app.get('/api/nicehash/mining/rig/stats/unpaid', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/unpaid');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET miner statistics by algorithm (Global)
app.get('/api/nicehash/mining/stats/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/stats/algo', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET payouts
app.get('/api/nicehash/mining/rigs/payouts', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/payouts', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET daily earnings
app.get('/api/nicehash/mining/rigs/stats/data', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/data', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET daily earnings per algorithm
app.get('/api/nicehash/mining/rigs/stats/data/algo', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/data', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET earnings history
app.get('/api/nicehash/mining/rigs/stats/history', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/rigs/stats/history', null, req.query);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET groups (mining groups)
app.get('/api/nicehash/mining/groups', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/groups/list');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET mining algorithms (public)
app.get('/api/nicehash/mining/algorithms', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/algorithms');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET mining markets (public)
app.get('/api/nicehash/mining/markets', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/mining/markets');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET buy information and price limits
app.get('/api/nicehash/public/buy-info', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/buy/info/');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET current global mining stats
app.get('/api/nicehash/public/stats/global/current', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/stats/global/current');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET public currencies
app.get('/api/nicehash/public/currencies', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/currencies');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET fee information
app.get('/api/nicehash/public/fees', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/public/service/fee/info');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET pools
app.get('/api/nicehash/pools', async (req, res) => {
  try {
    const data = await nicehashRequest('GET', '/main/api/v2/pools');
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// GET pool details
app.get('/api/nicehash/pools/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const data = await nicehashRequest('GET', `/main/api/v2/pool/${poolId}`);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// VERIFY pool
app.post('/api/nicehash/pools/verify', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/main/api/v2/pools/verify', req.body);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// CREATE or EDIT pool
app.post('/api/nicehash/pools', async (req, res) => {
  try {
    const data = await nicehashRequest('POST', '/main/api/v2/pool', req.body);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE pool
app.delete('/api/nicehash/pools/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const data = await nicehashRequest('DELETE', `/main/api/v2/pool/${poolId}`);
    res.json(data);
  } catch (err) {
    sendError(res, err);
  }
});

const server = app.listen(PORT, () => {
  console.log(`\n✅ Nicehash API server running on http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`   To fix this, either:`);
    console.error(`   1. Stop the other process using port ${PORT} (Check for other Node or Flask instances).`);
    console.error(`   2. Run this server on a different port: "set PORT=8082 && npm run api"`);
    process.exit(1);
  } else {
    throw err;
  }
});
