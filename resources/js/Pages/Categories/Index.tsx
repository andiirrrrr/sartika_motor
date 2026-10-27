import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEvent } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    PlusCircle, Search, Pencil, Trash2, Tags,
    ArrowRight, ShieldCheck, X
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
    id: number;
    nama: string;
    products_count: number;
}

interface Props {
    categories: Category[];
}

export default function Index({ categories }: Props) {
    // State untuk Pencarian
    const [search, setSearch] = useState('');

    // State Form
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null; nama: string }>({
        show: false, id: null, nama: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Handler Submit (Tambah / Edit)
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/categories/${editingId}`, {
                onSuccess: () => {
                    cancelEdit();
                    toast.success('Kategori berhasil diperbarui');
                },
                preserveScroll: true,
            });
        } else {
            post('/categories', {
                onSuccess: () => {
                    reset('nama');
                    toast.success('Kategori berhasil ditambahkan');
                },
                preserveScroll: true,
            });
        }
    };

    // Handler Mode Edit
    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setData('nama', category.nama);
        clearErrors();
        // Scroll ke atas form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset('nama');
        clearErrors();
    };

    // Handler Hapus
    const confirmDelete = (category: Category) => {
        if (category.products_count > 0) {
            toast.error('Tidak bisa menghapus', {
                description: `Kategori ini digunakan oleh ${category.products_count} produk.`
            });
            return;
        }
        setDeleteModal({ show: true, id: category.id, nama: category.nama });
    };

    const executeDelete = () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        router.delete(`/categories/${deleteModal.id}`, {
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, nama: '' });
                toast.success('Kategori berhasil dihapus');
                if (editingId === deleteModal.id) cancelEdit();
            },
            onFinish: () => setIsDeleting(false),
            preserveScroll: true,
        });
    };

    // Filter data untuk tabel berdasarkan pencarian
    const filteredCategories = categories.filter(c =>
        c.nama.toLowerCase().includes(search.toLowerCase())
    );

    const isAllSelected = filteredCategories.length > 0 && filteredCategories.every(c => selectedIds.includes(c.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCategories.map(c => c.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsBulkDeleting(true);
        router.post('/categories/bulk-delete', { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setBulkDeleteModal(false);
            },
            onFinish: () => setIsBulkDeleting(false),
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Kategori Produk" />

            <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header Context */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f5b800] inline-block"></span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Katalog & Inventori</span>
                        <span className="text-gray-300 text-sm">/</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-900 dark:text-white">Struktur Kategori</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ShieldCheck className="size-4 text-[#f5b800]" />
                        <span>Sinkronisasi POS Kasir: <span className="font-medium text-gray-900 dark:text-white">Otomatis (Live)</span></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                    {/* KIRI: FORM TAMBAH / EDIT */}
                    <div className="xl:col-span-4 xl:sticky xl:top-20 space-y-4">
                        <div className={`rounded-xl p-6 shadow-sm border transition-colors ${editingId ? 'bg-orange-50 dark:bg-[#2F2113] border-orange-200 dark:border-orange-900/30' : 'bg-white dark:bg-[#232019] border-gray-100 dark:border-zinc-800'}`}>

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span>
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {editingId ? 'Ubah nama kategori produk.' : 'Definisikan kelompok produk baru.'}
                                    </p>
                                </div>
                                {editingId ? (
                                    <span className="px-2 py-1 rounded bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wide">Edit Mode</span>
                                ) : (
                                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wide">Draft Baru</span>
                                )}
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nama Kategori <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Tags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                        <input
                                            type="text"
                                            value={data.nama}
                                            onChange={(e) => setData('nama', e.target.value)}
                                            className="w-full h-11 pl-10 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                            placeholder="misal: Alat Tulis Kantor"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
                                </div>

                                <div className="pt-2 space-y-2">
                                    <Button type="submit" disabled={processing} className="w-full h-11 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold rounded-xl shadow-sm">
                                        <PlusCircle className="size-5 mr-2" /> {processing ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Kategori')}
                                    </Button>

                                    {editingId && (
                                        <Button type="button" variant="ghost" onClick={cancelEdit} className="w-full h-10 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                            <X className="size-4 mr-2" /> Batal Edit
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Info Card */}
                        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 flex gap-3 items-start border border-gray-100 dark:border-zinc-800">
                            <div className="w-8 h-8 rounded-lg bg-[#f5b800]/20 flex items-center justify-center shrink-0">
                                <ShieldCheck className="text-[#f5b800] size-4" />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block">Panduan Cepat POS</span>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Kategori yang Anda buat akan langsung muncul sebagai tombol filter di layar Kasir POS.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* KANAN: TABEL DATA */}
                    <div className="xl:col-span-8 space-y-4">

                        {/* Header Tabel & Pencarian */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Daftar Kategori</h1>
                                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[11px] font-bold">{categories.length} Terdaftar</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Kelola pengelompokan produk Anda.</p>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                <input
                                    type="text"
                                    placeholder="Cari kategori..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Bulk Action Bar */}
                        {selectedIds.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#f5b800]/10 border border-[#f5b800]/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#f5b800] animate-pulse"></span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {selectedIds.length} kategori dipilih
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

                        {/* Tabel */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden w-full max-w-full">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                            <th className="py-3 pl-5 pr-2 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={toggleSelectAll}
                                                    className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3 px-4 font-semibold">Nama Kategori</th>
                                            <th className="py-3 px-4 font-semibold text-center">Total Produk</th>
                                            <th className="py-3 px-4 font-semibold text-center">Status</th>
                                            <th className="py-3 pr-5 pl-2 font-semibold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                        {filteredCategories.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                                    {search ? 'Kategori tidak ditemukan.' : 'Belum ada kategori.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCategories.map((c) => {
                                                const isChecked = selectedIds.includes(c.id);
                                                return (
                                                    <tr
                                                        key={c.id}
                                                        className={`transition-colors group ${isChecked ? 'bg-[#f5b800]/5 dark:bg-[#f5b800]/10' : 'hover:bg-gray-50 dark:hover:bg-[#2B271F]'}`}
                                                    >
                                                        <td className="py-3 pl-5 pr-2 align-middle">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleSelectOne(c.id)}
                                                                className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 align-middle">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-[#f5b800]/10 flex items-center justify-center shrink-0">
                                                                    <Tags className="size-4 text-[#f5b800]" />
                                                                </div>
                                                                <div>
                                                                    <span className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-[#f5b800] transition-colors">{c.nama}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 align-middle text-center">
                                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                                                                {c.products_count} Produk
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 align-middle text-center">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aktif
                                                            </span>
                                                        </td>
                                                        <td className="py-3 pr-5 pl-2 align-middle text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                                                                    <Pencil className="size-4" />
                                                                </button>
                                                                <button onClick={() => confirmDelete(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus">
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
                                    Menampilkan <strong>{filteredCategories.length}</strong> dari <strong>{categories.length}</strong> kategori
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Hapus Kategori?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Apakah Anda yakin ingin menghapus kategori <strong className="text-gray-900 dark:text-white">"{deleteModal.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
                                Hapus {selectedIds.length} Kategori Terpilih?
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Apakah Anda yakin ingin menghapus <strong className="text-gray-900 dark:text-white">{selectedIds.length} kategori</strong> yang dipilih? Kategori yang masih digunakan oleh produk akan otomatis dilewati demi keamanan katalog.
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