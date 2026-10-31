import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    Store, User as UserIcon, Save, ShieldCheck,
    Printer, Monitor, Check, X, Eye, EyeOff, Lock
} from 'lucide-react';
import { Select } from '@/Components/ui/select';
import { toast } from 'sonner';

interface Props {
    settings: {
        store_name: string;
        store_address: string;
        store_phone: string;
        receipt_footer: string;
        receipt_paper_size?: string;
    };
    user: {
        nama: string;
        username: string;
        email: string;
    };
}

export default function Index({ settings, user }: Props) {
    // State untuk Toggle (UI only)
    const [autoCut, setAutoCut] = useState(true);
    const [cashDrawer, setCashDrawer] = useState(true);
    const [printerMode, setPrinterMode] = useState('80mm');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form 1: Info Toko
    const storeForm = useForm({
        store_name: settings.store_name,
        store_address: settings.store_address,
        store_phone: settings.store_phone,
        receipt_footer: settings.receipt_footer,
        receipt_paper_size: settings.receipt_paper_size || '80mm',
    });

    // Form 2: Profil Admin
    const profileForm = useForm({
        nama: user.nama,
        username: user.username,
        email: user.email || '',
        password: '',
        password_confirmation: '',
    });

    // LOGIKA VALIDASI REALTIME PASSWORD
    const pw = profileForm.data.password;
    const rules = [
        { label: 'Minimal 8 karakter', valid: pw.length >= 8 },
        { label: 'Huruf besar (A-Z)', valid: /[A-Z]/.test(pw) },
        { label: 'Huruf kecil (a-z)', valid: /[a-z]/.test(pw) },
        { label: 'Angka (0-9)', valid: /[0-9]/.test(pw) },
        { label: 'Simbol (misal: @, !, #)', valid: /[^A-Za-z0-9]/.test(pw) },
    ];

    const submitStore = (e: FormEvent) => {
        e.preventDefault();
        storeForm.put('/settings', {
                        preserveScroll: true,
        });
    };

    const submitProfile = (e: FormEvent) => {
        e.preventDefault();
        profileForm.put('/settings/profile', {
            onSuccess: () => {
                profileForm.reset('password', 'password_confirmation');
                            },
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Pengaturan Sistem" />

            <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Konfigurasi</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> Pengaturan Sistem
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Pengaturan Sistem & Profil
                        </h1>
                        <p className="text-sm text-gray-500">
                            Kelola identitas toko, format struk, dan kredensial akun Anda.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* KIRI: INFO TOKO & PREVIEW STRUK (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={submitStore} className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">

                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800]">
                                    <Store className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profil Toko & Struk POS</h2>
                                    <p className="text-xs text-gray-500">Identitas yang tercetak pada tiket pembayaran.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Toko (Header Struk) *</label>
                                        <input
                                            type="text"
                                            value={storeForm.data.store_name}
                                            onChange={(e) => storeForm.setData('store_name', e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                            required
                                        />
                                        {storeForm.errors.store_name && <p className="text-xs text-red-500 mt-1">{storeForm.errors.store_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Telepon / WhatsApp</label>
                                        <input
                                            type="text"
                                            value={storeForm.data.store_phone}
                                            onChange={(e) => storeForm.setData('store_phone', e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat Toko Lengkap *</label>
                                    <textarea
                                        value={storeForm.data.store_address}
                                        onChange={(e) => storeForm.setData('store_address', e.target.value)}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none resize-none"
                                        rows={2}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan Kaki Struk (Footer)</label>
                                    <textarea
                                        value={storeForm.data.receipt_footer}
                                        onChange={(e) => storeForm.setData('receipt_footer', e.target.value)}
                                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ukuran Kertas Thermal Struk</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => storeForm.setData('receipt_paper_size', '58mm')}
                                            className={`p-3 rounded-xl border text-left transition-all ${storeForm.data.receipt_paper_size === '58mm' ? 'border-[#f5b800] bg-[#f5b800]/10 text-gray-900 dark:text-white font-bold' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'}`}
                                        >
                                            <div className="text-sm">58mm (Kecil / Mobile)</div>
                                            <div className="text-xs text-gray-500 font-normal mt-0.5">Lebar kertas ~58mm standar kasir kecil</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => storeForm.setData('receipt_paper_size', '80mm')}
                                            className={`p-3 rounded-xl border text-left transition-all ${storeForm.data.receipt_paper_size === '80mm' ? 'border-[#f5b800] bg-[#f5b800]/10 text-gray-900 dark:text-white font-bold' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'}`}
                                        >
                                            <div className="text-sm">80mm (Standar / Desktop)</div>
                                            <div className="text-xs text-gray-500 font-normal mt-0.5">Lebar kertas ~80mm struk penuh</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* LIVE PREVIEW STRUK */}
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Printer className="size-4 text-[#f5b800]" /> Simulasi Struk Thermal {storeForm.data.receipt_paper_size}
                                    </span>
                                </div>
                                <div className={`bg-[#FAF9F5] p-5 rounded-lg border border-gray-200 shadow-inner font-mono leading-snug text-gray-800 space-y-2 transition-all ${storeForm.data.receipt_paper_size === '58mm' ? 'max-w-[240px] mx-auto text-[10px]' : 'max-w-[340px] mx-auto text-[11px]'}`}>
                                    <div className="text-center space-y-0.5 pb-2">
                                        <p className="font-bold text-[13px] uppercase">{storeForm.data.store_name || 'NAMA TOKO'}</p>
                                        <p className="text-[10px] line-clamp-2">{storeForm.data.store_address || 'Alamat Toko'}</p>
                                        <p className="text-[9px]">Telp: {storeForm.data.store_phone || '-'}</p>
                                    </div>
                                    <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
                                        <div className="flex justify-between"><span>No: INV-2026-001</span><span>14:32</span></div>
                                        <div className="flex justify-between"><span>Kasir: {user.nama}</span><span>Reg: 01</span></div>
                                    </div>
                                    <div className="border-t border-dashed border-gray-400 py-2 space-y-1">
                                        <div className="flex justify-between"><span>1x Contoh Produk</span><span>Rp 50.000</span></div>
                                        <div className="flex justify-between font-bold pt-1">
                                            <span>TOTAL</span>
                                            <span>Rp 50.000</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-dashed border-gray-400 pt-2 text-center text-[9px] whitespace-pre-line">
                                        {storeForm.data.receipt_footer || 'Terima kasih atas kunjungan Anda'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={storeForm.processing} className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 rounded-xl h-10 px-5">
                                    <Save className="size-4 mr-2" /> Simpan Info Toko
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* KANAN: PROFIL & KEAMANAN (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">

                        <form onSubmit={submitProfile} className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[#f5b800]">
                                    <UserIcon className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profil Admin</h2>
                                    <p className="text-xs text-gray-500">Akun penanggung jawab sistem.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap *</label>
                                <input
                                    type="text"
                                    value={profileForm.data.nama}
                                    onChange={(e) => profileForm.setData('nama', e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                    required
                                />
                                {profileForm.errors.nama && <p className="text-xs text-red-500 mt-1">{profileForm.errors.nama}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Akun (Digunakan untuk Login) *</label>
                                <input
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                    placeholder="nama@email.com"
                                    required
                                />
                                {profileForm.errors.email && <p className="text-xs text-red-500 mt-1">{profileForm.errors.email}</p>}
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-[#f5b800]" /> Ubah Password (Opsional)
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={profileForm.data.password}
                                                onChange={(e) => profileForm.setData('password', e.target.value)}
                                                className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                                placeholder="Password Baru"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        {profileForm.errors.password && <p className="text-xs text-red-500 mt-1">{profileForm.errors.password}</p>}

                                        {/* VALIDASI REALTIME */}
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
                                    <div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={profileForm.data.password_confirmation}
                                                onChange={(e) => profileForm.setData('password_confirmation', e.target.value)}
                                                className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[#f5b800] outline-none"
                                                placeholder="Konfirmasi Password Baru"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                        {profileForm.errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{profileForm.errors.password_confirmation}</p>}

                                        {/* Indikator Kecocokan Password */}
                                        {profileForm.data.password_confirmation.length > 0 && (
                                            <div className={`flex items-center text-[11px] mt-1 ${profileForm.data.password === profileForm.data.password_confirmation ? 'text-green-600' : 'text-red-500'}`}>
                                                {profileForm.data.password === profileForm.data.password_confirmation ? <Check className="mr-1 size-3" /> : <X className="mr-1 size-3" />}
                                                {profileForm.data.password === profileForm.data.password_confirmation ? 'Password cocok' : 'Password tidak cocok'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">Biarkan kosong jika tidak ingin mengubah password.</p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={profileForm.processing} className="bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold rounded-xl h-10 px-5">
                                    <Save className="size-4 mr-2" /> Simpan Profil
                                </Button>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}