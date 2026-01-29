"use client";

import { X, Save } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { config, setConfig, _hasHydrated } = useAppStore();
    const [localConfig, setLocalConfig] = useState(config);

    // Sync local state when modal opens or store rehydrates
    useEffect(() => {
        if (isOpen && _hasHydrated) {
            setLocalConfig(config);
        }
    }, [isOpen, _hasHydrated, config]);

    if (!isOpen) return null;

    const handleSave = () => {
        setConfig(localConfig);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-2xl bg-[#0d1117] rounded-xl overflow-hidden shadow-2xl border border-[#30363d]">
                <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Add new LLM model</h2>
                    <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-2 gap-6 text-left">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#c9d1d9]">Provider</label>
                        <select
                            value={localConfig.provider}
                            onChange={(e) => setLocalConfig({ ...localConfig, provider: e.target.value as any })}
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-white focus:outline-none focus:border-[#238636] transition-colors"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="ollama">Ollama (Local LLM)</option>
                            <option value="custom">Custom (OpenAI-compatible)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#c9d1d9]">API Key (Optional)</label>
                        <input
                            type="password"
                            placeholder="Enter key"
                            value={localConfig.apiKey}
                            onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#238636]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#c9d1d9]">Display Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Local Llama"
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#238636]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#c9d1d9]">Endpoint URL</label>
                        <input
                            type="text"
                            placeholder="http://host.docker.internal:11434/v1"
                            value={localConfig.baseUrl}
                            onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#238636]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#c9d1d9]">Model ID</label>
                        <input
                            type="text"
                            placeholder="gpt-3.5-turbo, llama3, gpt-4o..."
                            value={localConfig.modelName}
                            onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#238636]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#c9d1d9]">Temp</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="0.7"
                                value={localConfig.temperature}
                                onChange={(e) => setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) })}
                                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#238636]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#c9d1d9]">Max Tokens</label>
                            <input
                                type="number"
                                placeholder="2000"
                                value={localConfig.maxTokens}
                                onChange={(e) => setLocalConfig({ ...localConfig, maxTokens: parseInt(e.target.value) })}
                                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-white placeholder-[#484f58] focus:outline-none focus:border-[#238636]"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#010409] flex justify-end space-x-3 border-t border-[#30363d]">
                    <button
                        onClick={onClose}
                        className="bg-transparent hover:bg-[#30363d] text-white font-medium px-6 py-2 rounded-lg transition-colors border border-[#30363d]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-[#238636] hover:bg-[#2ea043] text-white font-semibold px-8 py-2 rounded-lg transition-all shadow-md"
                    >
                        Save Model
                    </button>
                </div>
            </div>
        </div>
    );
}
