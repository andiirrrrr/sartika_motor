import { Head, usePage, useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import PosLayout from '@/Layouts/PosLayout';
import { useCartStore } from '@/Stores/cartStore';
import {
    Search, Plus, Minus, Trash2, ShoppingBag,
    Printer, Barcode, CreditCard, Wallet,
    QrCode, CheckCircle2, PackageOpen, X,
    User, Clock, Info, Delete, Store, Lock, ArrowRight
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product {
    id: number;
    kode_barang: string;
    nama: string;
    stok: string;
    satuan: string;
    harga_jual: number;
    harga_grosir: number | null;
    min_qty_grosir: string | null;
    gambar: string | null;
}

interface Props {
    categories: { id: number; nama: string }[];
}

export default function Index({ categories }: Props) {
    const { auth, app_settings } = usePage().props as any;
    const activeShift = auth?.active_shift;
    const user = auth?.user;

    // ================= STATE SHIFT =================
    const { data: shiftData, setData: setShiftData, post: postShift, processing: processingShift } = useForm({
        modal_awal: '0',
    });
    const [formattedModalAwal, setFormattedModalAwal] = useState('0');
    const [notes, setNotes] = useState('');

    // State Tutup Shift
    const [showCloseShift, setShowCloseShift] = useState(false);
    const [uangFisik, setUangFisik] = useState('');
    const [showDenom, setShowDenom] = useState(false);
    const [denoms, setDenoms] = useState({ d100k: 0, d50k: 0, d20k: 0, d10k: 0, d5k: 0, d2k: 0, d1k: 0 });
    const [isClosingShift, setIsClosingShift] = useState(false);

    const handleModalAwalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/\D/g, '');
        if (!raw) {
            setFormattedModalAwal('0');
            setShiftData('modal_awal', '0');
            return;
        }
        const formatted = new Intl.NumberFormat('id-ID').format(Number(raw));
        setFormattedModalAwal(formatted);
        setShiftData('modal_awal', raw);
    };

    const handlePreset = (val: string) => {
        setFormattedModalAwal(val);
        setShiftData('modal_awal', val.replace(/\./g, ''));
    };

    const submitOpenShift = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (shiftData.modal_awal === '0' || !shiftData.modal_awal) {
            toast.error('Silakan masukkan jumlah kas awal yang valid.');
            return;
        }
        postShift('/shifts/open');
    };

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uangFisik) {
            toast.error('Masukkan uang fisik terlebih dahulu.');
            return;
        }
        setIsClosingShift(true);
        router.post('/shifts/close', { uang_fisik: Number(uangFisik) }, {
            onSuccess: () => setShowCloseShift(false),
            onFinish: () => setIsClosingShift(false)
        });
    };

    const calculateDenomTotal = (d: typeof denoms) => {
        const total = (d.d100k * 100000) + (d.d50k * 50000) + (d.d20k * 20000) +
            (d.d10k * 10000) + (d.d5k * 5000) + (d.d2k * 2000) + (d.d1k * 1000);
        setUangFisik(total.toString());
    };

    const handleDenomChange = (key: keyof typeof denoms, val: string) => {
        const num = parseInt(val) || 0;
        const newDenoms = { ...denoms, [key]: num };
        setDenoms(newDenoms);
        calculateDenomTotal(newDenoms);
    };

    // ================= STATE POS =================
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [results, setResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [localQty, setLocalQty] = useState<Record<number, string>>({});

    // State Pembayaran & Struk
    const [showPayment, setShowPayment] = useState(false);
    const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'transfer' | 'qris'>('tunai');
    const [bayar, setBayar] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [autoPrint, setAutoPrint] = useState(true);
    const [sendWA, setSendWA] = useState(true);

    const { items, addItem, updateQty, removeItem, clearCart, getTotal, getItemPrice } = useCartStore();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const total = getTotal();
    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

    // Kalkulasi Kembalian & Selisih Shift
    const numericBayar = Number(bayar.replace(/\D/g, ''));
    const kembalian = Math.max(0, numericBayar - total);
    const expectedCash = activeShift ? (Number(activeShift.modal_awal) + Number(activeShift.penjualan_tunai_sementara || 0)) : 0;
    const selisih = (Number(uangFisik) || 0) - expectedCash;

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Tarik data produk
    useEffect(() => {
        const fetchProducts = async () => {
            if (search.length > 0 && search.length < 2) return;
            setIsSearching(true);
            try {
                const params = new URLSearchParams();
                if (search.length >= 2) params.append('q', search);
                if (selectedCategory) params.append('kategori_id', selectedCategory.toString());
                const res = await fetch(`/products/search?${params.toString()}`);
                const json = await res.json();
                setResults(json);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        };
        const timer = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timer);
    }, [search, selectedCategory]);

    const handleTambahKeKeranjang = (p: Product) => {
        const stokNum = parseFloat(p.stok);
        if (stokNum <= 0) {
            toast.error(`Stok ${p.nama} habis!`);
            return;
        }

        const existingItem = items.find((i) => i.product_id === p.id);
        if (existingItem && existingItem.qty >= stokNum) {
            toast.warning(`Stok ${p.nama} hanya tersisa ${stokNum}!`);
            return;
        }

        addItem({
            product_id: p.id,
            kode_barang: p.kode_barang,
            nama: p.nama,
            harga_jual: p.harga_jual,
            harga_grosir: p.harga_grosir,
            min_qty_grosir: p.min_qty_grosir ? parseFloat(p.min_qty_grosir) : null,
            stok_tersedia: stokNum,
        });

        setSearch('');
        searchInputRef.current?.focus();
    };

    const handleCheckout = async () => {
        if (metodeBayar === 'tunai' && numericBayar < total) {
            toast.error('Jumlah bayar kurang dari total!');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/pos/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    items: items.map(i => ({ product_id: i.product_id, qty: i.qty })),
                    metode_bayar: metodeBayar,
                    bayar: metodeBayar === 'tunai' ? numericBayar : total,
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Terjadi kesalahan saat checkout.');
            }

            clearCart();
            setShowPayment(false);
            setBayar('');
            setLastSale(data.sale);
            setShowReceipt(true);

            router.reload({ only: ['auth'] });

            if (autoPrint) {
                setTimeout(() => window.print(), 500);
            }

            toast.success('Transaksi Berhasil!');

            setSearch(' ');
            setTimeout(() => setSearch(''), 100);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    // ================= TAMPILAN MODAL BUKA SHIFT =================
    if (!activeShift) {
        return (
            <PosLayout>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#f5b800] flex items-center justify-center shrink-0 shadow-sm">
                                <Store className="text-gray-900 size-6" />
                            </div>
                            <div className="flex flex-col flex-1">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    Buka Shift Baru Kasir
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">Mulai sesi penjualan register #01</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800">
                                <User className="text-[#f5b800] size-5 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] text-gray-500">Petugas Kasir</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.nama}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800">
                                <Clock className="text-[#f5b800] size-5 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] text-gray-500">Waktu Buka</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                    Modal Awal Kas di Laci <span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className="relative flex items-center bg-gray-50 dark:bg-zinc-900 rounded-xl shadow-inner px-4 py-3 border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-[#f5b800] transition-all">
                                <span className="text-xl font-bold text-gray-500 pr-3">Rp</span>
                                <input
                                    type="text"
                                    value={formattedModalAwal}
                                    onChange={handleModalAwalChange}
                                    className="w-full bg-transparent text-3xl font-bold text-gray-900 dark:text-white tracking-tight outline-none placeholder:text-gray-300"
                                    placeholder="0"
                                    autoFocus
                                />
                                <button onClick={() => handlePreset('0')} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors">
                                    <Delete className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-gray-500 mr-1">Nominal Cepat:</span>
                            {['200.000', '300.000', '500.000', '1.000.000'].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handlePreset(val)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95",
                                        formattedModalAwal === val
                                            ? 'bg-[#f5b800] text-gray-900 ring-1 ring-[#f5b800]'
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                    )}
                                >
                                    Rp {val}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2">
                            <Link
                                href="/dashboard"
                                className="flex items-center justify-center px-6 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                onClick={submitOpenShift}
                                disabled={processingShift}
                                className="flex-1 h-12 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {processingShift ? 'Membuka Kasir...' : 'Buka Shift & Masuk POS'}
                            </button>
                        </div>
                    </div>
                </div>
            </PosLayout>
        );
    }

    // ================= TAMPILAN POS UTAMA =================
    return (
        <PosLayout>
            <Head title="POS - Kasir" />

            <div className="flex flex-1 h-full overflow-hidden">

                {/* PANEL KIRI: Katalog (62%) */}
                <div className="w-[62%] flex flex-col bg-[#f9f9f6] dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 p-4 gap-4 overflow-hidden">

                    {/* Search & Barcode Bar */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f5b800] size-6" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Ketik nama, SKU, atau scan barcode langsung..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    if (e.target.value.length > 0) setSelectedCategory(null);
                                }}
                                className="w-full h-14 pl-12 pr-16 rounded-xl bg-gray-100 dark:bg-zinc-900 text-base font-medium outline-none focus:ring-2 focus:ring-[#f5b800] dark:text-white transition-all shadow-inner"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <span className="px-2 py-1 rounded bg-white dark:bg-zinc-800 text-xs font-bold text-gray-500 shadow-sm">F2</span>
                                {search && (
                                    <button onClick={() => setSearch('')} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700">
                                        <Minus className="size-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                "h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2",
                                selectedCategory === null
                                    ? "bg-[#f5b800] text-gray-900 shadow-md"
                                    : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <span className={cn("w-2 h-2 rounded-full", selectedCategory === null ? "bg-gray-900" : "bg-[#f5b800]")}></span>
                            Semua Produk
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCategory(c.id)}
                                className={cn(
                                    "h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                                    selectedCategory === c.id
                                        ? "bg-[#f5b800] text-gray-900 shadow-md"
                                        : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                )}
                            >
                                {c.nama}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-10">
                            {isSearching && <p className="col-span-full text-center text-gray-500 py-8">Mencari produk...</p>}

                            {!isSearching && results.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                                    <PackageOpen className="size-16 mb-2 opacity-20" />
                                    <p>Produk tidak ditemukan.</p>
                                </div>
                            )}

                            {!isSearching && results.map((p) => {
                                const stokNum = parseFloat(p.stok);
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => handleTambahKeKeranjang(p)}
                                        className="group relative bg-white dark:bg-[#232019] rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer min-h-45 border border-gray-100 dark:border-zinc-800"
                                    >
                                        {/* GAMBAR PRODUK */}
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 mb-2 flex items-center justify-center">
                                            {p.gambar ? (
                                                <img src={`/storage/${p.gambar}`} alt={p.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-full h-full bg-[#f5b800]/10 flex items-center justify-center">
                                                    <span className="text-4xl font-bold text-[#f5b800]">{p.nama.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                            <span className={cn(
                                                "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm",
                                                stokNum <= 0 ? "bg-red-100 text-red-700" :
                                                    stokNum <= 5 ? "bg-orange-100 text-orange-700" :
                                                        "bg-white/90 text-gray-700"
                                            )}>
                                                Sisa {stokNum} {p.satuan}
                                            </span>
                                        </div>

                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">{p.kode_barang}</span>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mt-0.5 leading-snug">{p.nama}</h3>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-500">Harga</span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">Rp {formatRupiah(p.harga_jual)}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-[#f5b800] flex items-center justify-center text-gray-900 shadow-sm group-hover:scale-110 transition-transform">
                                                <Plus className="size-5" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* PANEL KANAN: Keranjang (38%) */}
                <div className="w-[38%] flex flex-col bg-white dark:bg-[#181612] p-4 shadow-2xl relative z-10">

                    {/* Header Keranjang */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="size-6 text-[#f5b800]" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Keranjang</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#f5b800] text-gray-900 text-xs font-bold">
                                {totalItems} Item
                            </span>
                        </div>
                        <button onClick={clearCart} className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1">
                            <Trash2 className="size-3.5" /> Kosongkan
                        </button>
                    </div>

                    {/* List Item */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-2">
                        {items.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <ShoppingBag className="mx-auto size-12 mb-2 opacity-20" />
                                    <p className="text-sm">Keranjang kosong.</p>
                                </div>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.product_id} className="bg-gray-50 dark:bg-[#232019] p-3 rounded-xl flex flex-col gap-2 shadow-sm border border-gray-100 dark:border-zinc-800/50">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.nama}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-medium text-[#f5b800]">Rp {formatRupiah(getItemPrice(item))}</span>
                                                <span className="text-xs text-gray-500">x {item.qty}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeItem(item.product_id)} className="text-gray-400 hover:text-red-500 p-1">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-lg p-0.5 border border-gray-200 dark:border-zinc-700">
                                            <button onClick={() => updateQty(item.product_id, item.qty - 1)} className="w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center">
                                                <Minus className="size-3.5 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            <span className="w-8 text-center font-bold text-sm dark:text-white">{item.qty}</span>
                                            <button
                                                onClick={() => {
                                                    if (item.qty >= item.stok_tersedia) {
                                                        toast.warning(`Maksimal stok ${item.nama} adalah ${item.stok_tersedia}`);
                                                    } else {
                                                        updateQty(item.product_id, item.qty + 1);
                                                    }
                                                }}
                                                className="w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                                            >
                                                <Plus className="size-3.5 text-gray-600 dark:text-gray-400" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-500 block">Subtotal</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                Rp {formatRupiah(getItemPrice(item) * item.qty)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Summary & Payment Action */}
                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#232019] flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Bayar</span>
                                <span className="text-xs text-gray-400">Termasuk pajak</span>
                            </div>
                            <span className="text-2xl font-bold text-[#f5b800]">Rp {formatRupiah(total)}</span>
                        </div>

                        <Button
                            disabled={items.length === 0}
                            onClick={() => setShowPayment(true)}
                            className="w-full h-16 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold text-lg shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                            <Wallet className="size-6" /> Lanjut ke Pembayaran
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setShowCloseShift(true)}
                            className="w-full h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 font-medium"
                        >
                            <Clock className="size-4 mr-2" /> Tutup Shift Saat Ini
                        </Button>
                    </div>
                </div>
            </div>

            {/* ================= MODAL PEMBAYARAN ================= */}
            {showPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="h-1.5 w-full bg-linear-to-r from-[#f5b800] via-yellow-300 to-[#f5b800]"></div>
                        <div className="px-6 pt-5 pb-3 flex items-start justify-between bg-white dark:bg-zinc-900">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#f5b800]"></span> Pembayaran Transaksi
                                </h2>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>Total Tagihan</span>
                                    <span>•</span>
                                    <span>Kasir: {user?.nama}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1">
                                <X className="size-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 pb-6 overflow-y-auto space-y-5">
                            {/* Total Banner */}
                            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-[#f5b800] to-yellow-400 p-5 text-gray-900 shadow-md">
                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
                                    <div>
                                        <span className="text-xs font-bold tracking-widest uppercase opacity-80">TOTAL TAGIHAN</span>
                                        <div className="text-4xl font-bold tracking-tight">Rp {formatRupiah(total)}</div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-gray-900">
                                        <span className="text-xs text-gray-500">PPN 11% Termasuk</span>
                                    </div>
                                </div>
                            </div>

                            {/* Metode Pilihan */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'tunai', label: 'Tunai (Cash)', icon: Wallet, desc: 'Laci Otomatis' },
                                    { id: 'transfer', label: 'Transfer Bank', icon: CreditCard, desc: 'BCA, Mandiri' },
                                    { id: 'qris', label: 'QRIS Dinamis', icon: QrCode, desc: 'GoPay, OVO' }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMetodeBayar(m.id as any)}
                                        className={cn(
                                            "p-3 rounded-xl flex flex-col text-left transition-all border-2",
                                            metodeBayar === m.id
                                                ? "bg-amber-50 dark:bg-[#2F2113] border-[#f5b800] text-gray-900 dark:text-white shadow-sm"
                                                : "bg-gray-50 dark:bg-zinc-800 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full mb-2">
                                            <m.icon className={cn("size-5", metodeBayar === m.id ? "text-[#f5b800]" : "text-gray-400")} />
                                            {metodeBayar === m.id && <CheckCircle2 className="size-4 text-[#f5b800]" />}
                                        </div>
                                        <span className="text-sm font-bold">{m.label}</span>
                                        <span className="text-[10px] text-gray-500 mt-0.5">{m.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Cash Input Section */}
                            {metodeBayar === 'tunai' && (
                                <div className="space-y-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> Uang Diterima
                                        </label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-4 text-gray-500 font-medium">Rp</div>
                                            <input
                                                type="text"
                                                value={bayar}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/\D/g, '');
                                                    setBayar(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
                                                }}
                                                className="w-full h-14 pl-12 pr-12 rounded-xl bg-white dark:bg-zinc-900 text-right text-2xl font-bold border-2 border-[#f5b800] outline-none"
                                                placeholder="0"
                                                autoFocus
                                            />
                                            <button onClick={() => setBayar('')} className="absolute right-4 text-gray-400 hover:text-gray-600">
                                                <Delete className="size-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Chips */}
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setBayar(total.toString())} className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-gray-100 text-sm font-semibold shadow-sm border border-gray-200">
                                            Uang Pas (Rp {formatRupiah(total)})
                                        </button>
                                        <button onClick={() => setBayar((numericBayar + 50000).toString())} className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-gray-100 text-sm font-semibold shadow-sm border border-gray-200">
                                            +Rp 50.000
                                        </button>
                                        <button onClick={() => setBayar('100000')} className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-gray-100 text-sm font-semibold shadow-sm border border-gray-200">
                                            Rp 100.000
                                        </button>
                                        <button onClick={() => setBayar('200000')} className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-gray-100 text-sm font-semibold shadow-sm border border-gray-200">
                                            Rp 200.000
                                        </button>
                                    </div>

                                    {/* Kembalian */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                numericBayar >= total ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            )}>
                                                <Wallet className="size-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kembalian</span>
                                                <div className={cn(
                                                    "text-xl font-bold",
                                                    numericBayar >= total ? 'text-gray-900 dark:text-white' : 'text-red-500'
                                                )}>
                                                    Rp {formatRupiah(kembalian)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-xs font-bold",
                                            numericBayar >= total ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        )}>
                                            {numericBayar >= total ? 'Lunas' : 'Kurang'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Toggles */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Printer className="size-4 text-gray-500" />
                                        <span className="text-sm font-medium">Cetak Struk Otomatis</span>
                                    </div>
                                    <input type="checkbox" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} className="w-5 h-5 accent-[#f5b800]" />
                                </label>
                                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="size-4 text-gray-500" />
                                        <span className="text-sm font-medium">Kirim E-Struk</span>
                                    </div>
                                    <input type="checkbox" checked={sendWA} onChange={(e) => setSendWA(e.target.checked)} className="w-5 h-5 accent-[#f5b800]" />
                                </label>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-4">
                            <Button variant="outline" onClick={() => setShowPayment(false)} className="h-12 px-6">
                                Batal
                            </Button>
                            <Button
                                onClick={handleCheckout}
                                disabled={isSubmitting || (metodeBayar === 'tunai' && numericBayar < total)}
                                className="flex-1 h-12 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold text-base shadow-md rounded-xl"
                            >
                                {isSubmitting ? 'Memproses...' : 'Selesaikan & Buka Laci'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL STRUK (JAGGED EDGE) ================= */}
            {showReceipt && lastSale && (
                <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="relative w-full max-w-100 my-auto flex flex-col items-center animate-in fade-in zoom-in-95">

                        {/* Success Header */}
                        <div className="flex flex-col items-center text-center mb-4">
                            <div className="relative flex items-center justify-center mb-2">
                                <span className="absolute w-16 h-16 rounded-full bg-green-500/20 animate-ping opacity-75"></span>
                                <div className="relative w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="size-8" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Transaksi Berhasil!</h2>
                            <p className="text-sm text-gray-300">Pembayaran telah diterima dan tersimpan</p>
                        </div>

                        {/* Struk Kertas Thermal */}
                        <div className="w-full bg-white text-gray-900 shadow-2xl relative">
                            {/* Efek Gerigi Atas (SVG) */}
                            <div className="w-full h-3.5 overflow-hidden -mb-px">
                                <svg className="w-full h-full fill-white" preserveAspectRatio="none" viewBox="0 0 400 14">
                                    <polygon points="0,14 10,0 20,14 30,0 40,14 50,0 60,14 70,0 80,14 90,0 100,14 110,0 120,14 130,0 140,14 150,0 160,14 170,0 180,14 190,0 200,14 210,0 220,14 230,0 240,14 250,0 260,14 270,0 280,14 290,0 300,14 310,0 320,14 330,0 340,14 350,0 360,14 370,0 380,14 390,0 400,14"></polygon>
                                </svg>
                            </div>

                            <div id="print-section" className="px-6 py-5 flex flex-col font-mono text-sm relative">
                                <div className="text-center pb-4 border-b-2 border-dashed border-gray-300">
                                    <h2 className="text-lg font-bold uppercase">{app_settings?.store_name || 'SARTIKA MOTOR'}</h2>
                                    <p className="text-xs text-gray-600 mt-1">{app_settings?.store_address}</p>
                                    <p className="text-xs text-gray-600">Telp: {app_settings?.store_phone}</p>
                                </div>

                                <div className="py-3 flex flex-col gap-1 border-b border-dashed border-gray-300 text-xs">
                                    <div className="flex justify-between"><span className="text-gray-500">No. Struk</span><span className="font-bold">{lastSale.no_transaksi}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Kasir</span><span>{lastSale.kasir?.nama}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Waktu</span><span>{new Date(lastSale.tanggal).toLocaleString('id-ID')}</span></div>
                                </div>

                                <div className="py-3 flex flex-col gap-2 border-b border-dashed border-gray-300 text-xs">
                                    {lastSale.items.map((item: any) => (
                                        <div key={item.id} className="flex flex-col gap-0.5">
                                            <div className="flex justify-between font-medium">
                                                <span>{item.nama_produk}</span>
                                                <span>{formatRupiah(item.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500">
                                                <span>{item.qty} x {formatRupiah(item.harga_jual)}</span>
                                                <span>{item.kode_barang}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="py-3 flex flex-col gap-1 border-b-2 border-dashed border-gray-300 text-xs">
                                    <div className="flex justify-between font-bold text-sm">
                                        <span>TOTAL AKHIR</span>
                                        <span>Rp {formatRupiah(lastSale.total)}</span>
                                    </div>
                                    <div className="flex justify-between mt-1 text-gray-600">
                                        <span>BAYAR ({lastSale.metode_bayar})</span>
                                        <span>Rp {formatRupiah(lastSale.bayar)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>KEMBALI</span>
                                        <span>Rp {formatRupiah(lastSale.kembalian)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 pb-2 flex flex-col items-center gap-2">
                                    <div className="p-1 bg-white border-2 border-gray-200 rounded">
                                        <div className="w-20 h-20 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Sample')] bg-cover opacity-50"></div>
                                    </div>
                                    <p className="text-[10px] text-center text-gray-500 max-w-50">
                                        {app_settings?.receipt_footer}
                                    </p>
                                </div>
                            </div>

                            {/* Efek Gerigi Bawah (SVG) */}
                            <div className="w-full h-3.5 overflow-hidden -mt-px">
                                <svg className="w-full h-full fill-white" preserveAspectRatio="none" viewBox="0 0 400 14">
                                    <polygon points="0,0 10,14 20,0 30,14 40,0 50,14 60,0 70,14 80,0 90,14 100,0 110,14 120,0 130,14 140,0 150,14 160,0 170,14 180,0 190,14 200,0 210,14 220,0 230,14 240,0 250,14 260,0 270,14 280,0 290,14 300,0 310,14 320,0 330,14 340,0 350,14 360,0 370,14 380,0 390,14 400,0"></polygon>
                                </svg>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="w-full flex flex-col gap-2 mt-4 no-print">
                            <Button onClick={() => window.print()} className="w-full h-12 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold rounded-xl shadow-lg">
                                <Printer className="size-5 mr-2" /> Cetak Struk [F9]
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => { toast.success('E-Struk berhasil dikirim!'); }} className="w-full h-10 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl">
                                    <QrCode className="size-4 mr-2 text-green-600" /> Kirim WhatsApp
                                </Button>
                                <Button variant="outline" onClick={() => setShowReceipt(false)} className="w-full h-10 border-gray-600 text-white hover:bg-white/10 rounded-xl">
                                    Tutup [Esc]
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL TUTUP SHIFT ================= */}
            {showCloseShift && activeShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-gray-100 dark:border-zinc-800">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#f5b800] text-gray-900 flex items-center justify-center shrink-0">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rekonsiliasi & Tutup Shift</h2>
                                    <p className="text-xs text-gray-500 mt-1">Kasir: {user?.nama} • Register Utama</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCloseShift(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4 overflow-y-auto space-y-4">
                            {/* Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 flex flex-col justify-between">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Modal Awal</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">Rp {formatRupiah(activeShift.modal_awal)}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 flex flex-col justify-between">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Penjualan Tunai</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">Rp {formatRupiah(activeShift.penjualan_tunai_sementara || 0)}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-[#f5b800]/10 dark:bg-[#f5b800]/20 flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#f5b800]/20 rounded-full -mr-6 -mt-6"></div>
                                    <span className="text-[10px] font-bold text-[#f5b800] uppercase tracking-wider mb-1 relative z-10">Uang Seharusnya</span>
                                    <span className="text-lg font-bold text-[#f5b800] relative z-10">Rp {formatRupiah(expectedCash)}</span>
                                </div>
                            </div>

                            {/* Input Uang Fisik */}
                            <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Uang Fisik Terhitung (Cash Count) *</label>
                                    <button onClick={() => setShowDenom(!showDenom)} className="text-xs font-semibold text-[#f5b800] hover:underline flex items-center gap-1">
                                        <Plus className="size-3" /> {showDenom ? 'Tutup Rincian' : 'Buka Rincian Pecahan'}
                                    </button>
                                </div>

                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-gray-500 font-bold">Rp</span>
                                    <input
                                        type="number"
                                        value={uangFisik}
                                        onChange={(e) => setUangFisik(e.target.value)}
                                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-zinc-950 text-xl font-bold text-gray-900 dark:text-white border-2 border-[#f5b800] outline-none"
                                        placeholder="0"
                                    />
                                    <button onClick={() => setUangFisik(expectedCash.toString())} className="absolute right-3 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-semibold">
                                        Sesuai Sistem
                                    </button>
                                </div>

                                {/* Denom Breakdown */}
                                {showDenom && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 animate-in slide-in-from-top-2">
                                        {[
                                            { label: '100.000', key: 'd100k' },
                                            { label: '50.000', key: 'd50k' },
                                            { label: '20.000', key: 'd20k' },
                                            { label: '10.000', key: 'd10k' },
                                            { label: '5.000', key: 'd5k' },
                                            { label: '2.000', key: 'd2k' },
                                            { label: '1.000', key: 'd1k' },
                                        ].map((item) => (
                                            <div key={item.key} className="bg-white dark:bg-zinc-950 p-2 rounded-lg border border-gray-200 dark:border-zinc-700">
                                                <span className="text-[10px] text-gray-500 block mb-1">Rp {item.label}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={denoms[item.key as keyof typeof denoms] || ''}
                                                    onChange={(e) => handleDenomChange(item.key as keyof typeof denoms, e.target.value)}
                                                    className="w-full h-8 text-center text-sm font-bold bg-gray-50 dark:bg-zinc-900 rounded outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selisih Banner */}
                            <div className={cn(
                                "p-4 rounded-xl flex items-center justify-between transition-colors",
                                selisih === 0 ? "bg-gray-100 dark:bg-zinc-800" :
                                    selisih > 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-red-50 dark:bg-red-900/20"
                            )}>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        selisih === 0 ? "bg-gray-200 text-gray-500" :
                                            selisih > 0 ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
                                    )}>
                                        {selisih === 0 ? <CheckCircle2 className="size-5" /> : <Info className="size-5" />}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Status Rekonsiliasi</span>
                                        <div className="text-sm font-bold">
                                            {selisih === 0 ? 'Seimbang / Sempurna' : selisih > 0 ? 'Surplus (Uang Lebih)' : 'Defisit (Uang Kurang)'}
                                        </div>
                                    </div>
                                </div>
                                <div className={cn(
                                    "text-xl font-bold",
                                    selisih === 0 ? "text-gray-900 dark:text-white" :
                                        selisih > 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                                )}>
                                    {selisih > 0 ? '+' : ''}Rp {formatRupiah(selisih)}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <Button variant="outline" onClick={() => setShowCloseShift(false)}>Batal</Button>
                            <Button onClick={handleCloseShift} disabled={isClosingShift} className="bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold px-6">
                                <Lock className="size-4 mr-2" /> {isClosingShift ? 'Memproses...' : 'Konfirmasi & Tutup'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </PosLayout>
    );
}