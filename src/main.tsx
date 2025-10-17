import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Workbox } from 'workbox-window';

// Register service worker only in production to avoid dev MIME type errors
if (import.meta.env.MODE === 'production' && 'serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js');

  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      if (confirm('New app update is available! Click OK to refresh.')) {
        window.location.reload();
      }
    }
  });

  wb.register().catch((error) => {
    console.error('Service worker registration failed:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
