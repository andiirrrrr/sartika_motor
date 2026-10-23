import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export function useAuth() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    return {
        user,
        isAdmin: user?.role === 'admin',
        isKasir: user?.role === 'kasir',
        isAuthenticated: user !== null,
    };
}