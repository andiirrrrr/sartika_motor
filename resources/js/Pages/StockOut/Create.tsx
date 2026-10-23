import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, FormEvent, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    ArrowLeft, Save, Search, Package, AlertTriangle,
    Calendar, ShieldAlert, FileText, Info, Minus, Plus
} from 'lucide-react';

interface Product {
    id: number;
    kode_barang: string;
    nama: string;
    stok: string;
    satuan: string;
    harga_beli: number;
}

export default function Create() {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        product_id: '',
        qty: '',
        alasan: 'rusak',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: '',
    });

    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Debounce Search
    useEffect(() => {
        if (search.length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/products/search?q=${search}`);
                const json = await res.json();
                setResults(json);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSelectProduct = (p: Product) => {
        setSelectedProduct(p);
        setData('product_id', p.id.toString());
        clearErrors('product_id');
        setSearch('');
        setResults([]);
    };

    const handleRemoveProduct = () => {
        setSelectedProduct(null);
        setData('product_id', '');
        searchInputRef.current?.focus();
    };

    const handleQtyChange = (val: string) => {
        let num = parseFloat(val) || 0;
        if (selectedProduct && num > parseFloat(selectedProduct.stok)) {
            num = parseFloat(selectedProduct.stok);
        }
        setData('qty', num.toString());
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        post('/stock-out');
    };

    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);
    const estimatedLoss = (parseFloat(data.qty) || 0) * (selectedProduct?.harga_beli || 0);

    return (
        <AdminLayout>
            <Head title="Input Stok Keluar" />

            <div className="max-w-[1400px] mx-auto space-y-6 pb-24">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#232019] p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span>Inventaris</span> <span>/</span>
                            <Link href="/stock-out" className="hover:text-gray-900">Stok Keluar</Link> <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> Input Baru
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Formulir Stok Keluar
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/stock-out">
                            <Button variant="outline" className="h-10 px-4 rounded-xl">Batal</Button>
                        </Link>
                        <Button onClick={submit} disabled={processing || !selectedProduct} className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold shadow-sm">
                            <Save className="size-4 mr-2" /> Simpan Pemotongan
                        </Button>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-[#2F2113] border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-200 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                        <ShieldAlert className="size-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Perhatian Audit & Kepatuhan</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Setiap pengurangan stok non-penjualan akan dicatat dalam buku besar penyesuaian inventaris dan mengurangi estimasi nilai aset toko.</p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* KIRI: Info Dokumen */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <FileText className="size-5 text-[#f5b800]" />
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Informasi Dokumen</h2>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tanggal & Waktu Catat</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <input
                                        type="date"
                                        value={data.tanggal}
                                        onChange={(e) => setData('tanggal', e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Petugas Pelapor</label>
                                <input
                                    type="text"
                                    value="Sistem (Otomatis)"
                                    readOnly
                                    className="w-full h-10 px-3 rounded-lg bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 text-sm text-gray-500 outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kronologi & Penjelasan Detail *</label>
                                <textarea
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none resize-none"
                                    placeholder="Jelaskan penyebab barang rusak/hilang..."
                                    rows={4}
                                    required
                                />
                                {errors.catatan && <p className="text-xs text-red-500 mt-1">{errors.catatan}</p>}
                            </div>
                        </div>
                    </div>

                    {/* KANAN: Produk & Alasan */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Pencarian Produk */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 relative">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <Package className="size-5 text-[#f5b800]" />
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Pilih Produk</h2>
                            </div>

                            {selectedProduct ? (
                                <div className="flex items-center justify-between rounded-xl border border-[#f5b800] bg-[#f5b800]/10 p-4">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedProduct.nama}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {selectedProduct.kode_barang} | Stok tersedia: <strong className="text-gray-900 dark:text-white">{parseFloat(selectedProduct.stok)} {selectedProduct.satuan}</strong>
                                        </p>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveProduct} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        Ganti
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Ketik nama produk atau scan barcode..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none font-medium"
                                        />
                                    </div>

                                    {search.length >= 2 && results.length > 0 && (
                                        <ul className="absolute z-10 mt-1 max-h-60 w-[calc(100%-2.5rem)] overflow-auto rounded-xl border bg-white dark:bg-zinc-800 shadow-lg dark:border-zinc-700">
                                            {results.map((p) => (
                                                <li key={p.id} onClick={() => handleSelectProduct(p)} className="cursor-pointer border-b px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700 last:border-0">
                                                    <p className="font-medium text-gray-900 dark:text-white">{p.nama}</p>
                                                    <p className="text-xs text-gray-500">{p.kode_barang} | Stok: {parseFloat(p.stok)} {p.satuan}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {search.length >= 2 && results.length === 0 && !isSearching && (
                                        <p className="mt-2 text-sm text-red-500">Produk tidak ditemukan.</p>
                                    )}
                                </>
                            )}
                            {errors.product_id && <p className="text-xs text-red-500 mt-1">{errors.product_id}</p>}
                        </div>

                        {/* Form Qty & Alasan */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qty Dikeluarkan *</label>
                                    <div className="flex items-center h-14 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-1">
                                        <button type="button" onClick={() => handleQtyChange((parseFloat(data.qty || '0') - 1).toString())} className="w-10 h-10 rounded-lg hover:bg-white dark:hover:bg-zinc-700 flex items-center justify-center transition-colors">
                                            <Minus className="size-5 text-gray-500" />
                                        </button>
                                        <input
                                            type="number"
                                            value={data.qty}
                                            onChange={(e) => handleQtyChange(e.target.value)}
                                            className="flex-1 text-center text-2xl font-bold text-gray-900 dark:text-white bg-transparent outline-none"
                                            placeholder="0"
                                            min="0.01"
                                            max={selectedProduct?.stok}
                                            disabled={!selectedProduct}
                                            required
                                        />
                                        <button type="button" onClick={() => handleQtyChange((parseFloat(data.qty || '0') + 1).toString())} className="w-10 h-10 rounded-lg hover:bg-white dark:hover:bg-zinc-700 flex items-center justify-center transition-colors">
                                            <Plus className="size-5 text-gray-500" />
                                        </button>
                                    </div>
                                    {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alasan Pengeluaran *</label>
                                    <select
                                        value={data.alasan}
                                        onChange={(e) => setData('alasan', e.target.value)}
                                        className="w-full h-14 px-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-medium focus:ring-2 focus:ring-[#f5b800] outline-none appearance-none"
                                        required
                                    >
                                        <option value="rusak">Barang Rusak / Cacat</option>
                                        <option value="hilang">Hilang / Selisih Opname</option>
                                        <option value="pemakaian_sendiri">Penggunaan Operasional Toko</option>
                                        <option value="koreksi">Koreksi Stok Manual</option>
                                    </select>
                                    {errors.alasan && <p className="text-xs text-red-500 mt-1">{errors.alasan}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Estimasi Kerugian */}
                        <div className="bg-red-50 dark:bg-[#2A1D17] border border-red-100 dark:border-red-900/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                                    <AlertTriangle className="size-4" /> Estimasi Nilai Kerugian (HPP)
                                </h3>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Kalkulasi Qty x Harga Beli Produk</p>
                            </div>
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-4 sm:mt-0">
                                Rp {formatRupiah(estimatedLoss)}
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}