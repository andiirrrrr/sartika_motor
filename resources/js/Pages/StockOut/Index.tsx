import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import {
    Plus, Download, Search, Package, AlertTriangle,
    TrendingDown, ShieldCheck, FileText, Ban
} from 'lucide-react';

interface Props {
    stockOuts: {
        data: any[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
    };
    stats: {
        total_item: number;
        total_loss: number;
        top_reason: string;
        top_reason_count: number;
    };
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Index({ stockOuts, stats }: Props) {

    const getAlasanLabel = (alasan: string) => {
        switch (alasan) {
            case 'rusak': return { label: 'Barang Rusak', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle };
            case 'hilang': return { label: 'Hilang / Selisih', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Ban };
            case 'pemakaian_sendiri': return { label: 'Pemakaian Toko', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileText };
            case 'koreksi': return { label: 'Koreksi Opname', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ShieldCheck };
            default: return { label: alasan, color: 'bg-gray-100 text-gray-700', icon: FileText };
        }
    };

    return (
        <AdminLayout>
            <Head title="Riwayat Stok Keluar" />

            <div className="max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header Halaman */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Inventaris</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> Riwayat Stok Keluar
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Riwayat Stok Keluar
                        </h1>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Pencatatan barang keluar di luar transaksi kasir POS seperti barang rusak, hilang, atau pemakaian operasional toko.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2">
                            <Download className="size-4" /> Unduh BA
                        </button>
                        <Link href="/stock-out/create" className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 text-sm font-bold shadow-sm flex items-center gap-2 transition-transform active:scale-95">
                            <Plus className="size-5" /> Input Stok Keluar
                        </Link>
                    </div>
                </div>

                {/* 4 Metrik Ringkasan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Item Keluar</span>
                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                                <Package className="size-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_item}</span>
                            <span className="text-xs text-gray-500">Unit</span>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Estimasi Kerugian</span>
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                <TrendingDown className="size-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-red-600 dark:text-red-400">Rp {formatRupiah(stats.total_loss)}</span>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Alasan Dominan</span>
                            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                                <AlertTriangle className="size-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white capitalize">{getAlasanLabel(stats.top_reason).label}</div>
                            <div className="text-[11px] text-gray-500 mt-1">{stats.top_reason_count} Kasus Tercatat</div>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl bg-[#f5b800]/10 border border-[#f5b800]/30 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-[#f5b800] uppercase tracking-wider">Status Sistem</span>
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center text-[#f5b800]">
                                <ShieldCheck className="size-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">Audit Log Aktif</div>
                            <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">Tercatat aman di database</div>
                        </div>
                    </div>
                </div>

                {/* Tabel Riwayat */}
                <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                            <input type="text" placeholder="Cari produk atau keterangan..." className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-250">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                    <th className="py-3 px-4 font-semibold">Waktu Pencatatan</th>
                                    <th className="py-3 px-4 font-semibold">Produk & SKU</th>
                                    <th className="py-3 px-4 text-right font-semibold">Qty Keluar</th>
                                    <th className="py-3 px-4 font-semibold">Alasan Pengeluaran</th>
                                    <th className="py-3 px-4 font-semibold">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                {stockOuts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">Belum ada riwayat stok keluar.</td>
                                    </tr>
                                ) : (
                                    stockOuts.data.map((item) => {
                                        const alasanObj = getAlasanLabel(item.alasan);
                                        const AlasanIcon = alasanObj.icon;
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleTimeString('id-ID')}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{item.product?.nama}</div>
                                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{item.product?.kode_barang}</div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold">
                                                        -{parseFloat(item.qty)} {item.product?.satuan}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${alasanObj.color}`}>
                                                        <AlasanIcon className="size-3" /> {alasanObj.label}
                                                    </span>
                                                    <div className="text-xs text-gray-500 mt-1 italic line-clamp-1">{item.catatan || '-'}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                                                            {item.created_by?.nama?.charAt(0) || 'S'}
                                                        </div>
                                                        <span className="text-xs font-medium">{item.created_by?.nama || 'Sistem'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {stockOuts.links.length > 3 && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 p-4">
                            <Pagination links={stockOuts.links} />
                        </div>
                    )}
                </div>

                {/* SOP Info Banner */}
                <div className="p-5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f5b800]/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-5 text-[#f5b800]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Panduan Kepatuhan & SOP Pengurangan Stok</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                            Barang rusak fisik atau kadaluarsa wajib memiliki catatan kronologi yang jelas. Sistem secara otomatis menghitung nilai kerugian berdasarkan HPP (Harga Pokok Penjualan) produk.
                        </p>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}