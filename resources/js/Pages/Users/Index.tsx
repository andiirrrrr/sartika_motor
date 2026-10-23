import { Head, useForm, router } from '@inertiajs/react';
import { useState, FormEvent } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    User as UserIcon, Mail, Lock, Eye, EyeOff, Search,
    Edit, Trash2, ShieldCheck, ShieldAlert, Check, X,
    Download, RefreshCw, Clock, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: number;
    nama: string;
    username: string;
    email: string;
    role: 'admin' | 'kasir';
    last_login_at: string | null;
}

interface Props {
    users: User[];
}

export default function Index({ users }: Props) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'kasir'>('all');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null; nama: string }>({
        show: false, id: null, nama: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama: '',
        username: '',
        email: '',
        role: 'kasir',
        password: '',
        password_confirmation: '',
    });

    // Realtime Password Rules
    const pw = data.password;
    const rules = [
        { label: 'Minimal 8 karakter', valid: pw.length >= 8 },
        { label: 'Huruf besar (A-Z)', valid: /[A-Z]/.test(pw) },
        { label: 'Huruf kecil (a-z)', valid: /[a-z]/.test(pw) },
        { label: 'Angka (0-9)', valid: /[0-9]/.test(pw) },
        { label: 'Simbol (misal: @, !, #)', valid: /[^A-Za-z0-9]/.test(pw) },
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/users/${editingId}`, {
                onSuccess: () => {
                    cancelEdit();
                    toast.success('Data user berhasil diperbarui');
                },
                preserveScroll: true,
            });
        } else {
            post('/users', {
                onSuccess: () => {
                    reset();
                    toast.success('User baru berhasil ditambahkan');
                },
                preserveScroll: true,
            });
        }
    };

    const startEdit = (user: User) => {
        setEditingId(user.id);
        setData({
            nama: user.nama,
            username: user.username,
            email: user.email,
            role: user.role,
            password: '',
            password_confirmation: '',
        });
        clearErrors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        reset();
        clearErrors();
    };

    const confirmDelete = (user: User) => {
        setDeleteModal({ show: true, id: user.id, nama: user.nama });
    };

    const executeDelete = () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        router.delete(`/users/${deleteModal.id}`, {
            onSuccess: () => {
                setDeleteModal({ show: false, id: null, nama: '' });
                toast.success('User berhasil dihapus');
                if (editingId === deleteModal.id) cancelEdit();
            },
            onError: (err) => {
                toast.error(err.error || 'Gagal menghapus user');
            },
            onFinish: () => setIsDeleting(false),
            preserveScroll: true,
        });
    };

    // Filter Data
    const filteredUsers = users.filter((u) => {
        const matchSearch = u.nama.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    return (
        <AdminLayout>
            <Head title="Manajemen User" />

            <div className="max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Konfigurasi</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white">Manajemen User</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Manajemen Pengguna
                            </h1>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> {users.length} Terdaftar
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Kelola akun kasir dan administrator toko. Atur hak akses modul POS.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-[#232019] p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800]">
                            <UserIcon className="size-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kasir Aktif</span>
                            <span className="block text-sm font-bold text-gray-900 dark:text-white">{users.filter(u => u.role === 'kasir').length} Kasir</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* KIRI: FORM TAMBAH / EDIT USER */}
                    <div className={`lg:col-span-5 rounded-xl p-6 shadow-sm border transition-colors relative overflow-hidden ${editingId ? 'bg-orange-50 dark:bg-[#2F2113] border-orange-200 dark:border-orange-900/30' : 'bg-white dark:bg-[#232019] border-gray-100 dark:border-zinc-800'}`}>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#f5b800] via-yellow-200 to-gray-200"></div>

                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
                                <p className="text-xs text-gray-500">Isi kredensial staf dan hak akses.</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${editingId ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400'}`}>
                                {editingId ? 'Edit Mode' : 'Draft Baru'}
                            </span>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap *</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <input type="text" value={data.nama} onChange={e => setData('nama', e.target.value)} className="w-full h-11 pl-10 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" placeholder="Misal: Dewi Lestari" required />
                                </div>
                                {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
                            </div>

                            {/* Username & Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Username *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                                        <input type="text" value={data.username} onChange={e => setData('username', e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} className="w-full h-11 pl-8 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" placeholder="dewi.kasir" required />
                                    </div>
                                    {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" placeholder="dewi@email.com" required />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Role / Peran *</label>
                                <select value={data.role} onChange={e => setData('role', e.target.value)} className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none appearance-none">
                                    <option value="kasir">Kasir POS (Operasional)</option>
                                    <option value="admin">Admin (Akses Penuh)</option>
                                </select>
                            </div>

                            {/* Password */}
                            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Password {editingId ? '(Kosongkan jika tidak diubah)' : '*'}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                        <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={e => setData('password', e.target.value)} className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" placeholder="Sandi baru" required={!editingId} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                        <input type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" placeholder="Konfirmasi" required={!editingId} />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </div>
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}

                                {/* Realtime Checklist */}
                                {pw.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {rules.map((rule, idx) => (
                                            <div key={idx} className={`flex items-center text-[11px] ${rule.valid ? 'text-green-600' : 'text-gray-400'}`}>
                                                {rule.valid ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}
                                                {rule.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-4">
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={cancelEdit}>Batal Edit</Button>
                                )}
                                <Button type="submit" disabled={processing} className="bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold">
                                    <UserIcon className="size-4 mr-2" /> {processing ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Pengguna')}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* KANAN: TABEL USER */}
                    <div className="lg:col-span-7 space-y-4">

                        {/* Search & Filter */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, username, email..." className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="h-10 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:bg-gray-100 flex items-center gap-1 text-sm font-medium transition-colors">
                                        <Download className="size-4" /> Ekspor
                                    </button>
                                    <button onClick={() => window.location.reload()} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition-colors">
                                        <RefreshCw className="size-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                <button onClick={() => setRoleFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${roleFilter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-900 dark:bg-zinc-800 dark:text-gray-400'}`}>
                                    Semua ({users.length})
                                </button>
                                <button onClick={() => setRoleFilter('admin')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${roleFilter === 'admin' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-900 dark:bg-zinc-800 dark:text-gray-400'}`}>
                                    Admin ({users.filter(u => u.role === 'admin').length})
                                </button>
                                <button onClick={() => setRoleFilter('kasir')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${roleFilter === 'kasir' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm' : 'bg-gray-100 text-gray-500 hover:text-gray-900 dark:bg-zinc-800 dark:text-gray-400'}`}>
                                    Kasir ({users.filter(u => u.role === 'kasir').length})
                                </button>
                            </div>
                        </div>

                        {/* Tabel User */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-175">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4 font-semibold">Pengguna</th>
                                            <th className="py-3 px-4 font-semibold hidden md:table-cell">Kontak</th>
                                            <th className="py-3 px-4 font-semibold">Role</th>
                                            <th className="py-3 px-4 font-semibold hidden sm:table-cell">Login Terakhir</th>
                                            <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="py-12 text-center text-gray-500">User tidak ditemukan.</td></tr>
                                        ) : (
                                            filteredUsers.map((u) => (
                                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors group">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shrink-0">
                                                                {u.nama.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">{u.nama}</div>
                                                                <div className="text-[11px] text-gray-500 font-mono">@{u.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 hidden md:table-cell text-gray-500">
                                                        {u.email}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                            {u.role === 'admin' ? <ShieldAlert className="size-3" /> : <ShieldCheck className="size-3" />}
                                                            {u.role === 'admin' ? 'ADMIN' : 'KASIR'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 hidden sm:table-cell text-xs text-gray-500">
                                                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Belum pernah'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
                                                                <Edit className="size-4" />
                                                            </button>
                                                            <button onClick={() => confirmDelete(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus">
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Security Info Card */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800] shrink-0">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Standar Keamanan Sistem</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Sistem ini dilengkapi enkripsi kata sandi Bcrypt 12-Rounds dan rate-limiting login untuk mencegah akses tidak sah.
                                    </p>
                                </div>
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
                            <AlertTriangle className="size-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Hapus Pengguna?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Apakah Anda yakin ingin menghapus akun <strong className="text-gray-900 dark:text-white">{deleteModal.nama}</strong>? Pengguna ini tidak akan bisa mengakses sistem lagi.
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