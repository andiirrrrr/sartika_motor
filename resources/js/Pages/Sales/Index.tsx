import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import {
    Plus, Search, Receipt, TrendingUp,
    Wallet, ShoppingCart, FileText, Eye
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
    sales: {
        data: any[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: {
        from: string;
        to: string;
        search: string;
    };
    stats: {
        omzet: number;
        transaksi: number;
        aov: number;
    };
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

// Helper untuk format tanggal ke YYYY-MM-DD berdasarkan waktu lokal (bukan UTC)
const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Index({ sales, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilter = (overrides: Record<string, unknown> = {}) => {
        router.get('/sales', {
            search,
            from,
            to,
            ...overrides
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter({ search });
    };

    // Helper untuk mendapatkan tanggal preset
    const getPresetDates = (preset: 'today' | '7days' | 'month') => {
        const today = new Date();
        let start = new Date();

        if (preset === '7days') {
            start.setDate(today.getDate() - 7);
        } else if (preset === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        return {
            from: formatLocalDate(start),
            to: formatLocalDate(today)
        };
    };

    // Fungsi untuk mengecek apakah tombol preset sedang aktif
    const isPresetActive = (preset: 'today' | '7days' | 'month') => {
        const dates = getPresetDates(preset);
        return from === dates.from && to === dates.to;
    };

    const setDatePreset = (preset: 'today' | '7days' | 'month') => {
        const dates = getPresetDates(preset);
        setFrom(dates.from);
        setTo(dates.to);
        router.get('/sales', { from: dates.from, to: dates.to, search }, { preserveState: true, replace: true });
    };

    const getMetodeIcon = (metode: string) => {
        switch (metode) {
            case 'tunai': return <Wallet className="size-4 text-green-600" />;
            case 'qris': return <ShoppingCart className="size-4 text-blue-600" />;
            case 'transfer': return <TrendingUp className="size-4 text-purple-600" />;
            default: return <Receipt className="size-4" />;
        }
    };

    return (
        <AdminLayout>
            <Head title="Riwayat Transaksi" />

            <div className="max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header Context */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-white dark:bg-[#232019] p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span>Laporan & Kasir</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white">Riwayat Transaksi</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Riwayat Transaksi POS
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5b800]/20 text-[#f5b800] text-xs font-bold shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-[#f5b800] animate-pulse"></span>
                                {stats.transaksi} Transaksi Selesai
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href="/pos" className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 text-sm font-bold shadow-sm flex items-center gap-2 transition-transform active:scale-95">
                            <Plus className="size-5" /> Transaksi Baru
                        </Link>
                    </div>
                </div>

                {/* Metrik Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Omzet Kotor</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Rp {formatRupiah(stats.omzet)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Struk / Faktur</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.transaksi} Struk</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                <Receipt className="size-5" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rata-rata (AOV)</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Rp {formatRupiah(stats.aov)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                <ShoppingCart className="size-5" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden p-5 rounded-xl bg-[#f5b800]/10 border border-[#f5b800]/30 shadow-sm flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-[#f5b800] uppercase tracking-wider">Status Sistem</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">Sinkron & Aman</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-[#f5b800]">
                                <Wallet className="size-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Console */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">

                    {/* Preset Tanggal */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mr-2">Preset:</span>

                            {/* Tombol Hari Ini */}
                            <button
                                onClick={() => setDatePreset('today')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs transition-colors",
                                    isPresetActive('today')
                                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold shadow-sm"
                                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 font-medium"
                                )}
                            >
                                Hari Ini
                            </button>

                            {/* Tombol 7 Hari */}
                            <button
                                onClick={() => setDatePreset('7days')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs transition-colors",
                                    isPresetActive('7days')
                                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold shadow-sm"
                                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 font-medium"
                                )}
                            >
                                7 Hari Terakhir
                            </button>

                            {/* Tombol Bulan Ini */}
                            <button
                                onClick={() => setDatePreset('month')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs transition-colors",
                                    isPresetActive('month')
                                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold shadow-sm"
                                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 font-medium"
                                )}
                            >
                                Bulan Ini
                            </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Dari:</span>
                                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-[#f5b800]" />
                            </div>
                            <span className="text-gray-400">—</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Sampai:</span>
                                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-[#f5b800]" />
                            </div>
                            <button onClick={() => applyFilter({ from, to })} className="h-9 px-4 rounded-lg bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-white text-xs font-semibold hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors">
                                Terapkan
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari No. Struk atau Nama Kasir..."
                                className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                            />
                        </div>
                        <Button type="submit" className="h-10 bg-gray-900 text-white dark:bg-white dark:text-gray-900">Cari</Button>
                    </form>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-250">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                    <th className="py-3 px-4 font-semibold text-center w-12">
                                        <input type="checkbox" className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer" />
                                    </th>
                                    <th className="py-3 px-4 font-semibold">No. Struk</th>
                                    <th className="py-3 px-4 font-semibold">Waktu Transaksi</th>
                                    <th className="py-3 px-4 font-semibold">Kasir</th>
                                    <th className="py-3 px-4 font-semibold">Metode Bayar</th>
                                    <th className="py-3 px-4 text-center font-semibold">Jml Item</th>
                                    <th className="py-3 px-4 text-right font-semibold">Total Belanja</th>
                                    <th className="py-3 px-4 text-center font-semibold">Status</th>
                                    <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                {sales.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-gray-500">Tidak ada transaksi pada periode ini.</td>
                                    </tr>
                                ) : (
                                    sales.data.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors group">
                                            <td className="py-3 px-4 text-center">
                                                <input type="checkbox" className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer" />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-mono font-bold text-[#f5b800] text-sm">{sale.no_transaksi}</div>
                                                <div className="text-[10px] text-gray-500">Pelanggan Umum</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {new Date(sale.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    {new Date(sale.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{sale.kasir?.nama}</div>
                                                <div className="text-[10px] text-gray-500">POS Register</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-medium capitalize">
                                                    {getMetodeIcon(sale.metode_bayar)} {sale.metode_bayar}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {sale.items_count} item
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                                                Rp {formatRupiah(sale.total)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Lunas
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/sales/${sale.id}`} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-[#f5b800]/20 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors">
                                                        <Eye className="size-3.5" /> Struk
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sales.links.length > 3 && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm text-gray-500">
                                Menampilkan <strong>{sales.from ?? 0}</strong> - <strong>{sales.to ?? 0}</strong> dari <strong>{sales.total}</strong> transaksi
                            </span>
                            <Pagination links={sales.links} />
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="size-4 text-[#f5b800]" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Semua Transaksi Terenkripsi Aman</p>
                            <p className="text-xs text-gray-500">Data tersimpan otomatis ke database pusat.</p>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}