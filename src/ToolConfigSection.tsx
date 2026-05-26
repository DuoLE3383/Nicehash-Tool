import React, { useEffect, useState } from 'react';
import { nicehashAPI } from './api';

interface NicehashConfig {
  min_delay: number;
  max_delay: number;
  selector_dropdown: string;
  selector_pool_items: string;
  selector_verify_button: string;
  selector_close_button: string;
}

interface AppSettings {
  nicehash_api_id: string;
  nicehash_api_secret: string;
  nicehash_organization_id: string;
  nicehash_api_base: string;
  has_nicehash_api_secret: boolean;
}

export function ToolConfigSection() {
  const [config, setConfig] = useState<NicehashConfig>({
    min_delay: 300000,
    max_delay: 600000,
    selector_dropdown: 'listbox',
    selector_pool_items: 'Pool verificator',
    selector_verify_button: 'button.verify',
    selector_close_button: 'button.close',
  });
  const [settings, setSettings] = useState<AppSettings>({
    nicehash_api_id: '',
    nicehash_api_secret: '',
    nicehash_organization_id: '',
    nicehash_api_base: 'https://api2.nicehash.com',
    has_nicehash_api_secret: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [data, appSettings] = await Promise.all([
        nicehashAPI.getConfig(),
        nicehashAPI.getAppSettings(),
      ]);
      setConfig(data);
      setSettings({
        nicehash_api_id: appSettings.nicehash_api_id || '',
        nicehash_api_secret: '',
        nicehash_organization_id: appSettings.nicehash_organization_id || '',
        nicehash_api_base: appSettings.nicehash_api_base || 'https://api2.nicehash.com',
        has_nicehash_api_secret: Boolean(appSettings.has_nicehash_api_secret),
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load config',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await nicehashAPI.saveConfig(config);
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save config',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setMessage(null);
    try {
      const payload = {
        nicehash_api_id: settings.nicehash_api_id,
        nicehash_organization_id: settings.nicehash_organization_id,
        nicehash_api_base: settings.nicehash_api_base,
        ...(settings.nicehash_api_secret.trim()
          ? { nicehash_api_secret: settings.nicehash_api_secret }
          : {}),
      };
      const result = await nicehashAPI.saveAppSettings(payload);
      setSettings({
        nicehash_api_id: result.settings.nicehash_api_id || '',
        nicehash_api_secret: '',
        nicehash_organization_id: result.settings.nicehash_organization_id || '',
        nicehash_api_base: result.settings.nicehash_api_base || 'https://api2.nicehash.com',
        has_nicehash_api_secret: Boolean(result.settings.has_nicehash_api_secret),
      });
      setMessage({ type: 'success', text: 'API settings saved successfully.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save API settings',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <div className="section-loader">Loading configuration...</div>;

  return (
    <section className="section">
      <h2>Tool Configuration</h2>
      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}
      <form onSubmit={handleSaveSettings} className="form config-form">
        <fieldset>
          <legend>NiceHash API</legend>
          <label>
            API Key
            <input
              type="text"
              value={settings.nicehash_api_id}
              onChange={(e) => setSettings({ ...settings, nicehash_api_id: e.target.value })}
              placeholder="NiceHash API key"
              autoComplete="off"
            />
          </label>
          <label>
            API Secret
            <input
              type="password"
              value={settings.nicehash_api_secret}
              onChange={(e) => setSettings({ ...settings, nicehash_api_secret: e.target.value })}
              placeholder={settings.has_nicehash_api_secret ? 'Saved - enter a new value to replace' : 'NiceHash API secret'}
              autoComplete="new-password"
            />
          </label>
          <label>
            Organization ID
            <input
              type="text"
              value={settings.nicehash_organization_id}
              onChange={(e) => setSettings({ ...settings, nicehash_organization_id: e.target.value })}
              placeholder="NiceHash organization ID"
              autoComplete="off"
            />
          </label>
          <label>
            API Base URL
            <input
              type="url"
              value={settings.nicehash_api_base}
              onChange={(e) => setSettings({ ...settings, nicehash_api_base: e.target.value })}
              placeholder="https://api2.nicehash.com"
            />
          </label>
          <button type="submit" disabled={savingSettings} className="btn-primary btn-large">
            {savingSettings ? 'Saving...' : 'Save API Settings'}
          </button>
        </fieldset>
      </form>

      <form onSubmit={handleSave} className="form">
        <fieldset>
          <legend>Delay Settings (milliseconds)</legend>
          <div className="form-grid-2">
            <label>
              Minimum Delay
              <input
                type="number"
                value={config.min_delay}
                onChange={(e) => setConfig({ ...config, min_delay: Number(e.target.value) })}
                min="1000"
              />
            </label>
            <label>
              Maximum Delay
              <input
                type="number"
                value={config.max_delay}
                onChange={(e) => setConfig({ ...config, max_delay: Number(e.target.value) })}
                min="1000"
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>CSS Selectors</legend>
          <label>
            Dropdown Selector
            <input
              type="text"
              value={config.selector_dropdown}
              onChange={(e) => setConfig({ ...config, selector_dropdown: e.target.value })}
              placeholder=".dropdown or #id"
            />
          </label>
          <label>
            Pool Items Selector
            <input
              type="text"
              value={config.selector_pool_items}
              onChange={(e) => setConfig({ ...config, selector_pool_items: e.target.value })}
              placeholder=".pool-item or [data-id]"
            />
          </label>
          <label>
            Verify Button Selector
            <input
              type="text"
              value={config.selector_verify_button}
              onChange={(e) => setConfig({ ...config, selector_verify_button: e.target.value })}
              placeholder=".verify-btn or [onclick]"
            />
          </label>
          <label>
            Close Button Selector
            <input
              type="text"
              value={config.selector_close_button}
              onChange={(e) => setConfig({ ...config, selector_close_button: e.target.value })}
              placeholder=".close or [aria-label]"
            />
          </label>
        </fieldset>

        <button type="submit" disabled={saving} className="btn-primary btn-large">
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
    </section>
  );
}
