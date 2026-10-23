import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import { toast, Toaster } from 'sonner';

const appName = import.meta.env.VITE_APP_NAME || 'Sparepart POS';

// Listener global untuk menangkap flash message dari backend
router.on('success', (event) => {
    const flash = event.detail.page.props.flash as any;

    if (flash) {
        if (flash.success) {
            toast.success(flash.success);
            flash.success = null; // Bersihkan agar tidak muncul lagi saat pindah halaman
        }
        if (flash.error) {
            toast.error(flash.error);
            flash.error = null; // Bersihkan agar tidak muncul lagi saat pindah halaman
        }
    }
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx');
        const page = resolvePageComponent(`./Pages/${name}.tsx`, pages);
        return page as Promise<React.ComponentType>;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
                {/* Toaster diletakkan di root level, di luar App, agar tidak ter-unmount saat pindah halaman */}
                <Toaster position="top-right" richColors closeButton />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});