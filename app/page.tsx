"use client";

import { useEffect, useState, useRef } from "react";
import { Brain, Heart, Activity, Settings, User, Baby, ChevronRight, MessageSquare, Send, Loader2, MoreVertical, Trash2, Edit3, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, Message } from "@/lib/store";
import { getSystemPrompt } from "@/lib/persona";
import SettingsModal from "./components/SettingsModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MODES = [
    { id: "doctor", label: "Doctor", icon: User, color: "text-blue-400" },
    { id: "curious", label: "Curious", icon: Activity, color: "text-emerald-400" },
    { id: "child", label: "Child", icon: Baby, color: "text-amber-400" },
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
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
        const formatItem = (item: any): any => ({
            ...item,
            icon: item.icon === "Brain" ? Brain : item.icon === "Heart" ? Heart : Activity,
            latin: item.latin_name,
            children: item.children ? item.children.map(formatItem) : undefined
        });

        import("@/data/anatomy_data.json").then((data) => {
            const formattedData = data.default.map(formatItem);
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

        setIsAutoScroll(true);
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
                throw new Error(err.error || "Server error");
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
                        } catch (e) { }
                    }
                }
            }

            saveMessage(activeSessionId, [...updatedMessages, { role: 'assistant' as const, content: currentFullResponse }]);

        } catch (error: any) {
            const errorMessage: Message = { role: "assistant" as const, content: `Error: ${error.message}. Please check AI settings.` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderAnatomyItem = (item: any, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedIds.has(item.id);

        return (
            <div key={item.id} className="space-y-0.5">
                <div
                    className={`group flex items-center justify-between p-2 rounded-lg text-sm transition-all cursor-pointer ${selectedOrgan?.id === item.id
                        ? "bg-indigo-600/10 text-white"
                        : item.isCategory ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        }`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={(e) => {
                        if (hasChildren) {
                            toggleExpand(item.id, e);
                        }
                        if (!item.isCategory) {
                            setSelectedOrgan(item);
                        }
                    }}
                >
                    <div className="flex items-center space-x-2 truncate">
                        {hasChildren && (
                            <ChevronRight
                                size={12}
                                className={`transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                            />
                        )}
                        <span className={`truncate ${item.isCategory ? "font-bold uppercase text-[10px] tracking-widest text-indigo-400/80" : "font-medium"}`}>
                            {item.name}
                        </span>
                    </div>
                </div>

                <AnimatePresence>
                    {hasChildren && isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            {item.children.map((child: any) => renderAnatomyItem(child, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <main className="flex h-screen w-full bg-[#0a0a0a] text-[#f0f0f0] overflow-hidden">
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <aside className="w-80 bg-[#0d0d0d] border-r border-white/5 flex flex-col shrink-0 z-20">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Brain className="text-white" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Anatomy Chat</h1>
                    </div>

                    <div className="space-y-3 mb-8">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Interaction Mode</p>
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

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-24 space-y-8">
                    <AnimatePresence>
                        {selectedOrgan && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Chat History</p>
                                    <button onClick={() => createSession(selectedOrgan.id)} className="p-1 hover:bg-white/10 rounded-md text-indigo-400 transition-colors">
                                        <MessageSquare size={14} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {sessions.filter(s => s.organId === selectedOrgan.id).map(session => (
                                        <div key={session.id} className="group relative">
                                            {editingSessionId === session.id ? (
                                                <div className="flex items-center space-x-2 p-2 bg-white/5 rounded-xl border border-white/10">
                                                    <input
                                                        autoFocus value={renameValue}
                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') { renameSession(session.id, renameValue); setEditingSessionId(null); }
                                                            else if (e.key === 'Escape') { setEditingSessionId(null); }
                                                        }}
                                                        className="flex-1 bg-transparent text-xs focus:outline-none text-white"
                                                    />
                                                    <button onClick={() => { renameSession(session.id, renameValue); setEditingSessionId(null); }} className="text-emerald-500"><Check size={14} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center group/btn">
                                                    <button onClick={() => useAppStore.setState({ activeSessionId: session.id })} className={`flex-1 text-left p-2.5 rounded-lg text-xs transition-all ${activeSessionId === session.id ? "bg-white/5 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
                                                        <div className="truncate font-medium">{session.title}</div>
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === session.id ? null : session.id); }} className="absolute right-1 p-1.5 opacity-0 group-hover:opacity-100"><MoreVertical size={14} /></button>
                                                    {menuOpenId === session.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl p-1 z-50 w-32 shadow-2xl">
                                                            <button onClick={() => { setEditingSessionId(session.id); setRenameValue(session.title); setMenuOpenId(null); }} className="w-full flex items-center space-x-2 p-2 text-[11px] hover:bg-white/5 rounded-lg"><Edit3 size={12} /><span>Rename</span></button>
                                                            <button onClick={() => { if (window.confirm('Delete this chat?')) deleteSession(session.id); setMenuOpenId(null); }} className="w-full flex items-center space-x-2 p-2 text-[11px] text-red-500/60 hover:bg-red-500/5 rounded-lg"><Trash2 size={12} /><span>Delete</span></button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => { if (window.confirm('Clear all history?')) clearOrganHistory(selectedOrgan.id); }} className="w-full py-2 text-[9px] uppercase tracking-widest text-red-500/30 hover:text-red-500/80 font-bold transition-colors">Clear History</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 border-b border-white/5 pb-2">Body Map</p>
                        <div className="space-y-1">
                            {anatomyData.map(item => renderAnatomyItem(item))}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#0d0d0d] border-t border-white/5 space-y-4">
                    <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center justify-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all text-gray-500 hover:text-white border border-transparent hover:border-white/5">
                        <Settings size={18} /><span className="text-sm font-medium">Settings</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-600 font-medium">Developed by</p>
                        <p className="text-[11px] text-indigo-400/70 font-bold tracking-tight">Yalçın Yaman</p>
                    </div>
                </div>
            </aside>

            <section className="flex-1 flex flex-col relative bg-[#0a0a0a]">
                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth" onScroll={(e) => { const target = e.currentTarget; setIsAutoScroll(target.scrollHeight - target.scrollTop <= target.clientHeight + 150); }}>
                    <AnimatePresence mode="wait">
                        {selectedOrgan ? (
                            <motion.div key={selectedOrgan.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto w-full px-6 py-12 flex flex-col min-h-full">
                                <div className="flex items-center justify-center mb-16 relative">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                            {(() => {
                                                const Icon = selectedOrgan.icon || Activity;
                                                return <Icon size={32} className="text-indigo-500/60" />;
                                            })()}
                                        </div>
                                        <h2 className="text-3xl font-black text-white">{selectedOrgan.name}</h2>
                                        <p className="text-xs text-indigo-400/50 font-mono mt-1 uppercase tracking-widest">{selectedOrgan.latin_name || selectedOrgan.latin}</p>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col space-y-8 pb-32">
                                    {messages.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 mt-20">
                                            <MessageSquare size={48} className="mb-4" /><p className="text-lg font-medium italic">I am ready to listen...</p>
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}>
                                            <div className="text-[10px] font-bold text-gray-500/60 mb-2 uppercase tracking-widest px-2">{msg.role === 'user' ? 'You' : selectedOrgan.name}</div>
                                            <div className={`px-6 py-4 rounded-2xl text-[15px] leading-relaxed max-w-[90%] shadow-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#161616] border border-white/10 text-gray-200 rounded-tl-none'}`}>
                                                <div className="markdown-content">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                                        <div className="flex items-start">
                                            <div className="bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl flex items-center space-x-3">
                                                <div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" /></div>
                                                <span className="text-xs text-gray-400 font-medium tracking-wide">Analysing...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-6"><div className="text-center space-y-6 max-w-sm"><div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8"><Brain size={48} className="text-white/10" /></div><h2 className="text-3xl font-black text-white tracking-tight">Anatomy Journey</h2><p className="text-gray-500 text-sm leading-relaxed">Select an organ from the left menu to start exploring the mysterious world of your body.</p></div></div>
                        )}
                    </AnimatePresence>
                </div>

                {selectedOrgan && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent shrink-0">
                        <div className="max-w-5xl mx-auto relative group">
                            <div className="relative flex items-center bg-[#111111] border border-white/10 rounded-2xl focus-within:border-indigo-500/40 transition-all shadow-2xl overflow-hidden">
                                <textarea
                                    value={input} onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    rows={1} disabled={isLoading} placeholder={`Ask something about ${selectedOrgan.name}...`}
                                    className="flex-1 bg-transparent py-4 pl-6 pr-14 text-[15px] focus:outline-none resize-none"
                                />
                                <button onClick={handleSend} disabled={isLoading || !input.trim()} className={`absolute right-3 p-2.5 rounded-xl transition-all ${input.trim() ? 'text-indigo-400' : 'text-gray-700'}`}>{isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}</button>
                            </div>
                            <div className="mt-3 text-center"><p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Enter to send • Shift+Enter for new line</p></div>
                        </div>
                    </div>
                )}
            </section>

            <style jsx global>{`
                .markdown-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                    font-size: 0.9rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .markdown-content th {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    text-align: left;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                    color: #fff;
                    font-weight: 600;
                }
                .markdown-content td {
                    padding: 10px 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .markdown-content tr:last-child td {
                    border-bottom: none;
                }
                .markdown-content tr:nth-child(even) {
                    background: rgba(255, 255, 255, 0.02);
                }
                .markdown-content p {
                    margin-bottom: 0.5rem;
                }
                .markdown-content p:last-child {
                    margin-bottom: 0;
                }
                .markdown-content ul, .markdown-content ol {
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .markdown-content li {
                    margin-bottom: 0.25rem;
                }
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
