import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { getAuthToken, TRPCProvider } from './utils/trpc';
import type { AppRouter } from '@territorio/api';
import superjson from 'superjson';
import { Toaster } from './components/ui/sonner';
import { AppRoutes } from './routes';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/trpc';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, 
        retry: 1,
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function App() {

  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: API_URL,
          transformer: superjson,
          async headers() {
            const token = getAuthToken();
            return {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
          }
        }),
      ],
    }),
  );
  
  return (
    <main className='w-screen h-screen bg-background text-foreground'>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="territorio-ui-theme">
            <BrowserRouter>
              <AppRoutes />
              <Toaster />
            </BrowserRouter>
          </ThemeProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </main>
  );
}