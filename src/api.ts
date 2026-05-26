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
  getConfig: () => request('/api/nicehash/config'),

  saveConfig: (config: any) => 
    request('/api/nicehash/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }),

  getMiningAddress: () => request('/api/nicehash/mining/address'),
  getMiningMarkets: () => request('/api/nicehash/mining/markets'),
  getMiningAlgorithms: () => request('/api/nicehash/mining/algorithms'),

  // Account endpoints
  getAccount: () => request('//main/api/v2/account'),
  getBalances: () => request('//main/api/v2/account/balances'),
  getBalance: (currency: string) => request(`//main/api/v2/account/balance/${currency}`),

  getActivities: (currency: string | null = null) => {
    const path = currency
      ? `//main/api/v2/account/activities/${currency}`
      : '//main/api/v2/account/activities';
    return request(path);
  },

  getCurrencies: () => request('//main/api/v2/account/currencies'),

  getDeposits: (currency: string | null = null) => {
    const path = currency
      ? `//main/api/v2/account/deposits/${currency}`
      : '//main/api/v2/account/deposits';
    return request(path);
  },

  // Mining endpoints
  getRigs: () => request('/api/nicehash/mining/rigs'),
  getActiveWorkers: () => request('/api/nicehash/mining/rigs/activeWorkers'),
  getRigDetails: (rigId: string) => request(`/api/nicehash/mining/rigs/${rigId}`),
  getRigStatsByAlgo: () => request('/api/nicehash/mining/rig/stats/algo'),
  getUnpaidStats: () => request('/api/nicehash/mining/rig/stats/unpaid'),
  getCurrentGlobalStats: () => request('/api/nicehash/public/stats/global/current'),
  getMinerStats: () => request('/api/nicehash/mining/stats/algo'),
  getPayouts: () => request('/api/nicehash/mining/rigs/payouts'),
  getDailyEarnings: () => request('/api/nicehash/mining/rigs/stats/data'),
  getDailyEarningsPerAlgo: () => request('/api/nicehash/mining/rigs/stats/data/algo'),
  getEarningsHistory: () => request('/api/nicehash/mining/rigs/stats/history'),
  getMiningGroups: () => request('/api/nicehash/mining/groups'),

  createMiner: (minerData: any) => 
    request('/api/nicehash/mining/miners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minerData),
    }),

  // Pool endpoints
  getPools: () => request('/api/nicehash/pools'),
  getPoolDetails: (poolId: string) => request(`/api/nicehash/pools/${poolId}`),

  createPool: (poolData: any) => 
    request('/api/nicehash/pools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poolData),
    }),

  verifyPool: (poolData: any) => 
    request('/api/nicehash/pools/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poolData),
    }),

  deletePool: (poolId: string) => 
    request(`/api/nicehash/pools/${poolId}`, { method: 'DELETE' }),

  // Public endpoints
  getPublicCurrencies: () => request('/api/nicehash/public/currencies'),
  getBuyInfo: () => request('/api/nicehash/public/buy-info'),
  getFeeInfo: () => request('/api/nicehash/public/fees'),

  // Hashpower (Buying) endpoints - Based on NiceHashBot logic
  getMyOrders: (algorithm: string, ts: number) => {
    const query = new URLSearchParams({ algorithm, ts: String(ts) }).toString();
    return request(`/api/nicehash/hashpower/myOrders?${query}`);
  },

  createOrder: (orderData: any) => 
    request('/api/nicehash/hashpower/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    }),

  updateOrder: (orderId: string, updateData: any) => 
    request(`/api/nicehash/hashpower/order/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    }),

  cancelOrder: (orderId: string) => 
    request(`/api/nicehash/hashpower/order/${orderId}`, { method: 'DELETE' }),

  getPublicOrders: (algorithm: string, market: string) => {
    const query = new URLSearchParams({ algorithm, market }).toString();
    return request(`/api/nicehash/public/orders?${query}`);
  },
};
