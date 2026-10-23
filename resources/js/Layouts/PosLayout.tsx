import { ReactNode, useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { LogOut, Home, Sun, Moon, Lock, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/Hooks/useAuth';
import { useTheme } from '@/Hooks/useTheme';
import { Button } from '@/Components/ui/button';
import { toast } from 'sonner';

interface Props {
    children: ReactNode;
}

export default function PosLayout({ children }: Props) {
    const { user, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { auth } = usePage().props as any;
    const activeShift = auth?.active_shift;

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    const handleLogoutClick = () => {
        // CEGAH LOGOUT JIKA SHIFT MASIH AKTIF
        if (activeShift) {
            toast.error('Gagal Logout', {
                description: 'Anda harus menutup shift terlebih dahulu sebelum keluar.'
            });
            return;
        }
        setShowLogoutModal(true);
    };

    const executeLogout = () => {
        setIsLoggingOut(true);
        router.post('/logout', {}, {
            onFinish: () => {
                setIsLoggingOut(false);
                setShowLogoutModal(false);
            }
        });
    };

    return (
        <div className="flex h-screen flex-col bg-gray-100 dark:bg-zinc-900 transition-colors">
            {/* Topbar POS */}
            <header className="flex h-12 shrink-0 items-center justify-between border-b bg-white px-4 dark:bg-zinc-950 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-lg text-primary dark:text-primary">POS Sartika Motor</h1>
                    {activeShift && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">
                            Shift Aktif (Modal: Rp {formatRupiah(Number(activeShift.modal_awal))})
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium dark:text-zinc-300">
                        Kasir: <strong>{user?.nama}</strong>
                    </span>

                    <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle Tema">
                        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </Button>

                    {isAdmin && (
                        <Link href="/dashboard">
                            <Button variant="outline" size="sm" className="h-8">
                                <Home className="size-4 mr-2" /> Dashboard
                            </Button>
                        </Link>
                    )}

                    {/* Tombol Logout (Disabled jika shift aktif) */}
                    <Button
                        variant={activeShift ? "secondary" : "destructive"}
                        size="sm"
                        onClick={handleLogoutClick}
                        className={`h-8 ${activeShift ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={activeShift ? "Tutup shift untuk logout" : "Logout"}
                    >
                        {activeShift ? <Lock className="size-4 mr-2" /> : <LogOut className="size-4 mr-2" />} Logout
                    </Button>
                </div>
            </header>

            {/* Area Konten POS */}
            <main className="flex flex-1 overflow-hidden">
                {children}
            </main>

            {/* MODAL KONFIRMASI LOGOUT */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in transition-all"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowLogoutModal(false);
                    }}
                >
                    <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">

                        {/* Top Icon & Close */}
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                <LogOut className="size-6" />
                            </div>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Title & Desc */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Akhiri Sesi Kasir?
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Apakah Anda yakin ingin keluar dari sistem POS? Anda diharuskan login kembali untuk memulai sesi baru.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-zinc-800">
                            <AlertTriangle className="size-5 text-orange-500 shrink-0" />
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Pastikan tidak ada transaksi yang sedang tertunda di keranjang belanja.
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowLogoutModal(false)}
                                disabled={isLoggingOut}
                                className="flex-1 h-11 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={executeLogout}
                                disabled={isLoggingOut}
                                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all"
                            >
                                {isLoggingOut ? 'Memproses...' : 'Ya, Keluar'}
                            </Button>
                        </div>

                        {/* Shortcuts */}
                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-mono">Esc</kbd> Batal
                            <span>•</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-mono">Enter</kbd> Konfirmasi
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}