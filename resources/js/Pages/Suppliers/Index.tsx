import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEvent } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    PlusCircle, Search, Pencil, Trash2, Truck,
    Phone, MapPin, MessageCircle, X, ShieldCheck, Download, Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
    id: number;
    nama: string;
    telepon: string | null;
    alamat: string | null;
}

interface Props {
    suppliers: Supplier[];
}

export default function Index({ suppliers }: Props) {
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null; nama: string }>({
        show: false, id: null, nama: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        telepon: '',
        alamat: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/suppliers/${editingId}`, {
                onSuccess: () => {
                    cancelEdit();
                },
                preserveScroll: true,
            });
        } else {
            post('/suppliers', {
                onSuccess: () => {
                    reset();
                },
                preserveScroll: true,
            });
        }
    };

    const startEdit = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setData({
            nama: supplier.nama,
            telepon: supplier.telepon || '',
            alamat: supplier.alamat || '',
        });
        clearErrors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset();
        clearErrors();
    };

    const confirmDelete = (supplier: Supplier) => {
        setDeleteModal({ show: true, id: supplier.id, nama: supplier.nama });
    };

    const executeDelete = () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        router.delete(`/suppliers/${deleteModal.id}`, {
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, nama: '' });
                if (editingId === deleteModal.id) cancelEdit();
            },
            onFinish: () => setIsDeleting(false),
            preserveScroll: true,
        });
    };

    // Filter data berdasarkan pencarian
    const filteredSuppliers = suppliers.filter(s =>
        s.nama.toLowerCase().includes(search.toLowerCase()) ||
        (s.telepon && s.telepon.includes(search))
    );

    const isAllSelected = filteredSuppliers.length > 0 && filteredSuppliers.every(s => selectedIds.includes(s.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSuppliers.map(s => s.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleting(true);
        router.post('/suppliers/bulk-delete', { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setBulkDeleteModal(false);
            },
            onFinish: () => setIsBulkDeleting(false),
            preserveScroll: true,
        });
    };

    const handleExportSelected = () => {
        const selectedSuppliers = suppliers.filter(s => selectedIds.includes(s.id));
        if (selectedSuppliers.length === 0) return;

        const headers = ['ID', 'Nama Supplier', 'Telepon', 'Alamat'];
        const rows = selectedSuppliers.map(s => [
            `SUP-${s.id.toString().padStart(3, '0')}`,
            `"${s.nama.replace(/"/g, '""')}"`,
            `"${s.telepon || '-'}"`,
            `"${(s.alamat || '-').replace(/"/g, '""')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `supplier_terpilih_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${selectedSuppliers.length} supplier berhasil diekspor`);
    };

    // Format WA Link
    const getWhatsAppLink = (phone: string | null) => {
        if (!phone) return '#';
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
        return `https://wa.me/${cleaned}`;
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Supplier" />

            <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header Context */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Inventori & Logistik</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#f5b800] inline-block"></span> Manajemen Supplier
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                    {/* KIRI: FORM TAMBAH / EDIT */}
                    <div className="xl:col-span-4 xl:sticky xl:top-20 flex flex-col gap-4">
                        <div className={`rounded-xl p-6 shadow-sm border transition-colors ${editingId ? 'bg-orange-50 dark:bg-[#2F2113] border-orange-200 dark:border-orange-900/30' : 'bg-white dark:bg-[#232019] border-gray-100 dark:border-zinc-800'}`}>

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#f5b800] inline-block"></span>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {editingId ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                                    </h2>
                                </div>
                                {editingId ? (
                                    <span className="px-2 py-1 rounded bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wide">Edit Mode</span>
                                ) : (
                                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wide">Draft Baru</span>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Perusahaan / Supplier *</label>
                                    <div className="relative">
                                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                        <input
                                            type="text"
                                            value={data.nama}
                                            onChange={(e) => setData('nama', e.target.value)}
                                            className="w-full h-11 pl-10 pr-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                            placeholder="Contoh: PT Gramedia Distribusi"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nomor Telepon / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                        <input
                                            type="tel"
                                            value={data.telepon}
                                            onChange={(e) => setData('telepon', e.target.value)}
                                            className="w-full h-11 pl-10 pr-3 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                            placeholder="0812-3456-7890"
                                        />
                                    </div>
                                    {errors.telepon && <p className="text-xs text-red-500 mt-1">{errors.telepon}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alamat Lengkap</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-gray-400 size-4" />
                                        <textarea
                                            value={data.alamat}
                                            onChange={(e) => setData('alamat', e.target.value)}
                                            className="w-full p-3 pl-10 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#f5b800] outline-none transition-all resize-none"
                                            placeholder="Kawasan Industri Blok B No. 4, Jakarta"
                                            rows={3}
                                        />
                                    </div>
                                    {errors.alamat && <p className="text-xs text-red-500 mt-1">{errors.alamat}</p>}
                                </div>

                                <div className="pt-2 flex items-center gap-2">
                                    <Button type="submit" disabled={processing} className="flex-1 h-11 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold rounded-xl shadow-sm">
                                        <PlusCircle className="size-5 mr-2" /> {processing ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Supplier')}
                                    </Button>
                                    {editingId && (
                                        <Button type="button" variant="outline" onClick={cancelEdit} className="h-11 px-4 rounded-xl text-gray-500">
                                            <X className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* SOP Helper Card */}
                        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 flex items-start gap-3 border border-gray-100 dark:border-zinc-800">
                            <div className="w-8 h-8 rounded-lg bg-[#f5b800]/20 flex items-center justify-center shrink-0">
                                <ShieldCheck className="text-[#f5b800] size-4" />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block">SOP Pengadaan</span>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Supplier aktif akan dapat dipilih langsung saat pembuatan Surat Jalan Stok Masuk dan PO Restock.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* KANAN: METRIK & TABEL */}
                    <div className="xl:col-span-8 flex flex-col gap-6">

                        {/* 3 Mini Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Supplier</span>
                                    <Truck className="size-4 text-[#f5b800]" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.length} Mitra</div>
                                <div className="text-[11px] text-gray-500 mt-1">Terdaftar di sistem</div>
                            </div>

                            <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Supplier Terhubung</span>
                                    <MessageCircle className="size-4 text-green-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {suppliers.filter(s => s.telepon).length} WA
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">Memiliki kontak telepon</div>
                            </div>

                            <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Alamat Terdata</span>
                                    <MapPin className="size-4 text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {suppliers.filter(s => s.alamat).length} Lokasi
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">Info alamat gudang</div>
                            </div>
                        </div>

                        {/* Bulk Action Bar */}
                        {selectedIds.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#f5b800]/10 border border-[#f5b800]/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#f5b800] animate-pulse"></span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {selectedIds.length} supplier dipilih
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedIds([])}
                                        className="h-8 text-xs font-medium"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportSelected}
                                        className="h-8 text-xs font-semibold flex items-center gap-1.5"
                                    >
                                        <Download className="size-3.5" />
                                        Ekspor Terpilih
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setBulkDeleteModal(true)}
                                        className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5"
                                    >
                                        <Trash2 className="size-3.5" />
                                        Hapus Terpilih ({selectedIds.length})
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Tabel Supplier */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col w-full max-w-full">

                            {/* Table Header & Search */}
                            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Supplier</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold">{suppliers.length} Terdaftar</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Kelola data vendor resmi dan kontak pengadaan.</p>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <input
                                        type="text"
                                        placeholder="Cari supplier atau telepon..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-200">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-5 font-semibold w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={toggleSelectAll}
                                                    className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3 px-4 font-semibold">Nama Supplier</th>
                                            <th className="py-3 px-4 font-semibold">Kontak / WhatsApp</th>
                                            <th className="py-3 px-4 font-semibold">Alamat</th>
                                            <th className="py-3 px-4 font-semibold text-center">Status</th>
                                            <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                        {filteredSuppliers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-gray-500">
                                                    {search ? 'Supplier tidak ditemukan.' : 'Belum ada supplier terdaftar.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSuppliers.map((s) => {
                                                const isChecked = selectedIds.includes(s.id);
                                                return (
                                                    <tr
                                                        key={s.id}
                                                        className={`transition-colors group ${isChecked ? 'bg-[#f5b800]/5 dark:bg-[#f5b800]/10' : 'hover:bg-gray-50 dark:hover:bg-[#2B271F]'}`}
                                                    >
                                                        <td className="py-3.5 px-5">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleSelectOne(s.id)}
                                                                className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-lg bg-[#f5b800]/10 flex items-center justify-center text-[#f5b800] font-bold text-xs shrink-0">
                                                                    {s.nama.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900 dark:text-white">{s.nama}</div>
                                                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">ID: SUP-{s.id.toString().padStart(3, '0')}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            {s.telepon ? (
                                                                <a
                                                                    href={getWhatsAppLink(s.telepon)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 hover:underline font-medium"
                                                                >
                                                                    <MessageCircle className="size-4" />
                                                                    {s.telepon}
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs italic">Tidak ada kontak</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-gray-500 text-xs max-w-50 truncate">
                                                            {s.alamat || '-'}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aktif
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit Supplier">
                                                                    <Pencil className="size-4" />
                                                                </button>
                                                                <button onClick={() => confirmDelete(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus Supplier">
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

                            {/* Footer Info */}
                            <div className="px-5 py-4 bg-gray-50 dark:bg-[#1C1A14] border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    Menampilkan <strong>{filteredSuppliers.length}</strong> dari <strong>{suppliers.length}</strong> supplier
                                </span>
                            </div>
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Hapus Supplier?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Apakah Anda yakin ingin menghapus <strong className="text-gray-900 dark:text-white">{deleteModal.nama}</strong>? Riwayat transaksi stok masuk yang menggunakan supplier ini akan kehilangan referensi.
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

            {/* MODAL KONFIRMASI BULK DELETE */}
            {bulkDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-zinc-800 space-y-4 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center">
                                <Trash2 className="size-6" />
                            </div>
                            <button
                                onClick={() => setBulkDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Hapus {selectedIds.length} Supplier Terpilih?
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Apakah Anda yakin ingin menghapus <strong className="text-gray-900 dark:text-white">{selectedIds.length} supplier</strong> yang dipilih? Supplier yang sudah pernah memiliki riwayat transaksi stok masuk akan otomatis dilewati demi integritas data audit.
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
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm"
                            >
                                {isBulkDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}