import { ReactNode, useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Package, Tags, Truck, ArrowDownToLine,
    ArrowUpFromLine, ShoppingCart, Receipt, BarChart3,
    Clock, Users, Settings, LogOut, Sun, Moon, Store,
    Search, Bell, X, AlertTriangle, CreditCard, ChevronDown, Menu
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel
} from '@/Components/ui/dropdown-menu';
import { useAuth } from '@/Hooks/useAuth';
import { useTheme } from '@/Hooks/useTheme';
import { toast } from 'sonner';

interface Props {
    children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { auth, low_stock_count } = usePage().props as any;
    const activeShift = auth?.active_shift;

    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        }
        return false;
    });

    // Mobile drawer state
    const [mobileOpen, setMobileOpen] = useState(false);

    // Auto close mobile drawer on route navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [window.location.pathname]);

    // State Pencarian & Modal Logout
    const [globalSearch, setGlobalSearch] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const toggleSidebar = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('sidebar_collapsed', String(nextState));
    };

    // Fungsi Pencarian (Tekan Enter)
    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && globalSearch.trim() !== '') {
            router.get('/products', { search: globalSearch.trim() });
            setGlobalSearch(''); // Kosongkan setelah mencari
        }
    };

    const handleLogoutClick = () => {
        if (activeShift) {
            toast.error('Gagal Logout', { description: 'Tutup shift POS terlebih dahulu.' });
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

    // Menu Items
    const menuItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Produk', href: '/products', icon: Package, adminOnly: true },
        { label: 'Kategori', href: '/categories', icon: Tags, adminOnly: true },
        { label: 'Supplier', href: '/suppliers', icon: Truck, adminOnly: true },
        { label: 'Stok Masuk', href: '/stock-in', icon: ArrowDownToLine, adminOnly: true },
        { label: 'Stok Keluar', href: '/stock-out', icon: ArrowUpFromLine, adminOnly: true },
        { label: 'Riwayat Transaksi', href: '/sales', icon: Receipt, adminOnly: true },
        { label: 'Laporan', href: '/reports', icon: BarChart3, adminOnly: true },
        { label: 'Riwayat Shift', href: '/shifts', icon: Clock, adminOnly: true },
    ];

    const configItems = [
        { label: 'Metode Pembayaran', href: '/payment-methods', icon: CreditCard, adminOnly: true },
        { label: 'Manajemen User', href: '/users', icon: Users, adminOnly: true },
        { label: 'Pengaturan', href: '/settings', icon: Settings, adminOnly: true },
    ];

    return (
        <div className="flex min-h-screen w-full bg-[#f9f9f6] dark:bg-zinc-950 transition-colors">
            {/* MOBILE BACKDROP */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 z-50 flex flex-col shadow-sm transition-all duration-300 ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
                    {(!isCollapsed || mobileOpen) && (
                        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden" onClick={() => setMobileOpen(false)}>
                            <span className="w-2.5 h-2.5 rounded-full bg-[#f5b800] inline-block shrink-0"></span>
                            <span className="font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Sartika Motor<span className="text-[#f5b800] font-normal"> POS</span>
                            </span>
                        </Link>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleSidebar}
                            className="hidden md:inline-flex text-gray-500 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg transition-colors"
                            title={isCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
                        >
                            {isCollapsed ? <LayoutDashboard className="size-5" /> : <ArrowDownToLine className="size-5 rotate-90" />}
                        </button>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors"
                            title="Tutup Menu"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {(!isCollapsed || mobileOpen) && <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Navigasi Retail</div>}
                    {menuItems.filter(i => !i.adminOnly || user?.role === 'admin').map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            title={isCollapsed ? item.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${window.location.pathname.startsWith(item.href)
                                ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-500/25'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                                } ${isCollapsed && !mobileOpen ? 'md:justify-center' : ''}`}
                        >
                            <item.icon className="size-5 shrink-0" />
                            {(!isCollapsed || mobileOpen) && <span className="text-sm">{item.label}</span>}
                        </Link>
                    ))}

                    {(!isCollapsed || mobileOpen) && <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mt-6 mb-2">Konfigurasi</div>}
                    {configItems.filter(i => !i.adminOnly || user?.role === 'admin').map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            title={isCollapsed ? item.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${window.location.pathname.startsWith(item.href)
                                ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-500/25'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                                } ${isCollapsed && !mobileOpen ? 'md:justify-center' : ''}`}
                        >
                            <item.icon className="size-5 shrink-0" />
                            {(!isCollapsed || mobileOpen) && <span className="text-sm">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {(!isCollapsed || mobileOpen) && (
                    <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-[#f5b800] animate-pulse"></span>
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status Sistem</span>
                            </div>
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{user?.nama}</div>
                            <div className="text-xs text-gray-500">{activeShift ? 'Shift POS Sedang Aktif' : 'Siap Bekerja'}</div>
                        </div>
                    </div>
                )}
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} pl-0`}>
                {/* HEADER */}
                <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 w-full shrink-0">
                    <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Buka Menu"
                        >
                            <Menu className="size-5" />
                        </button>
                        <Store className="size-4 shrink-0 hidden sm:block" />
                        <span className="hidden sm:inline truncate">Toko Utama</span>
                        <span className="text-gray-300 hidden sm:inline">/</span>
                        <span className="font-semibold text-gray-900 dark:text-white truncate">Sartika Motor</span>
                    </div>

                    {/* SEARCH BAR YANG BERFUNGSI */}
                    <div className="flex-1 max-w-md mx-6 hidden xl:block">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 text-gray-400 size-4" />
                            <input
                                type="text"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder="Cari produk atau SKU... (Tekan Enter)"
                                className="w-full h-9 pl-9 pr-4 rounded-xl bg-gray-100 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5b800] transition-all text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link href="/pos" className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-xl bg-[#f5b800] text-gray-900 text-sm font-medium hover:bg-[#e0a800] transition-colors">
                            <ShoppingCart className="size-4" /> Buka POS
                        </Link>
                        <button onClick={toggleTheme} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
                        </button>

                        {/* NOTIFIKASI YANG BERFUNGSI */}
                        <Link
                            href="/reports"
                            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Cek Laporan Stok Menipis"
                        >
                            <Bell className="size-5" />
                            {low_stock_count > 0 && (
                                <span className="absolute top-2 right-2 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border-2 border-white dark:border-zinc-900"></span>
                                </span>
                            )}
                        </Link>

                        <div className="pl-2 border-l border-gray-200 dark:border-zinc-700">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-zinc-700/80 hover:bg-gray-100/70 dark:hover:bg-zinc-800/60 transition-all cursor-pointer">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-[#f5b800] text-gray-950 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                            {user?.nama.charAt(0)}
                                        </div>
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${activeShift ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                    </div>
                                    <div className="hidden xl:block text-left">
                                        <div className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                                            {user?.nama}
                                        </div>
                                        <div className="text-[10px] text-gray-500 uppercase leading-tight font-medium tracking-wide">
                                            {user?.role}
                                        </div>
                                    </div>
                                    <ChevronDown className="size-3.5 text-gray-400 ml-0.5 transition-transform" />
                                </DropdownMenuTrigger>

                                <DropdownMenuContent width="w-64" align="end" className="p-2">
                                    <div className="p-2.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl mb-1.5 border border-gray-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <div className="w-9 h-9 rounded-full bg-[#f5b800] text-gray-950 flex items-center justify-center font-bold text-sm">
                                                {user?.nama.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.nama}</div>
                                                <div className="text-[10px] text-gray-500 truncate">@{user?.username}</div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f5b800]/20 text-amber-800 dark:text-[#f5b800] uppercase">
                                                {user?.role}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-gray-500">
                                            <span className={`w-2 h-2 rounded-full ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                            <span>{activeShift ? 'Shift POS Sedang Berjalan' : 'Belum Ada Shift Kasir'}</span>
                                        </div>
                                    </div>

                                    <DropdownMenuLabel>Menu Cepat</DropdownMenuLabel>
                                    <DropdownMenuItem icon={ShoppingCart} onClick={() => router.visit('/pos')}>
                                        Buka Kasir POS
                                    </DropdownMenuItem>
                                    <DropdownMenuItem icon={LayoutDashboard} onClick={() => router.visit('/dashboard')}>
                                        Dashboard Utama
                                    </DropdownMenuItem>
                                    {user?.role === 'admin' && (
                                        <DropdownMenuItem icon={Settings} onClick={() => router.visit('/settings')}>
                                            Pengaturan Sistem
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        icon={theme === 'dark' ? Sun : Moon}
                                        onClick={toggleTheme}
                                    >
                                        <span>Mode Tampilan</span>
                                        <span className="ml-auto text-[10px] uppercase font-bold text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800">
                                            {theme === 'dark' ? 'Gelap' : 'Terang'}
                                        </span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        destructive
                                        icon={LogOut}
                                        onClick={handleLogoutClick}
                                    >
                                        Akhiri Sesi (Logout)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="flex-1 min-w-0 w-full py-6 px-4 sm:px-6">
                    {children}
                </main>
            </div>

            {/* MODAL KONFIRMASI LOGOUT */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in transition-all"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowLogoutModal(false);
                    }}
                >
                    <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                <LogOut className="size-6" />
                            </div>
                            <button onClick={() => setShowLogoutModal(false)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors">
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Akhiri Sesi Login?
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Apakah Anda yakin ingin keluar dari sistem? Anda harus memasukkan username dan password kembali untuk masuk.
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-zinc-800">
                            <AlertTriangle className="size-5 text-orange-500 shrink-0" />
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Pastikan semua pekerjaan Anda (seperti input produk) sudah tersimpan.
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowLogoutModal(false)} disabled={isLoggingOut} className="flex-1 h-11 rounded-xl">
                                Batal
                            </Button>
                            <Button onClick={executeLogout} disabled={isLoggingOut} className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all">
                                {isLoggingOut ? 'Memproses...' : 'Ya, Logout'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}