import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import Pagination from '@/Components/Pagination';
import {
    ArrowLeft, Download, PlusCircle, AlertTriangle,
    Package, TrendingUp, TrendingDown, ShieldAlert,
    ArrowRight, Barcode, Layers, Clock, User,
    // TAMBAHKAN IMPORT IKON YANG HILANG DI BAWAH INI:
    ArrowDownToLine, ArrowUpFromLine, ShoppingCart, RefreshCw
} from 'lucide-react';

interface Props {
    product: {
        id: number;
        kode_barang: string;
        nama: string;
        satuan: string;
        stok: string;
        harga_beli: number;
        harga_jual: number;
        stok_minimum: string;
    };
    kategori: string | null;
    movements: {
        data: any[];
        links: any[];
        from: number | null;
        to: number | null;
        total: number;
    };
    totalInBulanIni: number;
    totalOutBulanIni: number;
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Show({ product, kategori, movements, totalInBulanIni, totalOutBulanIni }: Props) {
    const [activeTab, setActiveTab] = useState<'semua' | 'masuk' | 'keluar' | 'penjualan'>('semua');
    const [search, setSearch] = useState('');

    const stokNum = parseFloat(product.stok);
    const stokMin = parseFloat(product.stok_minimum);
    const isLow = stokNum <= stokMin;
    const isOut = stokNum === 0;

    // Filter data berdasarkan tab aktif dan pencarian lokal
    const filteredMovements = movements.data.filter((m) => {
        const matchTab = activeTab === 'semua' ? true : m.tipe === activeTab;
        const matchSearch = search === '' ? true :
            (m.catatan && m.catatan.toLowerCase().includes(search.toLowerCase())) ||
            (m.referensi_tipe && m.referensi_tipe.toLowerCase().includes(search.toLowerCase())) ||
            (m.created_by?.nama && m.created_by.nama.toLowerCase().includes(search.toLowerCase()));
        return matchTab && matchSearch;
    });

    const getTipeBadge = (tipe: string) => {
        switch (tipe) {
            case 'masuk':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold"><ArrowDownToLine className="size-3" /> Masuk (Restock)</span>;
            case 'keluar':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold"><ArrowUpFromLine className="size-3" /> Keluar</span>;
            case 'penjualan':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold"><ShoppingCart className="size-3" /> Penjualan POS</span>;
            case 'koreksi':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-semibold"><RefreshCw className="size-3" /> Koreksi</span>;
            default:
                return tipe;
        }
    };

    return (
        <AdminLayout>
            <Head title={`Kartu Stok - ${product.nama}`} />

            <div className="max-w-7xl mx-auto space-y-6 pb-12">

                {/* Header Context */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Link href="/products" className="hover:text-gray-900 dark:hover:text-white">Produk</Link>
                            <span className="text-gray-300">/</span>
                            <span className="font-semibold text-gray-900 dark:text-white">Kartu Stok</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {product.nama}
                            </h1>
                            {isOut ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Habis / Out of Stock
                                </span>
                            ) : isLow ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Stok Menipis
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Stok Aman
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-gray-800 dark:text-gray-300">SKU: {product.kode_barang}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Package className="size-3.5" /> Satuan: {product.satuan}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/products">
                            <Button variant="outline" className="h-10 px-4 rounded-xl shadow-sm">
                                <ArrowLeft className="size-4 mr-2" /> Kembali
                            </Button>
                        </Link>
                        <Link href="/stock-in/create">
                            <Button className="h-10 px-4 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold shadow-sm">
                                <PlusCircle className="size-4 mr-2" /> Catat Stok Masuk
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Alert Banner */}
                {isLow && (
                    <div className="rounded-xl bg-orange-50 dark:bg-[#2F2113] border border-orange-100 dark:border-orange-900/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-orange-600 dark:text-[#f5b800] size-5 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Perhatian: Stok Produk {isOut ? 'Nihil' : 'Menipis'} ({stokNum} {product.satuan})</span>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Stok saat ini telah mencapai atau berada di bawah batas minimum ({stokMin} {product.satuan}). Segera lakukan restock ke supplier.
                                </p>
                            </div>
                        </div>
                        <Link href="/stock-in/create" className="px-4 py-2 rounded-lg bg-white dark:bg-[#3F2B1A] text-gray-900 dark:text-[#f5b800] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-[#523822] transition-colors shrink-0 text-center">
                            Buat PO Restock
                        </Link>
                    </div>
                )}

                {/* Bento Grid: Profil & Metrik */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* Profil Produk */}
                    <div className="lg:col-span-4 bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-semibold">{kategori || 'Tanpa Kategori'}</span>
                                <span className="text-xs text-gray-400 font-mono">ID: PRD-{product.id}</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{product.nama}</h2>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Harga Beli (HPP)</span>
                                <span className="font-semibold text-gray-900 dark:text-white">Rp {formatRupiah(product.harga_beli)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Harga Jual</span>
                                <span className="font-bold text-[#f5b800]">Rp {formatRupiah(product.harga_jual)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4 Metrik */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Sisa Stok</span>
                            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stokNum}</div>
                            <span className={`text-[10px] font-semibold mt-1 ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-green-500'}`}>{isOut ? 'Habis' : isLow ? 'Kritis' : 'Aman'}</span>
                        </div>
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Safety Stock</span>
                            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stokMin}</div>
                            <span className="text-[10px] text-gray-400 mt-1">Batas minimum</span>
                        </div>
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Masuk (Bln Ini)</span>
                                <TrendingUp className="size-4 text-green-500" />
                            </div>
                            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalInBulanIni}</div>
                            <span className="text-[10px] text-gray-400 mt-1">{product.satuan}</span>
                        </div>
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Keluar (Bln Ini)</span>
                                <TrendingDown className="size-4 text-red-500" />
                            </div>
                            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalOutBulanIni}</div>
                            <span className="text-[10px] text-gray-400 mt-1">{product.satuan}</span>
                        </div>
                    </div>
                </div>

