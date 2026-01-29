import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { messages, systemPrompt, config } = await req.json();

        let baseUrl = config.provider === 'openai'
            ? 'https://api.openai.com/v1'
            : config.baseUrl;

        if (!baseUrl) {
            return new Response(JSON.stringify({ error: "Base URL eksik. Ayarları kontrol edin." }), { status: 400 });
        }

        // URL temizliği ve normalizasyon
        baseUrl = baseUrl.trim().replace(/\/+$/, "");

        // Full URL oluşturma
        const fullUrl = baseUrl.endsWith('/chat/completions')
            ? baseUrl
            : `${baseUrl}/chat/completions`;

        const model = (config.modelName || "").trim();

        console.log(`[Proxy] Request Details:`);
        console.log(`- URL: ${fullUrl}`);
        console.log(`- Model: "${model}"`);

        if (!model) {
            return new Response(JSON.stringify({
                error: "Hata: Model ID boş olamaz. Lütfen ayarlardan model adını girip kaydedin."
            }), { status: 400 });
        }

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey || 'no-key'}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                stream: true,
                temperature: config.temperature || 0.7,
                max_tokens: Math.min(config.maxTokens || 2000, 4096),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({
                error: `AI Sağlayıcı Hatası (${response.status}): ${errorText || 'Endpoint bulunamadı. URL\'nin sonuna /v1 eklediğinizden emin olun.'}`
            }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Return the stream directly from the server to the client
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
