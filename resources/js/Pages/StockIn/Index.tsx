import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import {
    Plus, Download, Search, Package, TrendingUp,
    Truck, FileText, CheckCircle2, User
} from 'lucide-react';

interface Props {
    stockIns: {
        data: any[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
    };
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Index({ stockIns }: Props) {
    return (
        <AdminLayout>
            <Head title="Riwayat Stok Masuk" />

            <div className="max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header Halaman */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Inventaris</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white">Stok Masuk</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-[#f5b800] shadow-sm"></span>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Riwayat Stok Masuk
                            </h1>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Pencatatan faktur barang masuk dari supplier, penambahan kuantitas inventaris, dan verifikasi gudang secara real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2">
                            <Download className="size-4" /> Ekspor Laporan
                        </button>
                        <Link href="/stock-in/create" className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 text-sm font-bold shadow-sm flex items-center gap-2 transition-transform active:scale-95">
                            <Plus className="size-5" /> Input Stok Masuk
                        </Link>
                    </div>
                </div>

                {/* 4 Metrik Ringkasan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Penerimaan Bulan Ini</span>
                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800]">
                                <TrendingUp className="size-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">Total Unit</div>
                            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> {stockIns.total} Transaksi Tercatat
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Dokumen</span>
                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-blue-500">
                                <FileText className="size-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{stockIns.total} Dokumen</div>
                            <div className="text-[11px] text-gray-500 mt-1">Tercatat di sistem</div>
                        </div>
                    </div>
                </div>

                {/* Filter & Tabel */}
                <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                            <input type="text" placeholder="Cari produk atau supplier..." className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                    <th className="py-3 px-4 font-semibold">Tanggal</th>
                                    <th className="py-3 px-4 font-semibold">Produk</th>
                                    <th className="py-3 px-4 font-semibold">Supplier</th>
                                    <th className="py-3 px-4 text-right font-semibold">Qty Masuk</th>
                                    <th className="py-3 px-4 text-right font-semibold">Total Nilai Beli</th>
                                    <th className="py-3 px-4 font-semibold">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                {stockIns.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">Belum ada riwayat stok masuk.</td>
                                    </tr>
                                ) : (
                                    stockIns.data.map((item) => {
                                        const total = parseFloat(item.qty) * item.harga_beli;
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
                                                    <div className="text-xs text-[#f5b800] font-mono">{item.product?.kode_barang}</div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                                    {item.supplier?.nama || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                                        +{parseFloat(item.qty)} {item.product?.satuan}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                                                    Rp {formatRupiah(total)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                                                            {item.created_by?.nama?.charAt(0) || 'S'}
                                                        </div>
                                                        <span className="text-xs">{item.created_by?.nama || 'Sistem'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {stockIns.links.length > 3 && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 p-4">
                            <Pagination links={stockIns.links} />
                            <p className="mt-2 text-center text-xs text-gray-500">
                                Menampilkan {stockIns.from ?? 0}-{stockIns.to ?? 0} dari {stockIns.total} data
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Banner */}
                <div className="p-4 rounded-xl bg-[#f5b800]/10 border border-[#f5b800]/20 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="size-4 text-[#f5b800]" />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Sistem Terintegrasi Otomatis</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Setiap barang masuk yang divalidasi akan otomatis mengkalkulasi HPP (Average Cost), memperbarui harga modal di katalog, dan menambah stok aktif kasir POS secara instan.</p>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}