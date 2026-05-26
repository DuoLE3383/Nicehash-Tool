// API client functions for Nicehash
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `API Request failed: ${res.status}`);
  }
  return res.json();
}

export const nicehashAPI = {
  // Config endpoints
  getConfig: () => request('/main/api/v2/config'),

  saveConfig: (config: any) => 
    request('/main/api/v2/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }),

  getMiningAddress: () => request('/main/api/v2/mining/address'),
  getMiningMarkets: () => request('/main/api/v2/mining/markets'),
  getMiningAlgorithms: () => request('/main/api/v2/mining/algorithms'),

  // Account endpoints
  getAccount: () => request('/main/api/v2/account'),
  getBalances: () => request('/main/api/v2/account/balances'),
  getBalance: (currency: string) => request(`/main/api/v2/account/balance/${currency}`),

  getActivities: (currency: string | null = null) => {
    const path = currency
      ? `/main/api/v2/account/activities/${currency}`
      : '/main/api/v2/account/activities';
    return request(path);
  },

  getCurrencies: () => request('/main/api/v2/account/currencies'),

  getDeposits: (currency: string | null = null) => {
    const path = currency
      ? `/main/api/v2/account/deposits/${currency}`
      : '/main/api/v2/account/deposits';
    return request(path);
  },

  // Mining endpoints
  getRigs: () => request('/main/api/v2/mining/rigs'),
  getActiveWorkers: () => request('/main/api/v2/mining/rigs/activeWorkers'),
  getRigDetails: (rigId: string) => request(`/main/api/v2/mining/rigs/${rigId}`),
  getRigStatsByAlgo: () => request('/main/api/v2/mining/rig/stats/algo'),
  getUnpaidStats: () => request('/main/api/v2/mining/rig/stats/unpaid'),
  getCurrentGlobalStats: () => request('/main/api/v2/public/stats/global/current'),
  getMinerStats: () => request('/main/api/v2/mining/stats/algo'),
  getPayouts: () => request('/main/api/v2/mining/rigs/payouts'),
  getDailyEarnings: () => request('/main/api/v2/mining/rigs/stats/data'),
  getDailyEarningsPerAlgo: () => request('/main/api/v2/mining/rigs/stats/data/algo'),
  getEarningsHistory: () => request('/main/api/v2/mining/rigs/stats/history'),
  getMiningGroups: () => request('/main/api/v2/mining/groups'),

  createMiner: (minerData: any) => 
    request('/main/api/v2/mining/miners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minerData),
    }),

  // Pool endpoints
  getPools: () => request('/main/api/v2/pool'),
  getPoolDetails: (poolId: string) => request(`/main/api/v2/pool/${poolId}`),

  createPool: (poolData: any) => 
    request('/main/api/v2/pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poolData),
    }),

  verifyPool: (poolData: any) => 
    request('/main/api/v2/pool/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poolData),
    }),

  deletePool: (poolId: string) => 
    request(`/main/api/v2/pool/${poolId}`, { method: 'DELETE' }),

  // Public endpoints
  getPublicCurrencies: () => request('/main/api/v2/public/currencies'),
  getBuyInfo: () => request('/main/api/v2/public/buy-info'),
  getFeeInfo: () => request('/main/api/v2/public/fees'),

  // Hashpower (Buying) endpoints - Based on NiceHashBot logic
  getMyOrders: (algorithm: string, ts: number) => {
    const query = new URLSearchParams({ algorithm, ts: String(ts) }).toString();
    return request(`/main/api/v2/hashpower/myOrders?${query}`);
  },

  createOrder: (orderData: any) => 
    request('/main/api/v2/hashpower/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    }),

  updateOrder: (orderId: string, updateData: any) => 
    request(`/main/api/v2/hashpower/order/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    }),

  cancelOrder: (orderId: string) => 
    request(`/main/api/v2/hashpower/order/${orderId}`, { method: 'DELETE' }),

  getPublicOrders: (algorithm: string, market: string) => {
    const query = new URLSearchParams({ algorithm, market }).toString();
    return request(`/main/api/v2/public/orders?${query}`);
  },
};
