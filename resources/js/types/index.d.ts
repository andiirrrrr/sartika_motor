export interface User {
    id: number;
    nama: string;
    username: string;
    email?: string | null;
    role: 'admin' | 'kasir';
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    flash: {
        success: string | null;
        error: string | null;
    };
};