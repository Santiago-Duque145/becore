import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AvatarPreviewProvider } from './contexts/AvatarPreviewContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './components/ui/index.js';
import { queryClient } from './lib/query-client.js';
import { prefetchInitialRoute } from './lib/startup-prefetch.js';
import { router } from './router.jsx';
import { registerServiceWorker } from './lib/register-sw.js';
import './index.css';

// Antes de pintar: si se entra directo a Descubre con sesión guardada, sus datos se piden ya, en paralelo con GET /me
prefetchInitialRoute(window.location);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AvatarPreviewProvider>
            <RouterProvider router={router} />
          </AvatarPreviewProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);

registerServiceWorker();
