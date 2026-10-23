import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import {
    Plus, Upload, Download, Search, Barcode,
    Package, AlertTriangle, XCircle, FileText, Pencil, Trash2
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { toast } from 'sonner';

interface Product {
    id: number;
    kode_barang: string;
    nama: string;
    kategori: string | null;
    satuan: string;
    harga_beli: number;
    harga_jual: number;
    stok: string;
    stok_minimum: string;
    aktif: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
}

interface Props {
    products: PaginatedData<Product>;
    categories: { id: number; nama: string }[];
    filters: {
        search: string;
        kategori_id: string | number | null;
        per_page: number;
    };
    stats: {
        total_sku: number;
        low_stock: number;
        out_of_stock: number;
    };
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Index({ products, categories, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [kategoriId, setKategoriId] = useState(filters.kategori_id ? String(filters.kategori_id) : '');
    const [perPage, setPerPage] = useState(filters.per_page);

    // State untuk Modal Hapus
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null; nama: string; kode: string }>({
        show: false, id: null, nama: '', kode: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) {
                router.get('/products', { search, kategori_id: kategoriId || undefined, per_page: perPage }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const applyFilter = (overrides: Record<string, unknown> = {}) => {
        router.get('/products', { search, kategori_id: kategoriId || undefined, per_page: perPage, ...overrides }, { preserveState: true, replace: true });
    };

    // Handler Import & Export
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            router.post('/products/import', { file }, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            });
        }
    };

    // Handler Hapus
    const confirmDelete = (product: Product) => {
        setDeleteModal({ show: true, id: product.id, nama: product.nama, kode: product.kode_barang });
    };

    const executeDelete = () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        router.delete(`/products/${deleteModal.id}`, {
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, nama: '', kode: '' });
                toast.success('Produk berhasil dihapus');
            },
            onFinish: () => setIsDeleting(false)
        });
    };

    return (
        <AdminLayout>
            <Head title="Daftar Produk" />

            <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-[#f5b800] inline-block"></span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Katalog & Pergudangan</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Daftar Produk & Inventaris
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                            Kelola data SKU, harga jual, stok minimum, dan kontrol persediaan seluruh outlet toko secara terpadu.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <button onClick={handleImportClick} className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
                            <Upload className="size-4" /> Impor Excel
                        </button>
                        <a href="/products/export" className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
                            <Download className="size-4" /> Ekspor Data
                        </a>
                        <Link href="/products/create" className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                            <Plus className="size-4" /> Tambah Produk
                        </Link>
                    </div>
                </div>

                {/* Metrik Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total SKU</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_sku || 0} <span className="text-sm font-normal text-gray-500">Item</span></div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
                            <Package className="size-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Stok Menipis</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.low_stock || 0} <span className="text-sm font-normal text-gray-500">SKU</span></div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="size-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Stok Kosong</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.out_of_stock || 0} <span className="text-sm font-normal text-gray-500">SKU</span></div>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                            <XCircle className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                        <div className="relative flex-1 min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                            <input
                                type="text"
                                placeholder="Cari produk berdasarkan nama atau SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <select
                                value={kategoriId}
                                onChange={(e) => { setKategoriId(e.target.value); applyFilter({ kategori_id: e.target.value || undefined }); }}
                                className="h-11 pl-3 pr-8 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm appearance-none focus:ring-2 focus:ring-[#f5b800] outline-none cursor-pointer"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                            </select>

                            <select
                                value={perPage}
                                onChange={(e) => { const val = Number(e.target.value); setPerPage(val); applyFilter({ per_page: val }); }}
                                className="h-11 pl-3 pr-8 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm appearance-none focus:ring-2 focus:ring-[#f5b800] outline-none cursor-pointer"
                            >
                                <option value={10}>10 Baris</option>
                                <option value={20}>20 Baris</option>
                                <option value={50}>50 Baris</option>
                                <option value={100}>100 Baris</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                    <th className="py-3 px-4 font-semibold w-10 text-center">
                                        <input type="checkbox" className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer" />
                                    </th>
                                    <th className="py-3 px-4 font-semibold">SKU / Kode</th>
                                    <th className="py-3 px-4 font-semibold">Nama Produk</th>
                                    <th className="py-3 px-4 font-semibold">Kategori</th>
                                    <th className="py-3 px-4 font-semibold text-right">Harga Jual</th>
                                    <th className="py-3 px-4 font-semibold text-center">Sisa Stok</th>
                                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-gray-500">
                                            {filters.search ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada produk. Silakan tambah produk baru.'}
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((p) => {
                                        const stokNum = parseFloat(p.stok);
                                        const stokMin = parseFloat(p.stok_minimum);
                                        const isLow = stokMin > 0 && stokNum <= stokMin;
                                        const isOut = stokNum <= 0;

                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors group">
                                                <td className="py-3 px-4 text-center">
                                                    <input type="checkbox" className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer" />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-mono font-medium text-gray-900 dark:text-gray-300">{p.kode_barang}</div>
                                                    <div className="inline-flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                                        <Barcode className="size-3" />
                                                        <span>SKU</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                            <Package className="size-5 text-gray-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link href={`/products/${p.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-[#f5b800] truncate block">
                                                                {p.nama}
                                                            </Link>
                                                            <div className="text-xs text-gray-500">Satuan: {p.satuan}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
                                                        {p.kategori || '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                                                    Rp {formatRupiah(p.harga_jual)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className={`font-bold ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                                                        {stokNum} <span className="font-normal text-gray-500 text-xs">{p.satuan}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">Min: {stokMin}</div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isOut ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-semibold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Habis
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[11px] font-semibold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Menipis
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[11px] font-semibold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aman
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/products/${p.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors" title="Lihat Kartu Stok">
                                                            <FileText className="size-4" />
                                                        </Link>
                                                        <Link href={`/products/${p.id}/edit`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit Produk">
                                                            <Pencil className="size-4" />
                                                        </Link>
                                                        <button onClick={() => confirmDelete(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus Produk">
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {products.links.length > 3 && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm text-gray-500">
                                Menampilkan <strong>{products.from ?? 0}</strong> - <strong>{products.to ?? 0}</strong> dari <strong>{products.total}</strong> produk
                            </span>
                            <Pagination links={products.links} />
                        </div>
                    )}
                </div>

                {/* Info Banner */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f5b800]/20 flex items-center justify-center text-[#f5b800] shrink-0">
                            <Package className="size-4" />
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Sinkronisasi Otomatis Kasir:</span>
                            <span className="text-xs text-gray-500 ml-1">Seluruh perubahan stok dan harga jual langsung diperbarui ke terminal POS.</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL KONFIRMASI HAPUS */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                            <Trash2 className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Hapus Produk dari Katalog?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Apakah Anda yakin ingin menghapus <strong className="text-gray-900 dark:text-white">{deleteModal.nama}</strong> (<span className="font-mono text-gray-900 dark:text-white">{deleteModal.kode}</span>)? Seluruh histori penjualan tetap tersimpan namun SKU ini tidak dapat ditransaksikan di kasir.
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setDeleteModal({ show: false, id: null, nama: '', kode: '' })} disabled={isDeleting}>
                                Batal
                            </Button>
                            <Button onClick={executeDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Produk'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}