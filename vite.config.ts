import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nexusDevProxyPlugin } from './server/devProxyPlugin.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (env.MISTRAL_API_KEY) process.env.MISTRAL_API_KEY = env.MISTRAL_API_KEY;
  if (env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY;

  return {
    plugins: [react(), tailwindcss(), nexusDevProxyPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 5173,
      strictPort: false,
    },
  };
});
