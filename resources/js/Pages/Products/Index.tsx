import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import {
    Plus, Upload, Download, Search, Barcode,
    Package, AlertTriangle, XCircle, FileText, Pencil, Trash2,
    X, Info, RefreshCw, PackageOpen, Tags, ListFilter
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Select } from '@/Components/ui/select';
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
    gambar: string | null;
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

    // State untuk Modal Hapus (Sudah diperbaiki dengan tambahan stok & satuan)
    const [deleteModal, setDeleteModal] = useState<{
        show: boolean;
        id: number | null;
        nama: string;
        kode: string;
        stok: string;
        satuan: string;
    }>({
        show: false, id: null, nama: '', kode: '', stok: '0', satuan: ''
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

    // Handler Hapus (Sudah diperbaiki untuk mengambil stok & satuan)
    const confirmDelete = (product: Product) => {
        setDeleteModal({
            show: true,
            id: product.id,
            nama: product.nama,
            kode: product.kode_barang,
            stok: product.stok,
            satuan: product.satuan
        });
    };

    const executeDelete = () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);

        router.delete(`/products/${deleteModal.id}`, {
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, nama: '', kode: '', stok: '0', satuan: '' });
                // Notifikasi sukses/error otomatis ditangani oleh app.tsx
            },
            onFinish: () => setIsDeleting(false),
            preserveScroll: true,
        });
    };

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const isAllSelected = products.data.length > 0 && products.data.every(p => selectedIds.includes(p.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.data.map(p => p.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleting(true);
        router.post('/products/bulk-delete', { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setBulkDeleteModal(false);
            },
            onFinish: () => setIsBulkDeleting(false),
            preserveScroll: true,
        });
    };

    const handleExportSelected = () => {
        const selectedProducts = products.data.filter(p => selectedIds.includes(p.id));
        if (selectedProducts.length === 0) return;
        const csvRows = [
            ['No', 'Kode Barang', 'Nama Produk', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok', 'Stok Minimum', 'Status'],
            ...selectedProducts.map((p, idx) => [
                idx + 1,
                `"${p.kode_barang}"`,
                `"${p.nama.replace(/"/g, '""')}"`,
                `"${p.kategori || '-'}"`,
                `"${p.satuan}"`,
                p.harga_beli,
                p.harga_jual,
                p.stok,
                p.stok_minimum,
                p.aktif ? 'Aktif' : 'Nonaktif'
            ])
        ];
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `produk-terpilih-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${selectedProducts.length} produk berhasil diekspor.`);
    };

    // Keyboard Shortcut untuk Modal Hapus (Enter/Esc)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!deleteModal.show) return;
            if (e.key === 'Escape') {
                setDeleteModal({ show: false, id: null, nama: '', kode: '', stok: '0', satuan: '' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteModal.show, deleteModal.id]); // Dependensi disesuaikan

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="relative flex-1 min-w-0 sm:min-w-60">
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
                            <Select
                                value={kategoriId}
                                onChange={(val) => {
                                    setKategoriId(val);
                                    applyFilter({ kategori_id: val || undefined });
                                }}
                                options={[
                                    { value: '', label: 'Semua Kategori' },
                                    ...categories.map((c) => ({ value: String(c.id), label: c.nama }))
                                ]}
                                icon={Tags}
                                placeholder="Semua Kategori"
                                fullWidth={false}
                                className="w-full sm:w-56"
                            />

                            <Select
                                value={String(perPage)}
                                onChange={(val) => {
                                    const numVal = Number(val);
                                    setPerPage(numVal);
                                    applyFilter({ per_page: numVal });
                                }}
                                options={[
                                    { value: '10', label: '10 Baris' },
                                    { value: '20', label: '20 Baris' },
                                    { value: '50', label: '50 Baris' },
                                    { value: '100', label: '100 Baris' },
                                ]}
                                icon={ListFilter}
                                fullWidth={false}
                                className="w-full sm:w-36"
                            />
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                            <span className="w-2 h-2 rounded-full bg-[#f5b800] animate-pulse"></span>
                            <span><strong>{selectedIds.length}</strong> produk dipilih</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedIds([])}
                                className="h-8 text-xs bg-white dark:bg-zinc-900"
                            >
                                Batal
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportSelected}
                                className="h-8 text-xs bg-white dark:bg-zinc-900 flex items-center gap-1.5"
                            >
                                <Download className="size-3.5" /> Ekspor ({selectedIds.length})
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setBulkDeleteModal(true)}
                                className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                <Trash2 className="size-3.5" /> Hapus Terpilih ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
                )}

                {/* Table Container */}
                <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden w-full max-w-full">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-250">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                    <th className="py-3 px-4 font-semibold w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                            className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                        />
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
                                        const isChecked = selectedIds.includes(p.id);

                                        return (
                                            <tr
                                                key={p.id}
                                                className={`transition-colors group ${isChecked ? 'bg-[#f5b800]/5 dark:bg-[#f5b800]/10' : 'hover:bg-gray-50 dark:hover:bg-[#2B271F]'}`}
                                            >
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleSelectOne(p.id)}
                                                        className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                    />
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
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 dark:border-zinc-700">
                                                            {p.gambar ? (
                                                                <img src={`/storage/${p.gambar}`} alt={p.nama} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-bold text-lg text-[#f5b800] uppercase">{p.nama.charAt(0)}</span>
                                                            )}
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in transition-all"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setDeleteModal({ show: false, id: null, nama: '', kode: '', stok: '0', satuan: '' });
                        }
                    }}
                >
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">

                        {/* Top: Icon & Close Button */}
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                <Trash2 className="size-6" />
                            </div>
                            <button
                                onClick={() => setDeleteModal({ show: false, id: null, nama: '', kode: '', stok: '0', satuan: '' })}
                                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Yakin Ingin Menghapus Produk Ini?
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Item <strong className="text-gray-900 dark:text-white">"{deleteModal.nama}"</strong> <span className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[11px] px-2 py-0.5 rounded font-mono">(SKU: {deleteModal.kode})</span> akan dihapus secara permanen dari sistem inventaris.
                            </p>
                        </div>

                        {/* Impact Summary */}
                        <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 flex items-center gap-3 border border-gray-100 dark:border-zinc-800">
                            <PackageOpen className="size-5 text-[#f5b800] shrink-0" />
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                                <span className="font-bold text-gray-900 dark:text-white">Sisa Stok: {deleteModal.stok} {deleteModal.satuan}</span>
                                <span>•</span>
                                <span>Riwayat transaksi lama tetap tersimpan.</span>
                            </div>
                        </div>

                        {/* Advisory Note */}
                        <div className="bg-gray-100/50 dark:bg-zinc-800/50 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-gray-500">
                            <Info className="size-4" />
                            <span>Tindakan ini tidak dapat dibatalkan.</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteModal({ show: false, id: null, nama: '', kode: '', stok: '0', satuan: '' })}
                                disabled={isDeleting}
                                className="flex-1 h-11 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={executeDelete}
                                disabled={isDeleting}
                                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all"
                            >
                                {isDeleting ? (
                                    <><RefreshCw className="mr-2 size-4 animate-spin" /> Menghapus...</>
                                ) : (
                                    <><Trash2 className="mr-2 size-4" /> Ya, Hapus</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS MASSAL */}
            {bulkDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in transition-all"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isBulkDeleting) {
                            setBulkDeleteModal(false);
                        }
                    }}
                >
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                <Trash2 className="size-6" />
                            </div>
                            <button
                                onClick={() => !isBulkDeleting && setBulkDeleteModal(false)}
                                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Hapus {selectedIds.length} Produk Terpilih?
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Apakah Anda yakin ingin menghapus <strong className="text-gray-900 dark:text-white">{selectedIds.length} produk</strong> yang dipilih? Produk yang sudah memiliki riwayat transaksi atau pergerakan stok akan otomatis dilewati demi keamanan audit.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setBulkDeleteModal(false)}
                                disabled={isBulkDeleting}
                                className="flex-1 h-11 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all"
                            >
                                {isBulkDeleting ? (
                                    <><RefreshCw className="mr-2 size-4 animate-spin" /> Menghapus...</>
                                ) : (
                                    <><Trash2 className="mr-2 size-4" /> Ya, Hapus Semua</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}