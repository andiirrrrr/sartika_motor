import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDotNumber(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '') return '';
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(Number(clean));
}

export function parseRawNumber(val: string | number | null | undefined): number {
    if (!val) return 0;
    const clean = String(val).replace(/\D/g, '');
    return clean ? Number(clean) : 0;
}
