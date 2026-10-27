import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useAuth } from '@/Hooks/useAuth';
import {
    TrendingUp, TrendingDown, Receipt, Package, AlertTriangle,
    ArrowRight, ShoppingCart, ChevronRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';

interface Props {
    stats: {
        omzet: number;
        transaksi: number;
        produk: number;
        stok_kritis: number;
        growth: number | null;
    };
    recentSales: any[];
    lowStockProducts: any[];
    salesTrend: { label: string; total_omzet: number }[];
    topProducts: { nama_produk: string; total_qty: string | number; total_revenue: number }[];
    paymentMethods: { metode_bayar: string; total_transaksi: number; total_revenue: number }[];
    filters: {
        period: string;
    };
}

const PAYMENT_COLORS: Record<string, string> = {
    tunai: '#22c55e',
    qris: '#3b82f6',
    transfer: '#a855f7',
};

const formatCompact = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.0', '')} jt`
        : n >= 1_000 ? `${Math.round(n / 1_000)} rb`
            : `${n}`;

const tooltipStyle = {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,.12)',
    fontSize: 12,
};

export default function Dashboard({
    stats, recentSales, lowStockProducts, salesTrend, topProducts, paymentMethods, filters
}: Props) {
    const { user } = useAuth();
    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);
    const activePeriod = filters?.period || 'today';
    const maxTopRevenue = Math.max(...topProducts.map(x => x.total_revenue), 1);

    const handleFilter = (period: string) => {
        router.get('/dashboard', { period }, { preserveState: true, preserveScroll: true });
    };

    const periodButton = (key: string, label: string) => (
        <button
            onClick={() => handleFilter(key)}
            className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activePeriod === key
                    ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
        >
            {label}
        </button>
    );

    return (
        <AdminLayout>
            <Head title="Dashboard - Sartika Motor" />

            <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Context Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-medium tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Toko Buka • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-gray-500 text-[11px] font-medium">Kasir: {user?.nama}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Ringkasan Penjualan
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Omzet, transaksi, dan stok toko dalam satu halaman.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* FILTER PERIODE */}
                        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 shadow-inner">
                            {periodButton('today', 'Hari Ini')}
                            {periodButton('7days', '7 Hari')}
                            {periodButton('month', 'Bulan Ini')}
                        </div>

                        <Link href="/pos" className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 text-sm font-semibold shadow-md transition-transform active:scale-95">
                            <ShoppingCart className="size-4" /> Transaksi Baru
                        </Link>
                    </div>
                </div>

                {/* Alert Banner */}
                {stats.stok_kritis > 0 && (
                    <div className="relative overflow-hidden rounded-xl bg-orange-50 dark:bg-[#2F2113] border border-orange-100 dark:border-orange-900/30 p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-start sm:items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-200 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="text-orange-600 dark:text-[#f5b800] size-5" />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.stok_kritis} produk stoknya menipis</span>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Stok sudah di bawah batas minimum. Segera lakukan restock.</p>
                                </div>
                            </div>
                            <Link href="/products" className="px-4 py-2 rounded-lg bg-white dark:bg-[#3F2B1A] text-gray-900 dark:text-[#f5b800] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-[#523822] transition-colors shrink-0 text-center">
                                Tinjau Detail
                            </Link>
                        </div>
                    </div>
                )}

                {/* METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    {/* Card 1: Omzet */}
                    <div className="relative rounded-xl p-5 bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#f5b800]"></div>
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Omzet Penjualan</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-sm text-gray-500 font-medium">Rp</span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatRupiah(stats.omzet)}</span>
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#2F2A1F] flex items-center justify-center text-[#f5b800]">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 flex items-center justify-between bg-gray-50 dark:bg-[#1D1B15]/70 -mx-5 -mb-5 px-5 py-3 border-t border-gray-100 dark:border-zinc-800/50">
                            {stats.growth === null ? (
                                <span className="text-xs text-gray-500">Belum ada pembanding periode lalu</span>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "flex items-center text-xs font-semibold",
                                        stats.growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        {stats.growth >= 0
                                            ? <TrendingUp className="size-4 mr-1" />
                                            : <TrendingDown className="size-4 mr-1" />}
                                        {stats.growth > 0 ? '+' : ''}{stats.growth}%
                                    </span>
                                    <span className="text-xs text-gray-500">vs periode lalu</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Transaksi */}
                    <div className="rounded-xl p-5 bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Struk Transaksi</span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.transaksi}</span>
                                    <span className="text-xs text-gray-500">Struk Selesai</span>
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#2A2720] flex items-center justify-center text-gray-400">
                                <Receipt className="size-5" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 flex items-center justify-between bg-gray-50 dark:bg-[#1D1B15]/70 -mx-5 -mb-5 px-5 py-3 border-t border-gray-100 dark:border-zinc-800/50">
                            <div>
                                <span className="text-xs text-gray-500">Rata-rata per transaksi</span>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    Rp {stats.transaksi > 0 ? formatRupiah(Math.round(stats.omzet / stats.transaksi)) : 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Katalog */}
                    <div className="rounded-xl p-5 bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Katalog Produk</span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.produk}</span>
                                    <span className="text-xs text-gray-500">SKU Aktif</span>
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#2A2720] flex items-center justify-center text-gray-400">
                                <Package className="size-5" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 flex items-center justify-between bg-gray-50 dark:bg-[#1D1B15]/70 -mx-5 -mb-5 px-5 py-3 border-t border-gray-100 dark:border-zinc-800/50">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-xs font-medium text-gray-900 dark:text-white">Siap Jual</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                                {stats.produk > 0
                                    ? `${(((stats.produk - stats.stok_kritis) / stats.produk) * 100).toFixed(1)}% Stok Aman`
                                    : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Stok Kritis */}
                    <div className="rounded-xl p-5 bg-red-50 dark:bg-[#2A1D17] border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Stok Kritis</span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.stok_kritis}</span>
                                    <span className="text-xs text-red-500 dark:text-red-300">SKU di batas minimum</span>
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-[#45271D] flex items-center justify-center text-red-600 dark:text-red-400">
                                <AlertTriangle className="size-5" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 flex items-center justify-between bg-white/50 dark:bg-[#1E1410]/70 -mx-5 -mb-5 px-5 py-3 border-t border-red-100 dark:border-red-900/20">
                            <span className="text-[11px] font-medium text-red-700 dark:text-red-300">Segera lakukan restock</span>
                            <Link href="/products" className="text-xs font-bold text-red-600 dark:text-[#f5b800] hover:underline flex items-center gap-1">
                                Lihat Produk <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* GRAFIK: Tren + Metode Pembayaran */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Tren Penjualan */}
                    <div className="xl:col-span-2 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Tren Penjualan</h2>
                        <p className="text-xs text-gray-500 mt-1 mb-4">
                            {activePeriod === 'today' ? 'Omzet per jam hari ini' : 'Omzet harian pada periode terpilih'}
                        </p>
                        <div className="h-72">
                            {salesTrend.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                    Belum ada data penjualan.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="omzetFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f5b800" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#f5b800" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af33" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                                        <Tooltip
                                            formatter={(v) => [`Rp ${formatRupiah(Number(v))}`, 'Omzet']}
                                            contentStyle={tooltipStyle}
                                        />
                                        <Area type="monotone" dataKey="total_omzet" stroke="#f5b800" strokeWidth={2.5} fill="url(#omzetFill)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Metode Pembayaran */}
                    <div className="rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Metode Pembayaran</h2>
                        <p className="text-xs text-gray-500 mt-1 mb-2">Porsi pendapatan per metode.</p>
                        {paymentMethods.length === 0 ? (
                            <div className="h-60 flex items-center justify-center text-sm text-gray-400">Belum ada data.</div>
                        ) : (
                            <>
                                <div className="h-44">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paymentMethods}
                                                dataKey="total_revenue"
                                                nameKey="metode_bayar"
                                                innerRadius={50}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                stroke="none"
                                            >
                                                {paymentMethods.map((m, i) => (
                                                    <Cell key={i} fill={PAYMENT_COLORS[m.metode_bayar] ?? '#9ca3af'} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(v) => `Rp ${formatRupiah(Number(v))}`}
                                                contentStyle={tooltipStyle}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-2">
                                    {paymentMethods.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 capitalize text-gray-700 dark:text-gray-300">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PAYMENT_COLORS[m.metode_bayar] ?? '#9ca3af' }} />
                                                {m.metode_bayar}
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">Rp {formatRupiah(m.total_revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Produk Terlaris */}
                <div className="rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Produk Terlaris</h2>
                            <p className="text-xs text-gray-500 mt-1">Berdasarkan pendapatan pada periode terpilih.</p>
                        </div>
                        {user?.role === 'admin' && (
                            <Link href="/reports" className="text-xs font-semibold text-[#f5b800] hover:underline flex items-center gap-1">
                                Lihat Laporan <ChevronRight className="size-4" />
                            </Link>
                        )}
                    </div>

                    {topProducts.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-400">Belum ada produk terjual.</div>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((p, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between gap-4 mb-1.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-6 h-6 shrink-0 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.nama_produk}</span>
                                            <span className="text-xs text-gray-500 shrink-0">{Number(p.total_qty)} terjual</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">
                                            Rp {formatRupiah(p.total_revenue)}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800">
                                        <div
                                            className="h-2 rounded-full bg-[#f5b800] transition-all duration-500"
                                            style={{ width: `${(p.total_revenue / maxTopRevenue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2 KOLOM BAWAH: Transaksi & Restock */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Transaksi Terakhir */}
                    <div className="rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#f5b800]"></span> 5 Transaksi Terakhir
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Pembaruan langsung dari kasir.</p>
                            </div>
                            {user?.role === 'admin' && (
                                <Link href="/sales" className="text-xs font-semibold text-[#f5b800] hover:underline flex items-center gap-1">
                                    Lihat Semua <ChevronRight className="size-4" />
                                </Link>
                            )}
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                                    <tr>
                                        <th className="py-3 px-5 font-semibold">No. Struk</th>
                                        <th className="py-3 px-5 font-semibold">Metode</th>
                                        <th className="py-3 px-5 text-right font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                    {recentSales.length === 0 ? (
                                        <tr><td colSpan={3} className="p-6 text-center text-gray-500">Belum ada transaksi pada periode ini.</td></tr>
                                    ) : (
                                        recentSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                                <td className="py-3 px-5">
                                                    <div className="font-mono text-xs font-semibold text-[#f5b800]">{sale.no_transaksi}</div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5">{sale.kasir?.nama}</div>
                                                </td>
                                                <td className="py-3 px-5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium capitalize ${sale.metode_bayar === 'tunai' ? 'bg-gray-100 text-gray-700 dark:bg-[#2D2A22] dark:text-gray-300' :
                                                        sale.metode_bayar === 'qris' ? 'bg-blue-50 text-blue-700 dark:bg-[#322C1A] dark:text-[#f5b800]' :
                                                            'bg-purple-50 text-purple-700 dark:bg-[#272D32] dark:text-blue-300'
                                                        }`}>
                                                        {sale.metode_bayar}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-right font-semibold text-gray-900 dark:text-white">
                                                    Rp {formatRupiah(sale.total)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Produk Perlu Restock */}
                    <div className="rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <AlertTriangle className="size-5 text-red-500" /> Perlu Restock
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Produk yang stoknya mencapai batas minimum.</p>
                            </div>
                            {user?.role === 'admin' && (
                                <Link href="/stock-in" className="text-xs font-semibold text-[#f5b800] hover:underline flex items-center gap-1">
                                    Stok Masuk <ChevronRight className="size-4" />
                                </Link>
                            )}
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                                    <tr>
                                        <th className="py-3 px-5 font-semibold">Produk</th>
                                        <th className="py-3 px-5 text-center font-semibold">Sisa</th>
                                        <th className="py-3 px-5 text-center font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                    {lowStockProducts.length === 0 ? (
                                        <tr><td colSpan={3} className="p-6 text-center text-gray-500">Semua stok aman.</td></tr>
                                    ) : (
                                        lowStockProducts.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                                <td className="py-3 px-5">
                                                    <div className="font-medium text-gray-900 dark:text-white line-clamp-1">{p.nama}</div>
                                                    {p.kode_barang && (
                                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{p.kode_barang}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <div className="font-bold text-red-600 dark:text-red-400">{Number(p.stok)}</div>
                                                    <div className="text-[10px] text-gray-500">min {Number(p.stok_minimum)}</div>
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${Number(p.stok) === 0 ? 'bg-red-100 text-red-700 dark:bg-[#5A2C1C] dark:text-red-300' :
                                                        'bg-orange-100 text-orange-700 dark:bg-[#3B2C14] dark:text-[#f5b800]'
                                                        }`}>
                                                        {Number(p.stok) === 0 ? 'HABIS' : 'MENIPIS'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </div>
        </AdminLayout>
    );
}