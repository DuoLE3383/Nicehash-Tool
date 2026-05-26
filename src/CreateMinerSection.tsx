import React, { useEffect, useMemo, useState } from 'react';
import { nicehashAPI } from './api';

interface MiningAlgorithm {
  algorithm: string;
  title?: string;
  order?: number;
  enabled?: boolean;
  port?: number;
  displayMiningFactor?: string;
  displayMarketFactor?: string;
  displayPriceFactor?: string;
  minimalOrderAmount?: string;
  minSpeedLimit?: string;
  maxSpeedLimit?: string;
}

interface PriceEntry {
  algorithm?: string;
  algo?: string;
  name?: string;
  a?: number;
  s?: number;
  p?: number;
  price?: string;
  paying?: string;
  profitability?: string;
  speed?: string;
  marketFactor?: string;
  displayMarketFactor?: string;
}

interface MinerConfig {
  miningAddress: string;
  workerName: string;
  username: string;
  password: string;
  algorithm: string;
  region: string;
  stratumHost: string;
  stratumPort: number;
  stratumUrl: string;
}

function normalizeAlgorithm(value: string) {
  return value.trim().toUpperCase();
}

function findPriceEntry(data: any, algorithm: string, algorithmId?: number, algorithmTitle?: string): PriceEntry | null {
  const target = normalizeAlgorithm(algorithm);
  const titleTarget = normalizeAlgorithm(algorithmTitle || '');
  const candidates = [
    data?.algos,
    data?.algorithms,
    data?.miningAlgorithms,
    data?.stats,
    data?.current,
    data?.data,
    Array.isArray(data) ? data : null,
  ].find(Array.isArray);

  return candidates?.find((entry: PriceEntry) => {
    if (algorithmId !== undefined && (entry.a === algorithmId || entry.algo === String(algorithmId))) {
      return true;
    }
    const entryAlgorithm = entry.algorithm || entry.algo || entry.name || '';
    const normalizedEntry = normalizeAlgorithm(entryAlgorithm);
    return normalizedEntry === target || normalizedEntry === titleTarget;
  }) || null;
}

