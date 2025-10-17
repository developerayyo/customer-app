import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // https: true,
    host: true,
    proxy: {
      '/api': {
        target: 'https://erp.lordsminttech.com.ng',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add API key authentication for token-based auth
            const apiKey = process.env.VITE_API_KEY;
            const apiSecret = process.env.VITE_API_SECRET;
            
            if (apiKey && apiSecret) {
              proxyReq.setHeader('Authorization', `token ${apiKey}:${apiSecret}`);
            }
            
            // Remove any problematic headers
            proxyReq.removeHeader('Expect');
          });
        }
      }
    }
  }
})