                {/* Tabel Riwayat Mutasi */}
                <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">

                    {/* Toolbar Tabel */}
                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl overflow-x-auto">
                            {[
                                { id: 'semua', label: 'Semua Mutasi' },
                                { id: 'masuk', label: 'Masuk' },
                                { id: 'keluar', label: 'Keluar' },
                                { id: 'penjualan', label: 'Penjualan POS' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                            ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari keterangan / kasir..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-64 h-9 pl-3 pr-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase text-gray-500 tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Tanggal & Jam</th>
                                    <th className="py-3 px-4 font-semibold">Tipe Mutasi</th>
                                    <th className="py-3 px-4 font-semibold">Keterangan / Ref</th>
                                    <th className="py-3 px-4 font-semibold text-right">Masuk (+)</th>
                                    <th className="py-3 px-4 font-semibold text-right">Keluar (-)</th>
                                    <th className="py-3 px-4 font-semibold text-right">Saldo Akhir</th>
                                    <th className="py-3 px-4 font-semibold">Petugas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                {filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500">Tidak ada data mutasi yang sesuai.</td>
                                    </tr>
                                ) : (
                                    filteredMovements.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                            <td className="py-3 px-4">
                                                <span className="block font-medium text-gray-900 dark:text-white">
                                                    {new Date(m.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-[11px] text-gray-500">
                                                    {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {getTipeBadge(m.tipe)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="block text-gray-900 dark:text-white text-xs">{m.catatan || m.alasan || '-'}</span>
                                                {m.referensi_tipe && (
                                                    <span className="text-[10px] font-mono text-gray-400">
                                                        Ref: {m.referensi_tipe.toUpperCase()}-{m.referensi_id}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-green-600 dark:text-green-400">
                                                {parseFloat(m.qty) > 0 ? `+${parseFloat(m.qty)}` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-red-600 dark:text-red-400">
                                                {parseFloat(m.qty) < 0 ? `${parseFloat(m.qty)}` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                                                {parseFloat(m.stok_setelah)}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                                                {m.created_by?.nama || 'Sistem'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {movements.links.length > 3 && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 p-4">
                            <Pagination links={movements.links} />
                            <p className="mt-2 text-center text-xs text-gray-500">
                                Menampilkan {movements.from ?? 0}-{movements.to ?? 0} dari {movements.total} mutasi
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Panels: Automation & Supplier */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#f5b800] animate-pulse"></span>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pemberitahuan Reorder Otomatis</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Sistem mendeteksi laju penjualan rata-rata produk ini. Disarankan untuk melakukan restock sebelum stok mencapai titik nol agar tidak mengganggu penjualan di POS.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Kontak Supplier</h3>
                            <p className="text-xs text-gray-500">Hubungi supplier terkait untuk info pengiriman atau retur.</p>
                        </div>
                        <Button className="w-full mt-4 h-9 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold">
                            Hubungi Supplier
                        </Button>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}