import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        rollupFormat: 'iife'
      },
      manifest: false,
      devOptions: { enabled: false }
    })
  ],
  server: {
    // https: true,
    host: true,
    proxy: {
      '/api': {
        target: 'https://erp.lordsminttech.com.ng',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
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
