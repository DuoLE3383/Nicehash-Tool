import React, { useEffect, useState } from 'react';
import { nicehashAPI } from './api';

interface Rig {
  id?: string;
  rigId?: string;
  name?: string;
  status?: string;
  temperature?: number;
  speed?: number;
  speedUnit?: string;
  cpuTemp?: number;
  gpuCount?: number;
  devices?: unknown[];
  stats?: {
    speedAccepted?: number;
    profitability?: number;
  };
}

interface RigsResponse {
  btcAddress?: string;
  miningRigs?: Rig[];
  rigs?: Rig[];
  totalDevices?: number;
  totalRigs?: number;
  unpaidAmount?: string;
}

export function RigsSection() {
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [summary, setSummary] = useState<RigsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkers, setActiveWorkers] = useState<any>(null);

  useEffect(() => {
    loadRigs();
  }, []);

  const loadRigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rigsData, workersData, addressData] = await Promise.all([
        nicehashAPI.getRigs(),
        nicehashAPI.getActiveWorkers(),
        nicehashAPI.getMiningAddress()
      ]);
      const rigList = Array.isArray(rigsData)
        ? rigsData
        : rigsData.miningRigs || rigsData.rigs || [];

      setRigs(rigList);
      // Merge mining address into summary for display
      setSummary(Array.isArray(rigsData) ? { 
        miningAddress: addressData.miningAddress || addressData.address 
      } : { 
        ...rigsData, 
        miningAddress: addressData.miningAddress || addressData.address 
      });
      setActiveWorkers(workersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rigs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="section-loader">Loading rigs...</div>;

  return (
    <section className="section">
      <div className="section-header">
        <h2>Mining Rigs</h2>
        <button onClick={loadRigs} className="btn-secondary">Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {summary && (
        <div className="info-grid">
          <div className="info-item">
            <label>Mining Address</label>
            <span className="value monospace">{summary.miningAddress || summary.btcAddress || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Total Rigs</label>
            <span className="value">{summary.totalRigs ?? rigs.length}</span>
          </div>
          <div className="info-item">
            <label>Total Devices</label>
            <span className="value">{summary.totalDevices ?? 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Active Workers</label>
            <span className="value">{activeWorkers?.workers?.length ?? 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Unpaid BTC</label>
            <span className="value">{summary.unpaidAmount || '0.00000000'}</span>
          </div>
        </div>
      )}

      <div className="rigs-grid">
        {rigs.length === 0 ? (
          <p className="empty-state">
            NiceHash returned no mining rigs for this organization.
          </p>
        ) : (
          rigs.map((rig, index) => (
            <div key={rig.rigId || rig.id || index} className="rig-card">
              <div className="rig-header">
                <h3>{rig.name || rig.rigId || rig.id || 'Unnamed rig'}</h3>
                <span className={`status-badge ${rig.status || 'unknown'}`}>
                  {rig.status || 'Unknown'}
                </span>
              </div>
              <div className="rig-stats">
                <div className="stat">
                  <label>Speed</label>
                  <span className="value">
                    {rig.speed?.toFixed(2) || rig.stats?.speedAccepted?.toFixed(2) || 'N/A'} {rig.speedUnit || ''}
                  </span>
                </div>
                <div className="stat">
                  <label>GPU Temp</label>
                  <span className="value">{rig.temperature ? `${rig.temperature}°C` : 'N/A'}</span>
                </div>
                <div className="stat">
                  <label>CPU Temp</label>
                  <span className="value">{rig.cpuTemp ? `${rig.cpuTemp}°C` : 'N/A'}</span>
                </div>
                <div className="stat">
                  <label>GPUs</label>
                  <span className="value">{rig.gpuCount || rig.devices?.length || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
