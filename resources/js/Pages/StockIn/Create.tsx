import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, FormEvent, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    ArrowLeft, Save, Search, Package, Calendar,
    MapPin, FileText, CheckCircle2, Barcode,
    Info
} from 'lucide-react';

interface Product {
    id: number;
    kode_barang: string;
    nama: string;
    stok: string;
    satuan: string;
    harga_beli: number;
}

interface Supplier {
    id: number;
    nama: string;
}

interface Props {
    suppliers: Supplier[];
}

export default function Create({ suppliers }: Props) {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        product_id: '',
        supplier_id: '',
        qty: '',
        harga_beli: '',
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

    // Debounce Pencarian
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
        setData('harga_beli', p.harga_beli.toString());
        clearErrors('product_id');
        setSearch('');
        setResults([]);
    };

    const handleRemoveProduct = () => {
        setSelectedProduct(null);
        setData('product_id', '');
        setData('harga_beli', '');
        searchInputRef.current?.focus();
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        post('/stock-in', {
            onSuccess: () => {
                // Redirect ke index akan ditangani oleh backend
            }
        });
    };

    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);
    const subtotal = (parseFloat(data.qty) || 0) * (parseFloat(data.harga_beli) || 0);

    return (
        <AdminLayout>
            <Head title="Input Stok Masuk" />

            <div className="max-w-[1400px] mx-auto space-y-6 pb-24">

                {/* Top Bar Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#232019] p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <span>Inventaris</span> <span>/</span>
                            <Link href="/stock-in" className="hover:text-gray-900">Stok Masuk</Link> <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> Input Baru
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Formulir Penerimaan Stok
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/stock-in">
                            <Button variant="outline" className="h-10 px-4 rounded-xl">
                                Batal
                            </Button>
                        </Link>
                        <Button onClick={submit} disabled={processing || !selectedProduct} className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold shadow-sm">
                            <Save className="size-4 mr-2" /> Simpan Penerimaan
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Kolom Kiri: Dokumen & Supplier */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <FileText className="size-5 text-[#f5b800]" />
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Informasi Dokumen</h2>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tanggal Terima *</label>
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
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Supplier / Pemasok</label>
                                    <Link href="/suppliers" className="text-[10px] text-[#f5b800] hover:underline">+ Tambah Baru</Link>
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <select
                                        value={data.supplier_id}
                                        onChange={(e) => setData('supplier_id', e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none appearance-none"
                                    >
                                        <option value="">-- Pilih Supplier (Opsional) --</option>
                                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                                    </select>
                                </div>
                                {!data.supplier_id && (
                                    <p className="mt-1.5 text-[10px] text-orange-500 flex items-center gap-1">
                                        <Info className="size-3" /> Kosongkan hanya jika ini stok awal (opname).
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Catatan Tambahan</label>
                                <textarea
                                    value={data.catatan}
                                    onChange={(e) => setData('catatan', e.target.value)}
                                    className="w-full p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none resize-none"
                                    placeholder="Nomor surat jalan, kondisi barang, dll..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Produk & Finansial */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Pencarian Produk */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 relative">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <Package className="size-5 text-[#f5b800]" />
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Pilih Produk</h2>
                                </div>
                                <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                    <Barcode className="size-3" /> Scanner Siap
                                </span>
                            </div>

                            {selectedProduct ? (
                                <div className="flex items-center justify-between rounded-xl border border-[#f5b800] bg-[#f5b800]/10 p-4">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedProduct.nama}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {selectedProduct.kode_barang} | Stok saat ini: <strong className="text-gray-900 dark:text-white">{parseFloat(selectedProduct.stok)} {selectedProduct.satuan}</strong>
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

                        {/* Form Qty & Harga */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qty Masuk *</label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        value={data.qty}
                                        onChange={(e) => setData('qty', e.target.value)}
                                        className="w-full h-14 px-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f5b800] outline-none text-center"
                                        placeholder="0"
                                        required
                                        disabled={!selectedProduct}
                                    />
                                    {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Harga Beli Satuan (Rp) *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                        <input
                                            type="number"
                                            value={data.harga_beli}
                                            onChange={(e) => setData('harga_beli', e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f5b800] outline-none text-right"
                                            placeholder="0"
                                            required
                                            disabled={!selectedProduct}
                                        />
                                    </div>
                                    {errors.harga_beli && <p className="text-xs text-red-500 mt-1">{errors.harga_beli}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Ringkasan Finansial */}
                        <div className="bg-[#f5b800]/10 border border-[#f5b800]/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-[#f5b800]" /> Total Nilai Penerimaan
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Kalkulasi Qty x Harga Beli</p>
                            </div>
                            <div className="text-3xl font-bold text-[#f5b800] mt-4 sm:mt-0">
                                Rp {formatRupiah(subtotal)}
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}