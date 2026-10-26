import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEvent, useRef, ChangeEvent } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    PlusCircle, Search, Pencil, Trash2, CreditCard,
    Wallet, QrCode, Building2, User, Hash, CheckCircle2,
    XCircle, X, ShieldCheck, Copy, Check, Upload, Eye, FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
    id: number;
    nama: string;
    tipe: 'tunai' | 'transfer' | 'qris';
    nama_bank: string | null;
    nomor_rekening: string | null;
    atas_nama: string | null;
    qr_image: string | null;
    aktif: boolean;
    urutan: number;
    keterangan: string | null;
    sales_count?: number;
}

interface Props {
    paymentMethods: PaymentMethod[];
}

export default function Index({ paymentMethods }: Props) {
    const [search, setSearch] = useState('');
    const [filterTipe, setFilterTipe] = useState<'all' | 'tunai' | 'transfer' | 'qris'>('all');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [existingQrImage, setExistingQrImage] = useState<string | null>(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
    const [viewQrModal, setViewQrModal] = useState<{ show: boolean; url: string; nama: string }>({
        show: false, url: '', nama: ''
    });

    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null; nama: string }>({
        show: false, id: null, nama: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form Inertia
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        tipe: 'tunai' | 'transfer' | 'qris';
        nama_bank: string;
        nomor_rekening: string;
        atas_nama: string;
        qr_image: File | null;
        aktif: boolean;
        urutan: number;
        keterangan: string;
    }>({
        tipe: 'transfer',
        nama_bank: '',
        nomor_rekening: '',
        atas_nama: '',
        qr_image: null,
        aktif: true,
        urutan: paymentMethods.length + 1,
        keterangan: '',
    });

    // Handle File QRIS Selection
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('qr_image', file);
            setQrPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeSelectedImage = () => {
        setData('qr_image', null);
        setQrPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Submit Create or Update
    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (editingId) {
            // Update mode via POST
            post(`/payment-methods/${editingId}`, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    cancelEdit();
                    toast.success('Metode pembayaran berhasil diperbarui');
                },
                onError: (errs) => {
                    toast.error('Gagal memperbarui', {
                        description: Object.values(errs)[0] || 'Periksa kembali isian form Anda.'
                    });
                }
            });
        } else {
            // Create mode
            post('/payment-methods', {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    resetForm();
                    toast.success('Metode pembayaran berhasil ditambahkan');
                },
                onError: (errs) => {
                    toast.error('Gagal menambahkan', {
                        description: Object.values(errs)[0] || 'Periksa kembali isian form Anda.'
                    });
                }
            });
        }
    };

    // Start Edit
    const startEdit = (method: PaymentMethod) => {
        setEditingId(method.id);
        setData({
            tipe: method.tipe,
            nama_bank: method.nama_bank || '',
            nomor_rekening: method.nomor_rekening || '',
            atas_nama: method.atas_nama || '',
            qr_image: null,
            aktif: method.aktif,
            urutan: method.urutan,
            keterangan: method.keterangan || '',
        });
        setExistingQrImage(method.qr_image ? `/storage/${method.qr_image}` : null);
        setQrPreviewUrl(null);
        clearErrors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        reset();
        setData({
            tipe: 'transfer',
            nama_bank: '',
            nomor_rekening: '',
            atas_nama: '',
            qr_image: null,
            aktif: true,
            urutan: paymentMethods.length + 1,
            keterangan: '',
        });
        setExistingQrImage(null);
        setQrPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetForm();
        clearErrors();
    };

    // Toggle Status Aktif/Nonaktif
    const handleToggleStatus = (method: PaymentMethod) => {
        router.patch(`/payment-methods/${method.id}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Status ${method.nama} diubah`);
            }
        });
    };

    // Confirm Delete
    const confirmDelete = (method: PaymentMethod) => {
        if ((method.sales_count ?? 0) > 0) {
            toast.error('Tidak bisa menghapus', {
                description: `Metode ini digunakan dalam ${method.sales_count} transaksi penjualan. Anda dapat menonaktifkannya agar tidak muncul di POS.`
            });
            return;
        }
        setDeleteModal({ show: true, id: method.id, nama: method.nama });
    };

    const executeDelete = () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        router.delete(`/payment-methods/${deleteModal.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, nama: '' });
                toast.success('Metode pembayaran berhasil dihapus');
                if (editingId === deleteModal.id) cancelEdit();
            },
            onError: (errs) => {
                toast.error('Gagal menghapus', {
                    description: Object.values(errs)[0] || 'Terjadi kesalahan sistem.'
                });
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Disalin ke clipboard', { description: text });
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filter payment methods
    const filteredMethods = paymentMethods.filter(m => {
        const matchSearch = m.nama.toLowerCase().includes(search.toLowerCase()) ||
            (m.nama_bank && m.nama_bank.toLowerCase().includes(search.toLowerCase())) ||
            (m.nomor_rekening && m.nomor_rekening.includes(search)) ||
            (m.atas_nama && m.atas_nama.toLowerCase().includes(search.toLowerCase()));

        const matchTipe = filterTipe === 'all' || m.tipe === filterTipe;

        return matchSearch && matchTipe;
    });

    const activeCount = paymentMethods.filter(m => m.aktif).length;

    return (
        <AdminLayout>
            <Head title="Metode Pembayaran POS" />

            <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto w-full space-y-6">

                {/* Header Context */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f5b800] inline-block"></span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Konfigurasi Kasir</span>
                        <span className="text-gray-300 text-sm">/</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-900 dark:text-white">Metode Pembayaran</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ShieldCheck className="size-4 text-[#f5b800]" />
                        <span>Integrasi POS: <span className="font-medium text-gray-900 dark:text-white">Langsung Muncul di Checkout</span></span>
                    </div>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-xs text-gray-500 font-medium">Total Metode</span>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{paymentMethods.length}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
                            <CreditCard className="size-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-xs text-gray-500 font-medium">Aktif di Kasir POS</span>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-xs text-gray-500 font-medium">Metode Nonaktif</span>
                            <div className="text-2xl font-bold text-gray-400 mt-1">{paymentMethods.length - activeCount}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                            <XCircle className="size-5" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                    {/* KIRI: FORM TAMBAH / EDIT */}
                    <div className="xl:col-span-5 xl:sticky xl:top-20 space-y-4">
                        <div className={`rounded-xl p-6 shadow-sm border transition-colors ${editingId ? 'bg-amber-50/50 dark:bg-[#2F2113] border-amber-300 dark:border-amber-900/40' : 'bg-white dark:bg-[#232019] border-gray-100 dark:border-zinc-800'}`}>

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {editingId ? 'Edit Metode Pembayaran' : 'Tambah Metode Baru'}
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span>
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {editingId ? 'Perbarui informasi nomor rekening atau QRIS.' : 'Daftarkan opsi pembayaran untuk kasir.'}
                                    </p>
                                </div>
                                {editingId ? (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold uppercase tracking-wider">Mode Edit</span>
                                ) : (
                                    <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">Baru</span>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-4">

                                {/* PILIHAN KATEGORI / TIPE */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        Kategori Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'transfer', label: 'Transfer', icon: Building2, desc: 'Rekening Bank' },
                                            { id: 'qris', label: 'QRIS', icon: QrCode, desc: 'Barcode Scan' },
                                            { id: 'tunai', label: 'Tunai', icon: Wallet, desc: 'Uang Fisik' }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setData('tipe', t.id as any)}
                                                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${data.tipe === t.id
                                                    ? 'border-[#f5b800] bg-amber-50 dark:bg-amber-950/30 text-gray-900 dark:text-white font-semibold ring-1 ring-[#f5b800]'
                                                    : 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                    }`}
                                            >
                                                <t.icon className={`size-5 mb-1.5 ${data.tipe === t.id ? 'text-[#f5b800]' : 'text-gray-400'}`} />
                                                <span className="text-xs">{t.label}</span>
                                                <span className="text-[10px] text-gray-400 mt-0.5">{t.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.tipe && <p className="text-xs text-red-500 mt-1">{errors.tipe}</p>}
                                </div>

                                {/* INFO KHUSUS KATEGORI TUNAI */}
                                {data.tipe === 'tunai' && (
                                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1 animate-in fade-in duration-200">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                            <Wallet className="size-4" /> Pembayaran Tunai (Cash)
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Metode pembayaran uang fisik kasir. Dilengkapi perhitungan otomatis uang diterima dan nominal kembalian di layar kasir POS.
                                        </p>
                                    </div>
                                )}

                                {/* FIELD KHUSUS KATEGORI TRANSFER */}
                                {data.tipe === 'transfer' && (
                                    <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-3 animate-in fade-in duration-200">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                                            <Building2 className="size-4" /> Detail Rekening Bank
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Nama Bank <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.nama_bank}
                                                onChange={(e) => setData('nama_bank', e.target.value)}
                                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f5b800] outline-none"
                                                placeholder="BCA, Mandiri, BRI, BNI, Jago, dll"
                                                required={data.tipe === 'transfer'}
                                            />
                                            {errors.nama_bank && <p className="text-xs text-red-500 mt-1">{errors.nama_bank}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Nomor Rekening <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                                <input
                                                    type="text"
                                                    value={data.nomor_rekening}
                                                    onChange={(e) => setData('nomor_rekening', e.target.value)}
                                                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f5b800] outline-none"
                                                    placeholder="Contoh: 1234567890"
                                                    required={data.tipe === 'transfer'}
                                                />
                                            </div>
                                            {errors.nomor_rekening && <p className="text-xs text-red-500 mt-1">{errors.nomor_rekening}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Atas Nama Pemilik Rekening <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                                <input
                                                    type="text"
                                                    value={data.atas_nama}
                                                    onChange={(e) => setData('atas_nama', e.target.value)}
                                                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f5b800] outline-none"
                                                    placeholder="Nama tertera di buku tabungan"
                                                    required={data.tipe === 'transfer'}
                                                />
                                            </div>
                                            {errors.atas_nama && <p className="text-xs text-red-500 mt-1">{errors.atas_nama}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* FIELD KHUSUS KATEGORI QRIS */}
                                {data.tipe === 'qris' && (
                                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-3 animate-in fade-in duration-200">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                                            <QrCode className="size-4" /> Upload Gambar Barcode QRIS
                                        </div>

                                        {/* Dropzone / Upload area */}
                                        <div className="space-y-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="qris-upload"
                                            />

                                            {/* Preview Image jika ada */}
                                            {(qrPreviewUrl || existingQrImage) ? (
                                                <div className="relative border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl p-3 bg-white dark:bg-zinc-900 flex flex-col items-center">
                                                    <img
                                                        src={qrPreviewUrl || existingQrImage || ''}
                                                        alt="QRIS Preview"
                                                        className="h-44 w-44 object-contain rounded-lg border border-gray-100 dark:border-zinc-800 shadow-inner bg-white"
                                                    />
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <label
                                                            htmlFor="qris-upload"
                                                            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer transition-colors"
                                                        >
                                                            Ganti Gambar
                                                        </label>
                                                        {qrPreviewUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={removeSelectedImage}
                                                                className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-xs font-medium text-red-600 transition-colors"
                                                            >
                                                                Batal Pilih
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <label
                                                    htmlFor="qris-upload"
                                                    className="border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-[#f5b800] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-white dark:bg-zinc-900 transition-colors group"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-[#f5b800] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                        <Upload className="size-6" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                        Klik untuk pilih foto / scan QRIS
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 mt-1">
                                                        Mendukung format JPG, PNG, atau WebP (Maks. 3 MB)
                                                    </span>
                                                </label>
                                            )}
                                            {errors.qr_image && <p className="text-xs text-red-500 mt-1">{errors.qr_image}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* URUTAN & KETERANGAN */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-1 space-y-1">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Urutan Tampil
                                        </label>
                                        <input
                                            type="number"
                                            value={data.urutan}
                                            onChange={(e) => setData('urutan', parseInt(e.target.value) || 0)}
                                            className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f5b800] outline-none"
                                            min="0"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Catatan / Instruksi (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.keterangan}
                                            onChange={(e) => setData('keterangan', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f5b800] outline-none"
                                            placeholder="misal: Konfirmasi screenshot kasir"
                                        />
                                    </div>
                                </div>

                                {/* TOGGLE AKTIF */}
                                <div className="pt-2">
                                    <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-100 dark:border-zinc-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-2.5 h-2.5 rounded-full ${data.aktif ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                            <div>
                                                <span className="text-xs font-bold text-gray-800 dark:text-white block">Status Aktif di Kasir POS</span>
                                                <span className="text-[10px] text-gray-500">Tampilkan metode ini saat proses pembayaran POS</span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data.aktif}
                                            onChange={(e) => setData('aktif', e.target.checked)}
                                            className="w-5 h-5 accent-[#f5b800] rounded cursor-pointer"
                                        />
                                    </label>
                                </div>

                                {/* BUTTONS */}
                                <div className="pt-3 space-y-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-11 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold rounded-xl shadow-sm transition-all"
                                    >
                                        <PlusCircle className="size-5 mr-2" />
                                        {processing ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambahkan Metode')}
                                    </Button>

                                    {editingId && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={cancelEdit}
                                            className="w-full h-10 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            <X className="size-4 mr-2" /> Batal Edit
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* KANAN: TABEL METODE PEMBAYARAN */}
                    <div className="xl:col-span-7 space-y-4">

                        {/* Search & Tabs Filter */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                        Daftar Metode Pembayaran
                                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[11px] font-bold">
                                            {paymentMethods.length}
                                        </span>
                                    </h1>
                                    <p className="text-xs text-gray-500 mt-0.5">Semua opsi pembayaran yang tersedia di layar kasir.</p>
                                </div>

                                {/* Search Bar */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama, bank, norek..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Kategori Filter Tabs */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                {[
                                    { id: 'all', label: 'Semua' },
                                    { id: 'transfer', label: 'Transfer Bank' },
                                    { id: 'qris', label: 'QRIS' },
                                    { id: 'tunai', label: 'Tunai' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilterTipe(tab.id as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${filterTipe === tab.id
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                                            : 'bg-gray-100 dark:bg-zinc-800/70 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List / Cards */}
                        <div className="space-y-3">
                            {filteredMethods.length === 0 ? (
                                <div className="bg-white dark:bg-[#232019] border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-gray-400 mb-3">
                                        <CreditCard className="size-6" />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tidak ada metode pembayaran</h3>
                                    <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau tambahkan metode baru di form sebelah kiri.</p>
                                </div>
                            ) : (
                                filteredMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        className={`bg-white dark:bg-[#232019] border rounded-xl p-4 transition-all shadow-sm hover:shadow-md ${method.aktif
                                            ? 'border-gray-200/80 dark:border-zinc-800'
                                            : 'border-dashed border-gray-200 dark:border-zinc-800 opacity-60 bg-gray-50/50 dark:bg-zinc-900/40'
                                            }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            {/* Info Kiri */}
                                            <div className="flex items-start gap-3.5">
                                                {/* Icon Badge */}
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${method.tipe === 'tunai'
                                                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                                                    : method.tipe === 'transfer'
                                                        ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600'
                                                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600'
                                                    }`}>
                                                    {method.tipe === 'tunai' && <Wallet className="size-5" />}
                                                    {method.tipe === 'transfer' && <Building2 className="size-5" />}
                                                    {method.tipe === 'qris' && <QrCode className="size-5" />}
                                                </div>

                                                {/* Detail Konten */}
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                                            {method.nama}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${method.tipe === 'tunai'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : method.tipe === 'transfer'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                            }`}>
                                                            {method.tipe}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                                                            Urutan #{method.urutan}
                                                        </span>
                                                    </div>

                                                    {/* Keterangan Tipe Spesifik */}
                                                    {method.tipe === 'transfer' && (
                                                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                                            <span className="font-semibold text-gray-900 dark:text-white px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800">
                                                                {method.nama_bank}
                                                            </span>
                                                            <span className="font-mono font-medium text-gray-900 dark:text-white bg-blue-50/50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                                                                {method.nomor_rekening}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => method.nomor_rekening && copyToClipboard(method.nomor_rekening, method.id)}
                                                                className="text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                                                                title="Salin No Rekening"
                                                            >
                                                                {copiedId === method.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                                                            </button>
                                                            <span className="text-gray-400 text-[11px]">
                                                                a.n {method.atas_nama}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {method.tipe === 'qris' && (
                                                        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                                            {method.qr_image ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewQrModal({ show: true, url: `/storage/${method.qr_image}`, nama: method.nama })}
                                                                    className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline font-medium"
                                                                >
                                                                    <Eye className="size-3.5" /> Lihat Barcode QRIS
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-400 italic text-[11px]">Belum ada gambar barcode diupload</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {method.tipe === 'tunai' && (
                                                        <div className="mt-1 text-xs text-gray-400">
                                                            Input nominal uang tunai dan perhitungan kembalian otomatis.
                                                        </div>
                                                    )}

                                                    {method.keterangan && (
                                                        <p className="text-[11px] text-gray-400 mt-1 italic">
                                                            "{method.keterangan}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Aksi Kanan */}
                                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-zinc-800">
                                                {/* Toggle Aktif Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(method)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${method.aktif
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 hover:bg-gray-200'
                                                        }`}
                                                    title={method.aktif ? 'Klik untuk nonaktifkan di POS' : 'Klik untuk aktifkan di POS'}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${method.aktif ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                    {method.aktif ? 'Aktif di POS' : 'Nonaktif'}
                                                </button>

                                                {/* Edit & Delete Action Buttons */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(method)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                        title="Edit Metode"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => confirmDelete(method)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Hapus Metode"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL PREVIEW QR CODE */}
            {viewQrModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-center">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">{viewQrModal.nama}</h3>
                            <button
                                onClick={() => setViewQrModal({ show: false, url: '', nama: '' })}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-inner flex items-center justify-center">
                            <img
                                src={viewQrModal.url}
                                alt="Barcode QRIS"
                                className="w-64 h-64 object-contain"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Gambar ini akan ditampilkan saat kasir memilih pembayaran QRIS di checkout POS.</p>
                        <Button
                            onClick={() => setViewQrModal({ show: false, url: '', nama: '' })}
                            className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        >
                            Tutup
                        </Button>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                            <Trash2 className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Hapus Metode Pembayaran?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Apakah Anda yakin ingin menghapus metode <strong className="text-gray-900 dark:text-white">"{deleteModal.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setDeleteModal({ show: false, id: null, nama: '' })} disabled={isDeleting}>
                                Batal
                            </Button>
                            <Button onClick={executeDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
