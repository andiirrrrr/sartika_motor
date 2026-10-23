import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useEffect, FormEvent, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Save, Calculator, Image as ImageIcon, CheckCircle2, Barcode, Tag, Layers } from 'lucide-react';

interface Props {
    categories: { id: number; nama: string }[];
}

export default function Create({ categories }: Props) {
    const kodeRef = useRef<HTMLInputElement>(null);

    // State untuk kalkulator harga
    const [margin, setMargin] = useState<number>(0);

    const { data, setData, post, processing, errors } = useForm({
        kode_barang: '',
        nama: '',
        kategori_id: '',
        satuan: 'pcs',
        harga_beli: '',
        harga_jual: '',
        harga_grosir: '',
        min_qty_grosir: '',
        stok_minimum: '0',
        stok_awal: '',
    });

    // Fokus otomatis
    useEffect(() => {
        kodeRef.current?.focus();
    }, []);

    // Live Calculator Logic
    const handleHargaBeliChange = (val: string) => {
        setData('harga_beli', val);
        const hpp = parseFloat(val) || 0;
        if (margin > 0) {
            const newJual = hpp + (hpp * (margin / 100));
            setData('harga_jual', Math.round(newJual).toString());
        }
    };

    const handleMarginChange = (val: string) => {
        const m = parseFloat(val) || 0;
        setMargin(m);
        const hpp = parseFloat(data.harga_beli) || 0;
        if (hpp > 0) {
            const newJual = hpp + (hpp * (m / 100));
            setData('harga_jual', Math.round(newJual).toString());
        }
    };

    const handleHargaJualChange = (val: string) => {
        setData('harga_jual', val);
        const jual = parseFloat(val) || 0;
        const hpp = parseFloat(data.harga_beli) || 0;
        if (hpp > 0) {
            const calculatedMargin = ((jual - hpp) / hpp) * 100;
            setMargin(Math.round(calculatedMargin));
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/products', {
            preserveScroll: true,
            onSuccess: () => {
                const prevKategori = data.kategori_id;
                const prevSatuan = data.satuan;
                const prevStokMin = data.stok_minimum;

                setData({
                    kode_barang: '',
                    nama: '',
                    kategori_id: prevKategori,
                    satuan: prevSatuan,
                    harga_beli: '',
                    harga_jual: '',
                    harga_grosir: '',
                    min_qty_grosir: '',
                    stok_minimum: prevStokMin,
                    stok_awal: '',
                });
                setMargin(0);
                kodeRef.current?.focus();
            }
        });
    };

    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    return (
        <AdminLayout>
            <Head title="Tambah Produk Baru" />

            {/* Top Header Context */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                        <span>Katalog</span> <span className="text-gray-300">/</span>
                        <span>Produk</span> <span className="text-gray-300">/</span>
                        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> Tambah Baru
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Tambah Produk Baru
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/products">
                        <Button variant="outline" className="h-10 px-4 rounded-xl shadow-sm">
                            <ArrowLeft className="size-4 mr-2" /> Batal
                        </Button>
                    </Link>
                    <Button onClick={submit} disabled={processing} className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold shadow-sm">
                        <Save className="size-4 mr-2" /> {processing ? 'Menyimpan...' : 'Simpan Produk'}
                    </Button>
                </div>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24">

                {/* LEFT COLUMN (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* SEKSI 1: IDENTITAS DASAR */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800]">
                                <Tag className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">1. Identitas Produk</h2>
                                <p className="text-xs text-gray-500">Rincian nama, kode SKU, dan klasifikasi barang.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Barang (SKU) *</label>
                                    <div className="relative">
                                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                        <input
                                            ref={kodeRef}
                                            type="text"
                                            value={data.kode_barang}
                                            onChange={(e) => setData('kode_barang', e.target.value)}
                                            className="w-full h-11 pl-10 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-mono focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                            placeholder="Misal: OLI-001"
                                            required
                                        />
                                    </div>
                                    {errors.kode_barang && <p className="text-xs text-red-500 mt-1">{errors.kode_barang}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                                    <select
                                        value={data.kategori_id}
                                        onChange={(e) => setData('kategori_id', e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                    >
                                        <option value="">-- Pilih Kategori --</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Produk Lengkap *</label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                    placeholder="Misal: Oli Yamalube 1L"
                                    required
                                />
                                {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
                            </div>
                        </div>
                    </div>

                    {/* SEKSI 2: HARGA & MARGIN */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800]">
                                    <Calculator className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">2. Penetapan Harga</h2>
                                    <p className="text-xs text-gray-500">Atur harga beli, margin, dan harga jual retail.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Beli (HPP) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                    <input
                                        type="number"
                                        value={data.harga_beli}
                                        onChange={(e) => handleHargaBeliChange(e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm font-bold text-right focus:ring-2 focus:ring-[#f5b800] outline-none"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Margin (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={margin}
                                        onChange={(e) => handleMarginChange(e.target.value)}
                                        className="w-full h-10 pl-3 pr-8 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm font-bold text-right focus:ring-2 focus:ring-[#f5b800] outline-none"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Jual POS *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                    <input
                                        type="number"
                                        value={data.harga_jual}
                                        onChange={(e) => handleHargaJualChange(e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-zinc-900 border-2 border-[#f5b800] text-sm font-bold text-right focus:ring-2 focus:ring-[#f5b800] outline-none"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                {errors.harga_jual && <p className="text-xs text-red-500 mt-1">{errors.harga_jual}</p>}
                            </div>
                        </div>

                        {/* Harga Grosir */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Grosir (Opsional)</label>
                                <input
                                    type="number"
                                    value={data.harga_grosir}
                                    onChange={(e) => setData('harga_grosir', e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                    placeholder="Kosongkan jika tidak ada"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimal Qty Grosir</label>
                                <input
                                    type="number"
                                    value={data.min_qty_grosir}
                                    onChange={(e) => setData('min_qty_grosir', e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                    placeholder="Misal: 10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEKSI 3: INVENTARIS */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800]">
                                <Layers className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">3. Manajemen Inventaris</h2>
                                <p className="text-xs text-gray-500">Satuan unit dan batas peringatan stok.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Satuan *</label>
                                <input
                                    type="text"
                                    value={data.satuan}
                                    onChange={(e) => setData('satuan', e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok Awal (Opsional)</label>
                                <input
                                    type="number"
                                    value={data.stok_awal}
                                    onChange={(e) => setData('stok_awal', e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                    placeholder="Isi jika ada"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batas Min. Stok</label>
                                <input
                                    type="number"
                                    value={data.stok_minimum}
                                    onChange={(e) => setData('stok_minimum', e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Widget Foto */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                            <ImageIcon className="size-4 text-[#f5b800]" /> Foto Produk
                        </h3>
                        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-6 flex flex-col items-center justify-center text-center cursor-not-allowed opacity-70">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm mb-2">
                                <ImageIcon className="size-5 text-gray-400" />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Fitur Upload Segera Hadir</span>
                            <span className="text-[10px] text-gray-500 mt-1">Membutuhkan setup storage.</span>
                        </div>
                    </div>

                    {/* Widget Live Preview POS */}
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm sticky top-20">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-[#f5b800] animate-pulse"></span>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pratinjau Kartu POS</h3>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3">Tampilan produk di layar kasir.</p>

                        <div className="rounded-xl border border-gray-200 dark:border-zinc-700 p-3 shadow-sm bg-white dark:bg-zinc-950">
                            <div className="flex gap-3">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                    <ImageIcon className="size-6 text-gray-300" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{categories.find(c => c.id.toString() === data.kategori_id)?.nama || 'Kategori'}</p>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                                        {data.nama || 'Nama Produk Belum Diisi'}
                                    </h4>
                                    <p className="text-[10px] font-mono text-gray-500 mt-0.5">{data.kode_barang || 'SKU-XXX'}</p>
                                </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#f5b800]">Rp {formatRupiah(parseFloat(data.harga_jual) || 0)}</span>
                                    {data.harga_grosir && data.min_qty_grosir && (
                                        <span className="text-[9px] text-green-600 font-medium">Grosir: Rp {formatRupiah(parseFloat(data.harga_grosir) || 0)}</span>
                                    )}
                                </div>
                                <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-medium">
                                    Stok: {data.stok_awal || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </AdminLayout>
    );
}