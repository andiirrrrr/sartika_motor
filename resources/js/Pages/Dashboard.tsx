import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useAuth } from '@/Hooks/useAuth';
import {
    TrendingUp, Receipt, Package, AlertTriangle,
    ArrowRight, ShoppingCart, Download, ChevronRight,
    Printer, CloudSync, MapPin
} from 'lucide-react';

interface Props {
    stats: {
        omzet: number;
        transaksi: number;
        produk: number;
        stok_kritis: number;
    };
    recentSales: any[];
    lowStockProducts: any[];
}

export default function Dashboard({ stats, recentSales, lowStockProducts }: Props) {
    const { user } = useAuth();
    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    return (
        <AdminLayout>
            <Head title="Dashboard - Sartika Motor" />

            <div className="space-y-6 max-w-7xl mx-auto">

                {/* Context Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-medium tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Toko Buka • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-gray-500 text-[11px] font-medium">POS Register 01 • Kasir: {user?.nama}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Ringkasan Bisnis & Penjualan
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Pemantauan arus kas ritel, stok kritis, dan transaksi langsung secara terpadu.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 shadow-inner">
                            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm transition-all">Hari Ini</button>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all">7 Hari</button>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all">Bulan Ini</button>
                        </div>
                        <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm">
                            <Download className="size-4" /> <span className="hidden sm:inline">Unduh Laporan</span>
                        </button>
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Peringatan Inventaris: {stats.stok_kritis} Item Menipis</span>
                                        <span className="px-2 py-0.5 rounded-full bg-orange-200 dark:bg-[#f5b800]/20 text-orange-800 dark:text-[#f5b800] text-[10px] font-bold">Prioritas Restock</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Beberapa SKU telah berada di bawah batas minimum safety stock.</p>
                                </div>
                            </div>
                            <Link href="/products" className="px-4 py-2 rounded-lg bg-white dark:bg-[#3F2B1A] text-gray-900 dark:text-[#f5b800] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-[#523822] transition-colors shrink-0 text-center">
                                Tinjau Detail
                            </Link>
                        </div>
                    </div>
                )}

                {/* METRICS GRID (BENTO STYLE) */}
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
                            <div className="flex items-center gap-1.5">
                                <span className="flex items-center text-xs font-semibold text-green-600 dark:text-green-400">
                                    <TrendingUp className="size-4 mr-1" /> +12.4%
                                </span>
                                <span className="text-xs text-gray-500">vs kemarin</span>
                            </div>
                            {/* Simulasi Sparkline */}
                            <svg className="w-16 h-6 text-[#f5b800]" fill="none" viewBox="0 0 80 24">
                                <path d="M0 18 L15 14 L30 19 L45 8 L60 11 L75 3 L80 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                            </svg>
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
                                <span className="text-xs text-gray-500">Rata-rata (AOV)</span>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    Rp {stats.transaksi > 0 ? formatRupiah(stats.omzet / stats.transaksi) : 0}
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-[#2D2A22] text-[10px] font-semibold text-gray-600 dark:text-gray-400">Normal</span>
                        </div>
                    </div>

                    {/* Card 3: Produk Terjual */}
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
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400">98.2% Tersedia</span>
                        </div>
                    </div>

                    {/* Card 4: Stok Kritis */}
                    <div className="rounded-xl p-5 bg-red-50 dark:bg-[#2A1D17] border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Stok Kritis</span>
                                    <span className="px-1.5 py-0.5 rounded bg-red-200 dark:bg-[#5A2C1C] text-[9px] font-bold text-red-700 dark:text-red-200">Tindakan</span>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.stok_kritis}</span>
                                    <span className="text-xs text-red-500 dark:text-red-300">SKU Batas Aman</span>
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-[#45271D] flex items-center justify-center text-red-600 dark:text-red-400">
                                <AlertTriangle className="size-5" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 flex items-center justify-between bg-white/50 dark:bg-[#1E1410]/70 -mx-5 -mb-5 px-5 py-3 border-t border-red-100 dark:border-red-900/20">
                            <span className="text-[11px] font-medium text-red-700 dark:text-red-300">Segera Lakukan Restock</span>
                            <Link href="/products" className="text-xs font-bold text-red-600 dark:text-[#f5b800] hover:underline flex items-center gap-1">
                                Lihat Produk <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    </div>
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
                            <Link href="/sales" className="text-xs font-semibold text-[#f5b800] hover:underline flex items-center gap-1">
                                Lihat Semua <ChevronRight className="size-4" />
                            </Link>
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
                                        <tr><td colSpan={3} className="p-6 text-center text-gray-500">Belum ada transaksi.</td></tr>
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
                                    <AlertTriangle className="size-5 text-red-500" /> Prioritas Restock
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">SKU mencapai/mendekati batas kritis.</p>
                            </div>
                            <Link href="/stock-in" className="text-xs font-semibold text-[#f5b800] hover:underline flex items-center gap-1">
                                Stok Masuk <ChevronRight className="size-4" />
                            </Link>
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
                                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{p.kode_barang}</div>
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <div className="font-bold text-red-600 dark:text-red-400">{parseFloat(p.stok)}</div>
                                                    <div className="text-[10px] text-gray-500">min {parseFloat(p.stok_minimum)}</div>
                                                </td>
                                                <td className="py-3 px-5 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${parseFloat(p.stok) === 0 ? 'bg-red-100 text-red-700 dark:bg-[#5A2C1C] dark:text-red-300' :
                                                            'bg-orange-100 text-orange-700 dark:bg-[#3B2C14] dark:text-[#f5b800]'
                                                        }`}>
                                                        {parseFloat(p.stok) === 0 ? 'HABIS' : 'MENIPIS'}
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

                {/* Footer System Health */}
                <div className="rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#2C271E] flex items-center justify-center text-gray-600 dark:text-[#f5b800]">
                            <Printer className="size-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">Printer Kasir Thermal: <span className="text-green-600 dark:text-green-400">Tersambung</span></div>
                            <div className="text-xs text-gray-500">Status sistem normal • Database sinkron</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Sinkronisasi: Baru saja</span>
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#2E2B23] text-gray-600 dark:text-white">
                            <CloudSync className="size-4" />
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}