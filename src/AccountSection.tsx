import React, { useEffect, useState } from 'react';
import { nicehashAPI } from './api';

interface Account {
  id?: string;
  email?: string;
  workerId?: string;
  miningAddress?: string;
}

export function AccountSection() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountData, addressData] = await Promise.all([
        nicehashAPI.getAccount(),
        nicehashAPI.getMiningAddress()
      ]);
      setAccount({
        ...accountData,
        miningAddress: addressData.miningAddress || addressData.address,
        workerId: accountData.extid || accountData.id
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="section-loader">Loading account...</div>;

  return (
    <section className="section">
      <h2>Account Information</h2>
      {error ? (
        <div className="error-message">{error}</div>
      ) : account ? (
        <div className="info-grid">
          <div className="info-item">
            <label>Account ID</label>
            <span className="value">{account.id || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Email</label>
            <span className="value">{account.email || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Worker ID</label>
            <span className="value">{account.workerId || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Mining Address</label>
            <span className="value monospace">{account.miningAddress || 'N/A'}</span>
          </div>
        </div>
      ) : null}
      <button onClick={loadAccount} className="btn-secondary">Refresh</button>
    </section>
  );
}
