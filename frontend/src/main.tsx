import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import { queryClient } from './lib/queryClient';
import { supabase } from './lib/supabaseClient';
import { useAuthStore } from './store/useAuthStore';
import './i18n/index';
import './index.css';

// Hydrate session from localStorage on page load
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
});

// Keep Zustand in sync when Supabase auth state changes (login / logout / token refresh)
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
