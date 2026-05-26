import React, { useEffect, useState } from 'react';
import { nicehashAPI } from './api';

interface Pool {
  id: string;
  poolId: string;
  algorithm?: string;
  name?: string;
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
}

const NICEHASH_ALGORITHMS = [
  "SCRYPT", "SHA256", "SCRYPTNF", "X11", "X13", "KECCAK", "X15", "NIST5", "NEOSCRYPT",
  "LYRA2RE", "WHIRLPOOLX", "QUBIT", "QUARK", "AXIOM", "LYRA2REV2", "SCRYPTJANENF16",
  "BLAKE256R8", "BLAKE256R14", "BLAKE256R8VNL", "HODL", "DAGGERHASHIMOTO", "DECRED",
  "CRYPTONIGHT", "LBRY", "EQUIHASH", "PASCAL", "X11GOST", "SIA", "BLAKE2S", "SKUNK",
  "CRYPTONIGHTV7", "CRYPTONIGHTHEAVY", "LYRA2Z", "X16R", "CRYPTONIGHTV8", "SHA256ASICBOOST",
  "ZHASH", "BEAM", "GRINCUCKAROO29", "GRINCUCKATOO31", "LYRA2REV3", "CRYPTONIGHTR",
  "CUCKOOCYCLE", "GRINCUCKAROOD29", "BEAMV2", "X16RV2", "RANDOMXMONERO", "EAGLESONG",
  "CUCKAROOM", "GRINCUCKATOO32", "HANDSHAKE", "KAWPOW", "CUCKAROO29BFC", "BEAMV3",
  "CUCKAROOZ29", "OCTOPUS", "AUTOLYKOS", "ZELHASH", "KADENA", "ETCHASH", "VERUSHASH",
  "KHEAVYHASH", "NEXAPOW", "IRONFISH", "KARLSENHASH", "ALEPHIUM", "FISHHASH", "PYRINHASH",
  "XELISHASHV2", "ZKSNARK", "FOMA_SHA256ASICBOOST", "SHA256ASICBOOST_USDT", "FOMA_SHA256ASICBOOST_USDT"
];

export function PoolsSection() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Pool>>({
    algorithm: '',
    name: '',
    hostname: '',
    port: 3333,
    username: '',
    password: '',
  });

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await nicehashAPI.getPools();
      setPools(Array.isArray(data) ? data : data.list || data.pools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pools');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await nicehashAPI.createPool(formData);
      setFormData({ algorithm: '', name: '', hostname: '', port: 3333, username: '', password: '' });
      setShowForm(false);
      loadPools();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pool');
    }
  };

  const handleVerifyPool = async (pool: Pool) => {
    setError(null);
    try {
      const result = await nicehashAPI.verifyPool({ poolId: pool.poolId });
      alert(`Pool verification: ${result.status || 'completed'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify pool');
    }
  };

  const handleDeletePool = async (poolId: string) => {
    if (!window.confirm('Are you sure you want to delete this pool?')) return;
    setError(null);
    try {
      await nicehashAPI.deletePool(poolId);
      loadPools();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pool');
    }
  };

  if (loading) return <div className="section-loader">Loading pools...</div>;

  return (
    <section className="section">
      <div className="section-header">
        <h2>Mining Pools</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Pool'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreatePool} className="form">
          <div className="form-grid-2">
            <label>
              Algorithm
              <select
                value={formData.algorithm || ''}
                onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
                required
              >
                <option value="" disabled>Select algorithm</option>
                {NICEHASH_ALGORITHMS.map(algo => (
                  <option key={algo} value={algo}>{algo}</option>
                ))}
              </select>
            </label>
            <label>
              Pool Name
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Pool"
                required
              />
            </label>
          </div>
          <div className="form-grid-2">
            <label>
              Hostname
              <input
                type="text"
                value={formData.hostname || ''}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                placeholder="pool.example.com"
                required
              />
            </label>
            <label>
              Port
              <input
                type="number"
                value={formData.port || 3333}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                required
              />
            </label>
          </div>
          <div className="form-grid-2">
            <label>
              Username
              <input
                type="text"
                value={formData.username || ''}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="wallet_address"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Pool password"
              />
            </label>
          </div>
          <button type="submit" className="btn-primary">Create Pool</button>
        </form>
      )}

      <div className="pools-list">
        {pools.length === 0 ? (
          <p className="empty-state">No pools configured yet</p>
        ) : (
          pools.map((pool) => (
            <div key={pool.poolId} className="pool-card">
              <h3>{pool.name || pool.algorithm}</h3>
              <div className="pool-info">
                <p><strong>Algorithm:</strong> {pool.algorithm}</p>
                <p><strong>Host:</strong> {pool.hostname}:{pool.port}</p>
                <p><strong>User:</strong> {pool.username}</p>
              </div>
              <div className="pool-actions">
                <button onClick={() => handleVerifyPool(pool)} className="btn-secondary">Verify</button>
                <button onClick={() => handleDeletePool(pool.poolId)} className="btn-danger">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
