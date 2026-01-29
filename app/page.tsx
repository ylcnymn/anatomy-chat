"use client";

import { useEffect, useState, useRef } from "react";
import { Brain, Heart, Activity, Settings, User, Baby, ChevronRight, MessageSquare, Send, Loader2, MoreVertical, Trash2, Edit3, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, Message } from "@/lib/store";
import { getSystemPrompt } from "@/lib/persona";
import { AIChatClient } from "@/lib/ai-client";
import SettingsModal from "./components/SettingsModal";

const MODES = [
    { id: "doctor", label: "Doktor", icon: User, color: "text-blue-400" },
    { id: "curious", label: "Meraklı", icon: Activity, color: "text-emerald-400" },
    { id: "child", label: "Çocuk", icon: Baby, color: "text-amber-400" },
] as const;

export default function Home() {
    const { config, selectedMode, setSelectedMode, sessions, activeSessionId, createSession, deleteSession, renameSession, saveMessage, clearOrganHistory, _hasHydrated } = useAppStore();
    const [selectedOrgan, setSelectedOrgan] = useState<any>(null);
    const [anatomyData, setAnatomyData] = useState<any[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync messages with active session
    useEffect(() => {
        if (activeSessionId) {
            const session = sessions.find(s => s.id === activeSessionId);
            setMessages(session?.messages || []);
        } else {
            setMessages([]);
        }
    }, [activeSessionId, sessions]);

    // Handle organ change: set first session or create one
    useEffect(() => {
        if (selectedOrgan && _hasHydrated) {
            const organSessions = sessions.filter(s => s.organId === selectedOrgan.id);
            if (organSessions.length > 0) {
                // If current session belongs to another organ, switch to the first one of the selected organ
                const currentSession = sessions.find(s => s.id === activeSessionId);
                if (!currentSession || currentSession.organId !== selectedOrgan.id) {
                    useAppStore.setState({ activeSessionId: organSessions[0].id });
                }
            } else {
                createSession(selectedOrgan.id);
            }
        }
    }, [selectedOrgan, _hasHydrated]);

    useEffect(() => {
        import("@/data/anatomy_data.json").then((data) => {
            const formattedData = data.default.map((item: any) => ({
                ...item,
                icon: item.icon === "Brain" ? Brain : item.icon === "Heart" ? Heart : Activity,
                latin: item.latin_name
            }));
            setAnatomyData(formattedData);
        });
    }, []);

    const scrollToBottom = (force = false) => {
        if (force || isAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !selectedOrgan || !activeSessionId || isLoading) return;

        const userMessage: Message = { role: "user" as const, content: input };
        const updatedMessages: Message[] = [...messages, userMessage];

        setIsAutoScroll(true); // Force scroll on user message
        setMessages(updatedMessages);
        saveMessage(activeSessionId, updatedMessages);

        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    systemPrompt: getSystemPrompt(selectedOrgan.name, selectedMode),
                    config: config
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Sunucu hatası");
            }

            const stream = response.body;
            if (!stream) throw new Error("No stream returned");

            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let currentFullResponse = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.replace("data: ", "").trim();
                        if (dataStr === "[DONE]") break;

                        try {
                            const json = JSON.parse(dataStr);
                            const content = json.choices[0]?.delta?.content || "";
                            currentFullResponse += content;

                            setMessages(prev => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last?.role === 'assistant') {
                                    updated[updated.length - 1] = { role: 'assistant', content: currentFullResponse };
                                } else {
                                    updated.push({ role: 'assistant', content: currentFullResponse });
                                }
                                return updated;
                            });
                        } catch (e) {
                            // Ignore partial JSON
                        }
                    }
                }
            }

            saveMessage(activeSessionId, [...updatedMessages, { role: 'assistant' as const, content: currentFullResponse }]);

        } catch (error: any) {
            const errorMessage: Message = { role: "assistant" as const, content: `Hata: ${error.message}. Lütfen AI ayarlarını kontrol et.` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex h-screen w-full bg-[#050505] text-[#e0e0e0] overflow-hidden">
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Fixed Sidebar */}
            <aside className="w-80 bg-[#0d0d0d] border-r border-white/5 flex flex-col shrink-0 z-20">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Brain className="text-white" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Organ Chat</h1>
                    </div>

                    {/* Mode Selector */}
                    <div className="space-y-3 mb-8">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Kullanım Modu</p>
                        <div className="grid grid-cols-1 gap-1.5">
                            {MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode.id)}
                                    className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all duration-200 ${selectedMode === mode.id
                                        ? "bg-white/10 text-white"
                                        : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                                        }`}
                                >
                                    <mode.icon size={16} className={selectedMode === mode.id ? mode.color : "text-gray-600"} />
                                    <span className="font-medium text-sm">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scrollable Sidebar Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 space-y-8">
                    {/* Session List */}
                    <AnimatePresence>
                        {selectedOrgan && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Sohbet Geçmişi</p>
                                    <button
                                        onClick={() => createSession(selectedOrgan.id)}
                                        className="p-1 hover:bg-white/10 rounded-md text-indigo-400 transition-colors"
                                    >
                                        <MessageSquare size={14} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {sessions.filter(s => s.organId === selectedOrgan.id).map(session => (
                                        <div key={session.id} className="group relative">
                                            {editingSessionId === session.id ? (
                                                <div className="flex items-center space-x-2 p-2 bg-white/5 rounded-xl border border-white/10">
                                                    <input
                                                        autoFocus
                                                        value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                renameSession(session.id, renameValue);
                                                                setEditingSessionId(null);
                                                            } else if (e.key === 'Escape') {
                                                                setEditingSessionId(null);
                                                            }
                                                        }}
                                                        className="flex-1 bg-transparent text-xs focus:outline-none text-white"
                                                    />
                                                    <button onClick={() => {
                                                        renameSession(session.id, renameValue);
                                                        setEditingSessionId(null);
                                                    }} className="text-emerald-500 hover:text-emerald-400">
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={() => setEditingSessionId(null)} className="text-gray-500 hover:text-gray-400">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center group/btn">
                                                    <button
                                                        onClick={() => useAppStore.setState({ activeSessionId: session.id })}
                                                        className={`flex-1 text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between ${activeSessionId === session.id
                                                                ? "bg-white/5 text-white"
                                                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                                            }`}
                                                    >
                                                        <div className="truncate font-medium">{session.title}</div>
                                                    </button>

                                                    {/* Context Menu Button */}
                                                    <div className="flex items-center absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setMenuOpenId(menuOpenId === session.id ? null : session.id);
                                                            }}
                                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white"
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Context Menu Dropdown */}
                                                    {menuOpenId === session.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                                                            <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-1 z-50 w-32 animate-in fade-in zoom-in duration-200">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingSessionId(session.id);
                                                                        setRenameValue(session.title);
                                                                        setMenuOpenId(null);
                                                                    }}
                                                                    className="w-full flex items-center space-x-2 p-2 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                                >
                                                                    <Edit3 size={12} />
                                                                    <span>Yeniden Adlandır</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm('Bu sohbeti silmek istediğine emin misin?')) {
                                                                            deleteSession(session.id);
                                                                        }
                                                                        setMenuOpenId(null);
                                                                    }}
                                                                    className="w-full flex items-center space-x-2 p-2 text-[11px] text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    <span>Sil</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Bu organa ait TÜM sohbet geçmişini silmek istediğine emin misin? Bu işlem geri alınamaz.')) {
                                            clearOrganHistory(selectedOrgan.id);
                                        }
                                    }}
                                    className="w-full py-2 text-[9px] uppercase tracking-widest text-red-500/30 hover:text-red-500/80 transition-colors font-bold"
                                >
                                    Geçmişi Sil
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Organ List */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 border-b border-white/5 pb-2">Vücut Bölgeleri</p>
                        {["Baş", "Gövde"].map(region => (
                            <div key={region} className="space-y-1">
                                <div className="px-1 py-1 text-[9px] font-black text-gray-600 uppercase tracking-widest">{region}</div>
                                <div className="space-y-0.5">
                                    {anatomyData.filter(h => h.region === region).map(organ => (
                                        <button
                                            key={organ.id}
                                            onClick={() => setSelectedOrgan(organ)}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all ${selectedOrgan?.id === organ.id
                                                ? "bg-indigo-600/10 text-white"
                                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                                }`}
                                        >
                                            <span className="font-medium">{organ.name}</span>
                                            <ChevronRight size={12} className={`transition-transform duration-300 ${selectedOrgan?.id === organ.id ? "rotate-90 text-indigo-400" : "opacity-0 group-hover:opacity-100"}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fixed Sidebar Bottom */}
                <div className="p-6 bg-[#0d0d0d] border-t border-white/5">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center justify-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all text-gray-500 hover:text-white border border-transparent hover:border-white/5"
                    >
                        <Settings size={18} />
                        <span className="text-sm font-medium">Ayarlar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content (Chat Area) */}
            <section className="flex-1 flex flex-col relative bg-[#050505]">
                {/* Scrollable Messages Container */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        const atBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 150;
                        setIsAutoScroll(atBottom);
                    }}
                >
                    <AnimatePresence mode="wait">
                        {selectedOrgan ? (
                            <motion.div
                                key={selectedOrgan.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="max-w-3xl mx-auto w-full px-6 py-12 flex flex-col min-h-full"
                            >
                                {/* Chat Header Info */}
                                <div className="flex items-center justify-center mb-16 relative">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                            <selectedOrgan.icon size={32} className="text-indigo-500/60" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white">{selectedOrgan.name}</h2>
                                        <p className="text-xs text-indigo-400/50 font-mono mt-1 uppercase tracking-widest">{selectedOrgan.latin}</p>
                                    </div>
                                </div>

                                {/* Messages Container */}
                                <div className="flex-1 flex flex-col space-y-8 pb-32">
                                    {messages.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 mt-20">
                                            <MessageSquare size={48} className="mb-4" />
                                            <p className="text-lg font-medium italic">Seni dinlemeye hazırım...</p>
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}
                                        >
                                            <div className={`text-[10px] font-bold text-gray-600 mb-2 uppercase tracking-widest px-2`}>
                                                {msg.role === 'user' ? 'Sen' : selectedOrgan.name}
                                            </div>
                                            <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed max-w-[90%] shadow-lg ${msg.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                                : 'bg-white/[0.03] border border-white/5 text-gray-200 rounded-tl-none'
                                                }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                                        <div className="flex items-start">
                                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex items-center space-x-3">
                                                <div className="flex space-x-1">
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium tracking-wide">Analiz yapılıyor...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-6">
                                <div className="text-center space-y-6 max-w-sm">
                                    <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                                        <Brain size={48} className="text-white/10" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tight">Anatomi Yolculuğu</h2>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        Sol menüden bir organ seçerek vücudunun gizemli dünyasını keşfetmeye hemen başlayabilirsin.
                                    </p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Floating Input Area */}
                {selectedOrgan && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent shrink-0">
                        <div className="max-w-3xl mx-auto relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-focus-within:opacity-100" />
                            <div className="relative flex items-center bg-[#111111] border border-white/10 rounded-2xl shadow-2xl focus-within:border-indigo-500/40 transition-all overflow-hidden">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    rows={1}
                                    disabled={isLoading}
                                    placeholder={`${selectedOrgan.name} hakkında bir şeyler sor...`}
                                    className="flex-1 bg-transparent py-4 pl-6 pr-14 text-[15px] focus:outline-none resize-none custom-scrollbar"
                                    style={{ maxHeight: '180px' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className={`absolute right-3 p-2.5 rounded-xl transition-all ${input.trim() && !isLoading
                                        ? "bg-indigo-600 text-white shadow-lg active:scale-95"
                                        : "text-gray-700 bg-white/[0.02]"
                                        }`}
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                            <div className="mt-3 flex justify-center items-center space-x-4">
                                <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.2em]">
                                    Enter ile gönder • Shift+Enter satır
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.08);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.15);
                }
            `}</style>
        </main>
    );
}
