import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const PORT = 3000;

async function startServer() {
  const app = express();
  // Support high resolution image base64 payloads
  app.use(express.json({ limit: '15mb' }));

  // Initialize Gemini client on the server securely
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Content Analysis
  app.post('/api/gemini/analyze-content', async (req: any, res: any) => {
    const { content, type } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const systemInstruction = `
      You are Qklipto AI, an expert content analyzer. 
      Analyze the provided ${type || 'text'} snippet.
      - If it's text: provide a summary, sentiment, and key points.
      - If it's code: explain what it does, identify the language, and suggest optimizations.
      - Always return structured JSON matching the requested schema.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: 'A concise summary of the content.' },
        category: { type: Type.STRING, description: 'A one-word category label.' },
        keyPoints: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Key takeaways or main points.' 
        },
        explanation: { type: Type.STRING, description: 'Detailed explanation (especially for code).' },
        sentiment: { type: Type.STRING, description: 'Emotional tone (for text).' }
      },
      required: ['summary', 'category', 'keyPoints']
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: content,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const text = response.text || '{}';
      const result = JSON.parse(text);
      res.json(result);
    } catch (error: any) {
      console.error('Server Gemini Content Analysis Error:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze content.' });
    }
  });

  // API Route: Image Analysis & OCR
  app.post('/api/gemini/analyze-image', async (req: any, res: any) => {
    const { imageSrc } = req.body;
    if (!imageSrc) {
      return res.status(400).json({ error: 'Image source is required.' });
    }

    let base64Data = imageSrc;
    if (imageSrc.includes(',')) {
      base64Data = imageSrc.split(',')[1];
    }

    // Try to handle fetching external URLs as a proxy if it is a remote image URL,
    // otherwise treat as inline base64 data.
    let imagePart: any;
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      try {
        const fetchRes = await fetch(imageSrc);
        const arrayBuffer = await fetchRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        imagePart = {
          inlineData: {
            mimeType: 'image/png',
            data: base64,
          },
        };
      } catch (err) {
        console.error('Failed to pre-fetch image url on server:', err);
        return res.status(500).json({ error: 'Failed to fetch the remote image URL for analysis.' });
      }
    } else {
      imagePart = {
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      };
    }

    const prompt = 'Describe this image in detail, extract any visible text, and categorize it.';

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: 'A concise description of the image.' },
        category: { type: Type.STRING, description: 'A one-word category label.' },
        keyPoints: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Key objects or text found in the image.' 
        }
      },
      required: ['summary', 'category', 'keyPoints']
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema
        }
      });

      const text = response.text || '{}';
      const result = JSON.parse(text);
      res.json(result);
    } catch (error: any) {
      console.error('Server Gemini Image Analysis Error:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze image.' });
    }
  });

  // API Route: Public Library Module
  app.get('/api/public-library', (req: any, res: any) => {
    const forceFail = req.query.forceFail === 'true';
    if (forceFail) {
      return res.status(503).json({
        error: 'Service Temporarily Unavailable',
        code: 'LIBRARY_CONN_TIMEOUT',
        message: 'Could not connect to the remote snippet database. The server is currently overloaded or undergoing maintenance.',
        diagnostics: {
          timestamp: new Date().toISOString(),
          endpoint: '/api/public-library',
          status: 503,
          dnsStatus: 'OK',
          gatewayPing: 'Timeout (>5000ms)'
        }
      });
    }

    const q = (req.query.q || '').toLowerCase();

    const kits = [
      {
        id: 'lib-kit-1',
        title: 'React Hooks Starter Kit 🧬',
        description: 'Predefined hooks for production: useLocalStorage, useDebounce, useWindowSize.',
        tag: 'react',
        type: 'kit',
        clips: [
          {
            title: 'useLocalStorage Hook',
            content: `import { useState } from 'react';\n\nexport function useLocalStorage<T>(key: string, initialValue: T) {\n  const [storedValue, setStoredValue] = useState<T>(() => {\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch (error) {\n      return initialValue;\n    }\n  });\n\n  const setValue = (value: T) => {\n    try {\n      setStoredValue(value);\n      window.localStorage.setItem(key, JSON.stringify(value));\n    } catch (e) {}\n  };\n\n  return [storedValue, setValue] as const;\n}`,
            type: 'code',
            tags: ['react', 'hooks']
          },
          {
            title: 'useDebounce Hook',
            content: `import { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n\n  return debouncedValue;\n}`,
            type: 'code',
            tags: ['react', 'hooks']
          }
        ]
      },
      {
        id: 'lib-kit-2',
        title: 'FastAPI Boilerplate Kit 🐍',
        description: 'Quickly set up FastAPI with CORS support and structured route definitions.',
        tag: 'python',
        type: 'kit',
        clips: [
          {
            title: 'main.py (FastAPI Starter)',
            content: `from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n\napp = FastAPI(title="Qklipto Microservice")\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_credentials=True,\n    allow_methods=["*"],\n    allow_headers=["*"],\n)\n\n@app.get("/")\ndef read_root():\n    return {"status": "healthy", "service": "public-library-connector"}`,
            type: 'code',
            tags: ['fastapi', 'python', 'server']
          }
        ]
      },
      {
        id: 'lib-kit-3',
        title: 'Bento Grid Visual Cards 🎨',
        description: 'Gorgeous CSS utility structures for building modular widgets.',
        tag: 'css',
        type: 'kit',
        clips: [
          {
            title: 'Bento Grid Tailwind Snippet',
            content: `<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">\n  <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl">Large Feature</div>\n  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">Metric</div>\n  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">Status</div>\n  <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl">Sub-panel</div>\n</div>`,
            type: 'code',
            tags: ['tailwind', 'css', 'bento']
          }
        ]
      }
    ];

    const templates = [
      {
        id: 'lib-tpl-1',
        title: 'Git Commit Formatter Template 📜',
        description: 'Auto-format active commits using Conventional Commits patterns.',
        type: 'template',
        clip: {
          title: 'Conventional Commit Guide',
          content: `feat(scope): add public library connection\nfix(sidebar): resolve overflow and crash behaviors\ndocs(api): document forceFail and error parameters\n\nBREAKING CHANGE: updated app properties in sidebarProps`,
          type: 'text',
          tags: ['git', 'automation']
        }
      },
      {
        id: 'lib-tpl-2',
        title: 'Weekly Standup Summary structure 🗓️',
        description: 'Ideal template for recording team deliverables, roadblocks, and next milestones.',
        type: 'template',
        clip: {
          title: 'Weekly Standup Template',
          content: `### 🗓️ Weekly Standup Summary\n\n**1. What did I achieve last week?**\n- Implemented public library module sidebar buttons\n- Designed graceful error handling overlay\n\n**2. What am I focusing on next?**\n- Writing tests for server routes\n- Hardening hydration caches\n\n**3. Are there any blockers?**\n- None at this moment.`,
          type: 'text',
          tags: ['productivity', 'standup']
        }
      }
    ];

    const macros = [
      {
        id: 'lib-macro-1',
        title: 'Clean JSON Stringifier Macro 🛠️',
        description: 'Quick script macro to parse any messy string into beautiful, readable JSON.',
        type: 'macro',
        clip: {
          title: 'Prettify JSON Macro',
          content: `function prettifyMessyJson(messyStr) {\n  try {\n    const obj = JSON.parse(messyStr);\n    return JSON.stringify(obj, null, 2);\n  } catch (err) {\n    return "Invalid JSON: " + err.message;\n  }\n}`,
          type: 'code',
          tags: ['automation', 'json', 'utility']
        }
      },
      {
        id: 'lib-macro-2',
        title: 'Regex Slugify Macro 🔗',
        description: 'Generate web-friendly URL slugs from arbitrary text titles.',
        type: 'macro',
        clip: {
          title: 'Slugify Title macro',
          content: `const slugify = (text: string) =>\n  text\n    .toString()\n    .toLowerCase()\n    .trim()\n    .replace(/\\s+/g, '-')\n    .replace(/[^\\w\\-]+/g, '')\n    .replace(/\\-\\-+/g, '-');`,
          type: 'code',
          tags: ['regex', 'url', 'utility']
        }
      }
    ];

    // Filter by query if supplied
    const filterFn = (item: any) => {
      if (!q) return true;
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const tagMatch = item.tag?.toLowerCase().includes(q);
      return titleMatch || descMatch || tagMatch;
    };

    const filteredKits = kits.filter(filterFn);
    const filteredTemplates = templates.filter(filterFn);
    const filteredMacros = macros.filter(filterFn);

    res.json({
      kits: filteredKits,
      templates: filteredTemplates,
      macros: filteredMacros,
      searchQuery: q,
      serverTime: new Date().toISOString()
    });
  });

  // Mount Vite middleware in development or static fallback in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
