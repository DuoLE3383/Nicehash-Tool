'use client';

import React, { useState, useEffect } from 'react';

interface NicehashConfig {
    min_delay: number;
    max_delay: number;
    selector_dropdown: string;
    selector_pool_items: string;
    selector_verify_button: string;
    selector_close_button: string;
}

export default function NicehashConfigPage() {
    const [config, setConfig] = useState<NicehashConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/main/api/v2/config`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (err) {
            console.error("Failed to fetch config", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config) return;
        
        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch(`${API_BASE_URL}/main/api/v2/config`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings. Are you logged in?' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Connection error.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!config) return <div className="p-8 text-white">Loading configuration...</div>;

    return (
        <main className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 flex items-center">
                    <span className="bg-yellow-400 text-gray-900 p-2 rounded-lg mr-4">NH</span>
                    Nicehash Tool Config
                </h1>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Min Delay (ms)</label>
                            <input 
                                type="number" 
                                value={config.min_delay} 
                                onChange={e => setConfig({...config, min_delay: parseInt(e.target.value)})}
                                className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Max Delay (ms)</label>
                            <input 
                                type="number" 
                                value={config.max_delay} 
                                onChange={e => setConfig({...config, max_delay: parseInt(e.target.value)})}
                                className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'Dropdown Selector', key: 'selector_dropdown' },
                            { label: 'Pool Item Selector', key: 'selector_pool_items' },
                            { label: 'Verify Button Selector', key: 'selector_verify_button' },
                            { label: 'Close Button Selector', key: 'selector_close_button' },
                        ].map((field) => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{field.label}</label>
                                <input 
                                    type="text" 
                                    value={(config as any)[field.key]} 
                                    onChange={e => setConfig({...config, [field.key]: e.target.value})}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                                    placeholder=".css-selector or #id"
                                />
                            </div>
                        ))}
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4">
                        <p className="text-xs text-gray-500">
                            Note: The Tampermonkey script fetches these values every cycle.
                        </p>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-8 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="mt-8 max-w-2xl mx-auto text-gray-500 text-sm">
                <h3 className="font-bold mb-2">How to connect:</h3>
                <ol className="list-decimal ml-4 space-y-1">
                    <li>Ensure the Node.js API server is running on port 8080.</li>
                    <li>Verify your .env file has valid NICEHASH_API_ID and NICEHASH_ORG_ID.</li>
                    <li>The userscript will automatically update its behavior when you save here.</li>
                </ol>
            </div>
        </main>
    );
}