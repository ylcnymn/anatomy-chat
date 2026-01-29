import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIConfig } from '@/lib/ai-client';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatSession {
    id: string;
    organId: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

interface AppState {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
    selectedMode: 'doctor' | 'curious' | 'child';
    setSelectedMode: (mode: 'doctor' | 'curious' | 'child') => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    createSession: (organId: string) => string;
    deleteSession: (sessionId: string) => void;
    renameSession: (sessionId: string, newTitle: string) => void;
    saveMessage: (sessionId: string, message: Message | Message[]) => void;
    clearOrganHistory: (organId: string) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            config: {
                provider: 'openai',
                apiKey: '',
                baseUrl: '',
                modelName: 'gpt-3.5-turbo',
                temperature: 0.7,
                maxTokens: 2000,
            },
            setConfig: (config) => set({ config }),
            selectedMode: 'curious',
            setSelectedMode: (selectedMode) => set({ selectedMode }),
            sessions: [],
            activeSessionId: null,
            createSession: (organId) => {
                const id = Math.random().toString(36).substring(7);
                const newSession: ChatSession = {
                    id,
                    organId,
                    title: 'Yeni Sohbet',
                    messages: [],
                    timestamp: Date.now(),
                };
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    activeSessionId: id
                }));
                return id;
            },
            deleteSession: (sessionId) => set((state) => {
                const newSessions = state.sessions.filter(s => s.id !== sessionId);
                return {
                    sessions: newSessions,
                    activeSessionId: state.activeSessionId === sessionId ? (newSessions[0]?.id || null) : state.activeSessionId
                };
            }),
            renameSession: (sessionId, newTitle) => set((state) => ({
                sessions: state.sessions.map(s => s.id === sessionId ? { ...s, title: newTitle } : s)
            })),
            saveMessage: (sessionId, message) => set((state) => {
                const newSessions = state.sessions.map(s => {
                    if (s.id === sessionId) {
                        const newMsgs = Array.isArray(message) ? message : [...s.messages, message];
                        // Auto-title from first user message
                        let title = s.title;
                        if (title === 'Yeni Sohbet' && newMsgs.length > 0) {
                            const firstUserMsg = newMsgs.find(m => m.role === 'user');
                            if (firstUserMsg) {
                                title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
                            }
                        }
                        return { ...s, messages: newMsgs, title };
                    }
                    return s;
                });
                return { sessions: newSessions };
            }),
            clearOrganHistory: (organId) => set((state) => ({
                sessions: state.sessions.filter(s => s.organId !== organId),
                activeSessionId: null
            })),
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'organ-chat-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
