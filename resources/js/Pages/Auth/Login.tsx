import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Store, ShieldCheck } from 'lucide-react';

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

    const inputWrapper =
        'relative rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus-within:border-[#f5b800] focus-within:ring-2 focus-within:ring-[#f5b800]/20 transition-all';

    return (
        <>
            <Head title="Login - Sartika Motor" />
            <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-zinc-950 font-sans">

                {/* KIRI: BRANDING (hanya desktop) */}
                <div className="hidden lg:flex relative flex-col justify-between p-10 bg-gradient-to-br from-[#fffdf5] via-[#fdf8e6] to-[#f7f7f3] dark:from-zinc-900 dark:to-zinc-950 overflow-hidden">
                    {/* Glow lembut */}
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#f5b800]/15 blur-3xl pointer-events-none" />

                    {/* Brand */}
                    <div className="relative z-10">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Sartika Motor
                        </p>
                        <p className="text-[11px] text-gray-500">Point of Sale & Inventaris</p>
                    </div>

                    {/* Konten tengah */}
                    <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
                        <div className="w-28 h-28 rounded-full bg-[#f5b800] flex items-center justify-center shadow-lg shadow-[#f5b800]/30 mb-8">
                            <Store className="size-12 text-gray-900" strokeWidth={1.75} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Kelola Kasir & Stok dengan Mudah
                        </h2>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Platform kasir dan inventaris untuk mempercepat transaksi dan merapikan laporan toko Anda.
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 bg-white/80 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700">
                            <ShieldCheck className="size-3.5 text-[#f5b800]" />
                            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">Data aman & terenkripsi</span>
                        </div>
                    </div>

                    {/* Footer kiri */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-gray-400">
                        <span>© {new Date().getFullYear()} Sartika Motor</span>
                        <span>v1.0</span>
                    </div>
                </div>

                {/* KANAN: FORM */}
                <div className="flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-sm">

                        {/* Logo */}
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-12 h-12 rounded-xl bg-[#f5b800] flex items-center justify-center mb-4">
                                <Store className="size-6 text-gray-900" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Selamat Datang
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                                Masuk untuk memulai sesi kasir hari ini
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <div className={inputWrapper}>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="text-gray-400 size-4" />
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
                                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Kata Sandi</label>
                                <div className={inputWrapper}>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="text-gray-400 size-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full h-11 bg-transparent pl-10 pr-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none rounded-xl"
                                        placeholder="Kata sandi"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                            </div>

                            {/* Ingatkan Saya & Lupa Sandi */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded text-[#f5b800] focus:ring-[#f5b800] border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 accent-[#f5b800]"
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Ingatkan saya</span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-gray-500 hover:text-[#d9a000] transition-colors"
                                >
                                    Lupa sandi?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-11 mt-2 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-70"
                            >
                                <span>{processing ? 'Memproses...' : 'Masuk ke Toko'}</span>
                                {!processing && <ArrowRight className="size-4" />}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-[11px] text-gray-400 lg:hidden">
                            © {new Date().getFullYear()} Sartika Motor POS
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
