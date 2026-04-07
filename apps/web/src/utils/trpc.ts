import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@territorio/api';

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

export function getAuthToken() {
    return localStorage.getItem('territorio-token');
}