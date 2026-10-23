import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, RefreshCw, Zap, Store, Headphones } from 'lucide-react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login - Sartika Motor" />
            <div className="min-h-screen flex flex-col justify-between bg-[#f9f9f6] dark:bg-zinc-950 font-sans">

                <main className="w-full flex-1 flex items-center justify-center p-4 lg:p-8">
                    <div className="w-full max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

                            {/* KOLOM KIRI: FORM LOGIN */}
                            <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6 lg:pr-12">
                                <div className="max-w-xl w-full mx-auto lg:mx-0">

                                    {/* Badge */}
                                    <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 px-4 py-1.5 rounded-full mb-6">
                                        <span className="w-2 h-2 rounded-full bg-[#f5b800]"></span>
                                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            POS & Manajemen Ritel
                                        </span>
                                    </div>

                                    {/* Headline */}
                                    <div className="mb-8">
                                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight flex items-baseline gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            Selamat Datang Kembali
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#f5b800] inline-block"></span>
                                        </h1>
                                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
                                            Masuk ke sistem POS & inventaris toko Anda untuk memulai sesi kasir hari ini.
                                        </p>
                                    </div>

                                    {/* Info Akun Demo */}
                                    <div className="mb-6 p-4 rounded-xl bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-gray-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <ShieldCheck className="text-[#f5b800] shrink-0 size-5" />
                                            <div className="truncate">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Akses Cepat Admin</p>
                                                <p className="text-xs text-gray-500 truncate">admin@sartikamotor.local • AdminSartika123!</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData('email', 'admin@sartikamotor.local');
                                                setData('password', 'AdminSartika123!');
                                            }}
                                            className="shrink-0 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
                                        >
                                            Gunakan Akun
                                        </button>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={submit} className="space-y-4">

                                        {/* Email */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Email
                                            </label>
                                            <div className="relative rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 focus-within:border-[#f5b800] focus-within:ring-2 focus-within:ring-[#f5b800]/20 transition-all">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Mail className="text-gray-400 size-5" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    className="w-full h-11 bg-transparent pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none rounded-xl"
                                                    placeholder="nama@email.com"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Kata Sandi
                                            </label>
                                            <div className="relative rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-gray-200 dark:border-zinc-800 focus-within:border-[#f5b800] focus-within:ring-2 focus-within:ring-[#f5b800]/20 transition-all">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock className="text-gray-400 size-5" />
                                                </div>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    className="w-full h-11 bg-transparent pl-10 pr-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none rounded-xl tracking-wider"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                                        </div>

                                        {/* Remember & Forgot */}
                                        <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={data.remember}
                                                    onChange={(e) => setData('remember', e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-[#f5b800] focus:ring-[#f5b800]"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Ingat saya</span>
                                            </label>
                                            <Link href="/forgot-password" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#f5b800] underline decoration-[#f5b800] decoration-2 underline-offset-4 transition-colors">
                                                Lupa Kata Sandi?
                                            </Link>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="w-full h-11 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold text-sm rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-70"
                                            >
                                                <span>{processing ? 'Memproses...' : 'Masuk ke Toko'}</span>
                                                {!processing && <ArrowRight className="size-4" />}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Support Meta */}
                                    <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-gray-400">
                                        <ShieldCheck className="size-4 text-[#f5b800]" />
                                        <span className="text-[11px] font-medium">Enkripsi data tersertifikasi & aman</span>
                                    </div>
                                </div>
                            </div>

                            {/* KOLOM KANAN: BRANDING SHOWCASE (Hanya tampil di Desktop) */}
                            <div className="hidden lg:col-span-5 lg:flex flex-col">
                                <div className="w-full h-full min-h-125 bg-[#f4f4f1] dark:bg-zinc-900 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between shadow-sm border border-gray-100 dark:border-zinc-800">

                                    {/* Efek Latar Belakang */}
                                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#f5b800]/20 blur-2xl pointer-events-none"></div>
                                    <div className="absolute bottom-8 -left-12 w-56 h-56 rounded-full bg-gray-300/30 blur-xl pointer-events-none"></div>

                                    {/* Top Brand Content */}
                                    <div className="relative z-10 space-y-4">
                                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                                            <span className="w-2 h-2 rounded-full bg-[#f5b800]"></span>
                                            <span className="text-[11px] font-semibold text-gray-800 tracking-wide">Sartika Motor OS v1.0</span>
                                        </div>
                                        <div className="space-y-2 pt-2">
                                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-snug" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                Sistem Kasir & Inventaris Ritel Modern
                                            </h2>
                                            <div className="w-12 h-1 bg-[#f5b800] rounded-full"></div>
                                            <p className="text-sm text-gray-600 pt-2">
                                                Kelola transaksi kasir, stok barang, dan laporan penjualan dalam satu ritme yang tenang dan teratur.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Feature Badges */}
                                    <div className="relative z-10 my-6 space-y-3">
                                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <RefreshCw className="text-[#f5b800] size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Sinkronisasi Stok</p>
                                                    <p className="text-xs text-gray-500">Stok otomatis terpotong tiap transaksi</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Zap className="text-[#f5b800] size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Pencatatan Responsif</p>
                                                    <p className="text-xs text-gray-500">Pencarian produk secepat kilat</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Store className="text-[#f5b800] size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">Multi-Harga (Grosir)</p>
                                                    <p className="text-xs text-gray-500">Harga otomatis berubah sesuai qty</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Support */}
                                    <div className="relative z-10 pt-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#f5b800]/20 flex items-center justify-center">
                                                <Headphones className="text-[#f5b800] size-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-800">Bantuan Teknis</p>
                                                <p className="text-[11px] text-gray-500">Siaga untuk toko Anda</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                {/* Footer Bawah */}
                <footer className="w-full bg-[#f4f4f1] dark:bg-zinc-900 py-4 mt-auto border-t border-gray-200 dark:border-zinc-800">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="text-xs text-gray-500">
                            © {new Date().getFullYear()} Sartika Motor POS. Seluruh hak cipta dilindungi.
                        </div>
                        <div className="flex items-center gap-6 text-xs text-gray-500">
                            <a href="#" className="hover:text-gray-900 transition-colors">Bantuan</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Privasi</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Syarat & Ketentuan</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}