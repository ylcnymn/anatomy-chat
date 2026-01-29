export interface AIConfig {
    provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
    apiKey: string;
    baseUrl: string;
    modelName: string;
    temperature?: number;
    maxTokens?: number;
}

export class AIChatClient {
    private config: AIConfig;

    constructor(config: AIConfig) {
        this.config = config;
    }

    private getEffectiveBaseUrl() {
        if (this.config.provider === 'openai') return 'https://api.openai.com/v1';
        if (this.config.provider === 'ollama') return this.config.baseUrl || 'http://localhost:11434/v1';
        return this.config.baseUrl;
    }

    async chatStream(messages: { role: string; content: string }[], systemPrompt: string) {
        const baseUrl = this.getEffectiveBaseUrl();

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.modelName || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        return response.body; // Returns ReadableStream for streaming
    }
}
