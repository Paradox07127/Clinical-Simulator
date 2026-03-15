import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';

// --- Security: URL allowlist to prevent SSRF ---
const ALLOWED_ORIGINS = [
  'https://api.openai.com',
  'https://dashscope.aliyuncs.com',
  'https://dashscope-intl.aliyuncs.com',
];

function isAllowedUrl(url: string): boolean {
  try {
    const { origin } = new URL(url);
    return ALLOWED_ORIGINS.some(allowed => origin === allowed);
  } catch {
    return false;
  }
}

// --- Security: API keys from server environment, not client ---
function getApiKey(provider: 'openai' | 'qwen' | 'gemini'): string | null {
  if (provider === 'openai') return process.env.OPENAI_API_KEY || null;
  if (provider === 'gemini') return process.env.GEMINI_API_KEY || null;
  return process.env.DASHSCOPE_API_KEY || null;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.RENDER_EXTERNAL_URL, process.env.APP_URL].filter(Boolean) as string[]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: '1mb' }));

  // Proxy for OpenAI API
  app.post('/api/proxy/openai', async (req, res) => {
    const { url, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }

    if (!isAllowedUrl(url)) {
      return res.status(403).json({ error: 'URL not in allowlist' });
    }

    const apiKey = getApiKey('openai');
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).send(errorText);
      }

      if (contentType.includes('application/json')) {
        const data = await response.json();
        return res.json(data);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
      return res.send(buffer);
    } catch (error) {
      console.error('OpenAI proxy error');
      return res.status(500).json({ error: 'Failed to proxy OpenAI request' });
    }
  });

  // Proxy for Qwen TTS
  app.post('/api/proxy/qwen-tts', async (req, res) => {
    const { url, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing url' });
    }

    if (!isAllowedUrl(url)) {
      return res.status(403).json({ error: 'URL not in allowlist' });
    }

    const apiKey = getApiKey('qwen');
    if (!apiKey) {
      return res.status(500).json({ error: 'DASHSCOPE_API_KEY not configured on server' });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).send(errorText);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Qwen TTS proxy error');
      res.status(500).json({ error: 'Failed to proxy request' });
    }
  });

  // Proxy for Gemini TTS (server-side SDK call)
  app.post('/api/proxy/gemini-tts', async (req, res) => {
    const { text, voiceName, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const apiKey = getApiKey('gemini');
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: model || 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({ error: 'No audio data in Gemini response' });
      }

      return res.json({ audio: base64Audio });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Gemini TTS proxy error:', message);
      return res.status(500).json({ error: `Gemini TTS failed: ${message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
