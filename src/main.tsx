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

// Handle files opened via OS (file_handlers) when supported
if ('launchQueue' in window) {
  (window as any).launchQueue.setConsumer(async (launchParams: any) => {
    const fileHandles: any[] = launchParams.files || [];
    if (fileHandles.length > 0) {
      // Persist info for the OpenFile page to consume
      const payload = { count: fileHandles.length };
      try {
        sessionStorage.setItem('open-file-payload', JSON.stringify(payload));
      } catch {}
      // Navigate to OpenFile route
      window.location.href = '/open-file';
    }
  });
}

// Register periodic background sync if supported
if ('serviceWorker' in navigator && 'periodicSync' in (navigator as any)) {
  (async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const status = await (navigator as any).permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await (reg as any).periodicSync.register('dashboard-sync', { minInterval: 12 * 60 * 60 * 1000 });
      }
    } catch (e) {
      console.warn('Periodic sync registration failed:', e);
    }
  })();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
