import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@territorio/api';

export const trpc = createTRPCReact<AppRouter>();

export function getAuthToken() {
    return localStorage.getItem('territorio-token');
}