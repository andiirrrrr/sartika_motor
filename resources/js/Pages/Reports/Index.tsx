import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    TrendingUp, Receipt, Wallet, AlertTriangle,
    Download, Printer, Filter, ArrowRight, Activity,
    BarChart3, Clock, Package
} from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface Props {
    from: string;
    to: string;
    salesSummary: any[];
    chartData: any[];
    lowStockProducts: any[];
    stats: {
        omzet: number;
        transaksi: number;
        laba: number;
        item: number;
        aov: number;
    };
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Index({ from, to, salesSummary, chartData, lowStockProducts, stats }: Props) {
    const [activeTab, setActiveTab] = useState<'sales' | 'stock'>('sales');
    const [startDate, setStartDate] = useState(from);
    const [endDate, setEndDate] = useState(to);

    const applyFilter = () => {
        router.get('/reports', { from: startDate, to: endDate }, { preserveState: true });
    };

    // Helper untuk menghitung tinggi batang grafik
    const maxOmzet = Math.max(...chartData.map(d => d.total_omzet), 1000000); // minimal 1 juta untuk skala

    return (
        <AdminLayout>
            <Head title="Pusat Laporan" />

            <div className="max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header & Filter */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-white dark:bg-[#232019] p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span>Laporan & Kasir</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white">Laporan</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Pusat Analitik & Laporan
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 px-2 bg-transparent text-sm outline-none dark:text-white" />
                            <span className="text-gray-400">-</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 px-2 bg-transparent text-sm outline-none dark:text-white" />
                            <Button onClick={applyFilter} size="sm" className="h-8 bg-gray-900 text-white dark:bg-white dark:text-gray-900">Terapkan</Button>
                        </div>
                        <Button variant="outline" className="h-11 px-4 rounded-xl shadow-sm">
                            <Download className="size-4 mr-2" /> Ekspor
                        </Button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sales' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <BarChart3 className="size-4" /> Laporan Penjualan
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'stock' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <AlertTriangle className="size-4 text-red-500" /> Stok Menipis
                        </button>
                    </div>
                </div>

                {/* KONTEN TAB 1: PENJUALAN */}
                {activeTab === 'sales' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* 4 KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Omzet</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-sm font-semibold text-gray-500">Rp</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(stats.omzet)}</span>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Laba Kotor</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-sm font-semibold text-gray-500">Rp</span>
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{formatRupiah(stats.laba)}</span>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Transaksi</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.transaksi}</span>
                                    <span className="text-sm font-medium text-gray-500">Struk</span>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rata-rata (AOV)</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-sm font-semibold text-gray-500">Rp</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(stats.aov)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Grafik Batang Dinamis */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tren Penjualan</h2>
                            <p className="text-sm text-gray-500 mb-6">6 hari transaksi terakhir pada periode ini.</p>

                            <div className="h-64 flex items-end justify-around gap-2 border-b border-gray-200 dark:border-zinc-700 pb-2">
                                {chartData.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">Belum ada data.</div>
                                ) : (
                                    chartData.map((d, index) => {
                                        const heightPercent = Math.max((d.total_omzet / maxOmzet) * 100, 5); // minimal 5%
                                        return (
                                            <div key={index} className="flex flex-col items-center flex-1 group">
                                                <div className="w-full relative flex justify-center h-48 items-end">
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                                        Rp {formatRupiah(d.total_omzet)}
                                                    </div>
                                                    <div
                                                        className="w-12 bg-[#f5b800] hover:bg-[#e0a800] rounded-t-md transition-all duration-500"
                                                        style={{ height: `${heightPercent}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[11px] font-medium text-gray-500 mt-2">
                                                    {new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Tabel Rincian Harian */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rincian Penjualan Harian</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-200">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4 font-semibold">Tanggal</th>
                                            <th className="py-3 px-4 text-center font-semibold">Struk</th>
                                            <th className="py-3 px-4 text-center font-semibold">Item Terjual</th>
                                            <th className="py-3 px-4 text-right font-semibold">Omzet Kotor</th>
                                            <th className="py-3 px-4 text-right font-semibold text-green-600">Laba Kotor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                        {salesSummary.length === 0 ? (
                                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">Tidak ada data.</td></tr>
                                        ) : (
                                            salesSummary.map((d, i) => (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                                        {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">{d.total_transaksi}</td>
                                                    <td className="py-3 px-4 text-center">{parseFloat(d.total_item)} unit</td>
                                                    <td className="py-3 px-4 text-right font-semibold">Rp {formatRupiah(d.total_omzet)}</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">Rp {formatRupiah(d.total_laba)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* KONTEN TAB 2: STOK MENIPIS */}
                {activeTab === 'stock' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 rounded-xl bg-red-50 dark:bg-[#2A1D17] border border-red-100 dark:border-red-900/30 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                                <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Peringatan Inventori</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Terdapat <strong className="text-red-600">{lowStockProducts.length} SKU</strong> yang stoknya sudah mencapai batas minimum. Segera lakukan restock.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-175">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4 font-semibold">Produk & SKU</th>
                                            <th className="py-3 px-4 font-semibold">Kategori</th>
                                            <th className="py-3 px-4 text-center font-semibold">Sisa Stok</th>
                                            <th className="py-3 px-4 text-center font-semibold">Batas Min.</th>
                                            <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                        {lowStockProducts.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{p.nama}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{p.kode_barang}</div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">{p.kategori?.nama || '-'}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="inline-flex px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">
                                                        {parseFloat(p.stok)} {p.satuan}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center text-gray-500">{parseFloat(p.stok_minimum)}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <Button size="sm" className="h-8 bg-[#f5b800] text-gray-900 hover:bg-[#e0a800]">Buat PO</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}