import React, { useState } from 'react';
import { AccountSection } from './AccountSection';
import { RigsSection } from './RigsSection';
import { CreateMinerSection } from './CreateMinerSection';
import { PoolsSection } from './PoolsSection';
import { ToolConfigSection } from './ToolConfigSection';

type TabName = 'dashboard' | 'all' | 'account' | 'rigs' | 'create-miner' | 'pools' | 'config';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-badge">NH</div>
            <div>
              <h1>NiceHash Dashboard</h1>
              <p>Complete mining management and configuration</p>
            </div>
          </div>
          <div className="api-status">
            <span className="status-dot online"></span>
            Connected to API
          </div>
        </div>
      </header>

      <nav className="nav">
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        {/* <button
          className={`nav-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          🧭 All
        </button> */}
        <button
          className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          👤 Account
        </button>
        <button
          className={`nav-item ${activeTab === 'rigs' ? 'active' : ''}`}
          onClick={() => setActiveTab('rigs')}
        >
          ⛏️ Mining Rigs
        </button>
        <button
          className={`nav-item ${activeTab === 'create-miner' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-miner')}
        >
          ➕ Create Miner
        </button>
        <button
          className={`nav-item ${activeTab === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('pools')}
        >
          🏊 Pools
        </button>
        <button
          className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Configuration
        </button>
      </nav>

      <main className="main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome to NiceHash Management</h2>
              <p>Manage mining operations, configure pools, create miner settings, and monitor rigs in one place.</p>
              <div className="quick-links">
                <button onClick={() => setActiveTab('account')} className="quick-link">
                  <span className="icon">👤</span>
                  View Account
                </button>
                <button onClick={() => setActiveTab('rigs')} className="quick-link">
                  <span className="icon">⛏️</span>
                  Check Rigs
                </button>
                <button onClick={() => setActiveTab('create-miner')} className="quick-link">
                  <span className="icon">➕</span>
                  Create Miner
                </button>
                <button onClick={() => setActiveTab('pools')} className="quick-link">
                  <span className="icon">🏊</span>
                  Manage Pools
                </button>
                <button onClick={() => setActiveTab('config')} className="quick-link">
                  <span className="icon">⚙️</span>
                  Configure Tool
                </button>
              </div>
            </div>

            <section className="info-cards">
              <div className="card-info">
                <h3>Account</h3>
                <p>View account information and balances</p>
              </div>
              <div className="card-info">
                <h3>Mining Rigs</h3>
                <p>Monitor active mining rigs and workers</p>
              </div>
              <div className="card-info">
                <h3>Create Miner</h3>
                <p>Generate NiceHash miner connection settings</p>
              </div>
              <div className="card-info">
                <h3>Pools</h3>
                <p>Create, verify, and manage mining pools</p>
              </div>
              <div className="card-info">
                <h3>Configuration</h3>
                <p>Configure API credentials and automation settings</p>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'all' && (
          <>
            <AccountSection />
            <RigsSection />
            <CreateMinerSection />
            <PoolsSection />
            <ToolConfigSection />
          </>
        )}
        {activeTab === 'account' && <AccountSection />}
        {activeTab === 'rigs' && <RigsSection />}
        {activeTab === 'create-miner' && <CreateMinerSection />}
        {activeTab === 'pools' && <PoolsSection />}
        {activeTab === 'config' && <ToolConfigSection />}
      </main>

      <footer className="footer">
        <p>&copy; 2026 NiceHash Tool. All rights reserved.</p>
        <p>
          <a href="https://www.nicehash.com/docs/rest" target="_blank" rel="noopener noreferrer">
            API Docs
          </a>
          {' | '}
          <a href="https://www.nicehash.com" target="_blank" rel="noopener noreferrer">
            NiceHash
          </a>
        </p>
      </footer>
    </div>
  );
}