export function CreateMinerSection() {
  const [form, setForm] = useState({
    workerName: 'worker1',
    algorithm: 'AUTOLYKOS',
    region: 'USA',
    customStratumHost: '',
    customStratumPort: '',
  });
  const [miningAddress, setMiningAddress] = useState('');
  const [algorithms, setAlgorithms] = useState<MiningAlgorithm[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [priceData, setPriceData] = useState<any>(null);
  const [buyInfo, setBuyInfo] = useState<any>(null);
  const [minerConfig, setMinerConfig] = useState<MinerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAlgorithm = useMemo(
    () => algorithms.find((algo) => normalizeAlgorithm(algo.algorithm) === normalizeAlgorithm(form.algorithm)),
    [algorithms, form.algorithm]
  );

  const selectedPrice = useMemo(
    () => findPriceEntry(priceData, form.algorithm, selectedAlgorithm?.order, selectedAlgorithm?.title)
      || findPriceEntry(buyInfo, form.algorithm, selectedAlgorithm?.order, selectedAlgorithm?.title),
    [buyInfo, form.algorithm, priceData, selectedAlgorithm]
  );

  useEffect(() => {
    loadMinerSetup();
  }, []);

  const loadMinerSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const [addressData, algorithmsData, marketsData, buyInfoData, statsData] = await Promise.all([
        nicehashAPI.getMiningAddress(),
        nicehashAPI.getMiningAlgorithms(),
        nicehashAPI.getMiningMarkets(),
        nicehashAPI.getBuyInfo(),
        nicehashAPI.getCurrentGlobalStats(),
      ]);

      const loadedAlgorithms = (algorithmsData.miningAlgorithms || [])
        .filter((algo: MiningAlgorithm) => algo.enabled !== false)
        .sort((a: MiningAlgorithm, b: MiningAlgorithm) => (a.title || a.algorithm).localeCompare(b.title || b.algorithm));

      setMiningAddress(addressData.miningAddress || addressData.btcAddress || addressData.address || '');
      setAlgorithms(loadedAlgorithms);
      setMarkets(Array.isArray(marketsData)
        ? marketsData.filter((market) => !['BTC', 'USDT', 'ALT'].includes(market))
        : []);
      setBuyInfo(buyInfoData);
      setPriceData(statsData);

      if (loadedAlgorithms.length > 0 && !loadedAlgorithms.some((algo: MiningAlgorithm) => algo.algorithm === form.algorithm)) {
        setForm((current) => ({
          ...current,
          algorithm: loadedAlgorithms[0].algorithm,
          customStratumPort: String(loadedAlgorithms[0].port || ''),
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load miner setup');
    } finally {
      setLoading(false);
    }
  };

  const handleAlgorithmChange = (algorithm: string) => {
    const nextAlgorithm = algorithms.find((algo) => algo.algorithm === algorithm);
    setForm({
      ...form,
      algorithm,
      customStratumPort: nextAlgorithm?.port ? String(nextAlgorithm.port) : form.customStratumPort,
    });
    setMinerConfig(null);
  };

  const handleCreateMiner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await nicehashAPI.createMiner({
        ...form,
        customStratumPort: form.customStratumPort || selectedAlgorithm?.port || 9200,
      });
      setMinerConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create miner config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="section-loader">Loading miner setup...</div>;

  return (
    <section className="section">
      <div className="section-header">
        <h2>⛏️ Create Miner</h2>
        <button onClick={loadMinerSetup} className="btn-secondary">Refresh From NiceHash</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="info-grid">
        <div className="info-item">
          <label>Current Mining Address</label>
          <span className="value monospace">{miningAddress || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Current Price</label>
          <span className="value">
            {selectedPrice?.price || selectedPrice?.paying || selectedPrice?.profitability || selectedPrice?.p || 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <label>Current Speed</label>
          <span className="value">{selectedPrice?.speed || selectedPrice?.s || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Speed Unit</label>
          <span className="value">{selectedAlgorithm?.displayMiningFactor || selectedAlgorithm?.displayMarketFactor || 'N/A'}</span>
        </div>
        <div className="info-item">
          <label>Default Port</label>
          <span className="value">{selectedAlgorithm?.port || 'N/A'}</span>
        </div>
      </div>

      <form onSubmit={handleCreateMiner} className="form">
        <fieldset>
          <legend>Miner Connection</legend>
          <div className="form-grid-2">
            <label>
              Worker Name
              <input
                type="text"
                value={form.workerName}
                onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                placeholder="worker1"
                required
              />
            </label>
            <label>
              Algorithm
              <select
                value={form.algorithm}
                onChange={(e) => handleAlgorithmChange(e.target.value)}
                required
              >
                {algorithms.map((algo) => (
                  <option key={algo.algorithm} value={algo.algorithm}>
                    {algo.title || algo.algorithm}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-grid-2">
            <label>
              Region
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              >
                {(markets.length ? markets : ['USA', 'EU']).map((market) => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </label>
            <label>
              Custom Stratum Host
              <input
                type="text"
                value={form.customStratumHost}
                onChange={(e) => setForm({ ...form, customStratumHost: e.target.value })}
                placeholder={`${form.algorithm.toLowerCase()}.${form.region.toLowerCase()}.nicehash.com`}
              />
            </label>
          </div>
          <label>
            Custom Stratum Port
            <input
              type="number"
              value={form.customStratumPort || selectedAlgorithm?.port || ''}
              onChange={(e) => setForm({ ...form, customStratumPort: e.target.value })}
              placeholder={selectedAlgorithm?.port ? String(selectedAlgorithm.port) : '9200'}
            />
          </label>
          <button type="submit" disabled={saving} className="btn-primary btn-large">
            {saving ? 'Creating...' : 'Create Miner'}
          </button>
        </fieldset>
      </form>

      {selectedAlgorithm && (
        <div className="miner-result">
          <h3>NiceHash Algorithm Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Minimum Order</label>
              <span className="value">{selectedAlgorithm.minimalOrderAmount || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Speed Limit</label>
              <span className="value">
                {selectedAlgorithm.minSpeedLimit || 'N/A'} - {selectedAlgorithm.maxSpeedLimit || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <label>Price Unit</label>
              <span className="value">{selectedAlgorithm.displayPriceFactor || selectedAlgorithm.displayMarketFactor || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {minerConfig && (
        <div className="miner-result">
          <h3>Miner Config</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Stratum URL</label>
              <span className="value monospace">{minerConfig.stratumUrl}</span>
            </div>
            <div className="info-item">
              <label>Username</label>
              <span className="value monospace">{minerConfig.username}</span>
            </div>
            <div className="info-item">
              <label>Password</label>
              <span className="value">{minerConfig.password}</span>
            </div>
            <div className="info-item">
              <label>Algorithm</label>
              <span className="value">{minerConfig.algorithm}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
