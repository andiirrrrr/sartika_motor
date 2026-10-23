import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    LockKeyhole, Key, ShieldCheck, Eye, EyeOff,
    Check, Minus, ArrowLeft, Loader2
} from 'lucide-react';

interface Props {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    // ================= LOGIKA VALIDASI REALTIME =================
    const pw = data.password;
    const confirmPw = data.password_confirmation;

    // Kriteria
    const hasLength = pw.length >= 8;
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pw);

    // Hitung kekuatan (0-4)
    const passedCount = [hasLength, hasUpper, hasNum, hasSpecial].filter(Boolean).length;

    // Cek kecocokan konfirmasi
    const isMatch = confirmPw.length > 0 && pw === confirmPw;
    const isMismatch = confirmPw.length > 0 && pw !== confirmPw;

    // Tombol submit hanya aktif jika semua terpenuhi
    const isFormValid = passedCount === 4 && isMatch;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        post('/reset-password');
    };

    // ================= UI UNTUK METER KEKUATAN =================
    const getMeterColor = (index: number) => {
        if (passedCount === 0) return 'bg-gray-200 dark:bg-zinc-700';
        if (passedCount === 1) return index === 0 ? 'bg-red-500' : 'bg-gray-200 dark:bg-zinc-700';
        if (passedCount === 2) return index < 2 ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-zinc-700';
        if (passedCount === 3) return index < 3 ? 'bg-[#f5b800]' : 'bg-gray-200 dark:bg-zinc-700';
        return index < 4 ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-700';
    };

    const getStrengthLabel = () => {
        if (pw.length === 0) return { text: 'Kekuatan: -', color: 'text-gray-500' };
        if (passedCount <= 1) return { text: 'Kekuatan: Lemah', color: 'text-red-500' };
        if (passedCount === 2) return { text: 'Kekuatan: Cukup', color: 'text-yellow-500' };
        if (passedCount === 3) return { text: 'Kekuatan: Kuat', color: 'text-[#f5b800]' };
        return { text: 'Kekuatan: Sangat Kuat', color: 'text-green-600' };
    };

    const strength = getStrengthLabel();

    return (
        <>
            <Head title="Reset Password - Sartika Motor" />
            <div className="min-h-screen flex flex-col justify-between bg-[#f9f9f6] dark:bg-zinc-950 font-sans overflow-hidden">

                <main className="w-full flex-1 flex flex-col items-center justify-center p-4 relative">

                    {/* Dekorasi Latar Belakang */}
                    <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#f5b800]/20 blur-3xl pointer-events-none -z-10"></div>

                    <div className="w-full max-w-xl mx-auto my-8">
                        {/* Top Editorial Header */}
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Keamanan Akun</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span>
                                <span className="text-[11px] text-gray-500">Token Sesi Terverifikasi</span>
                            </div>
                        </div>

                        {/* Main Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 sm:p-10 shadow-lg border border-gray-100 dark:border-zinc-800 relative overflow-hidden">

                            {/* Header */}
                            <div className="flex flex-col items-center text-center mb-8 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4 shadow-sm">
                                    <LockKeyhole className="text-[#f5b800] size-7" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    Atur Ulang Kata Sandi
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                                    Buat kata sandi baru yang aman untuk akun kasir atau pemilik toko Anda.
                                </p>
                            </div>

                            <form onSubmit={submit} className="relative z-10 flex flex-col gap-5">

                                {/* Field 1: Email (Readonly) */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                        <span>Akun Email</span>
                                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                            <ShieldCheck className="size-3.5 text-[#f5b800]" /> Terverifikasi
                                        </span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <LockKeyhole className="absolute left-3.5 text-gray-400 size-4" />
                                        <input
                                            type="email"
                                            value={data.email}
                                            disabled
                                            readOnly
                                            className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-sm rounded-lg cursor-not-allowed border border-gray-200 dark:border-zinc-700"
                                        />
                                    </div>
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>

                                {/* Field 2: Password Baru */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kata Sandi Baru</label>
                                        <span className={`text-[11px] font-semibold ${strength.color}`}>{strength.text}</span>
                                    </div>
                                    <div className="relative flex items-center">
                                        <Key className="absolute left-3.5 text-gray-400 size-4" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full h-11 pl-10 pr-12 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f5b800] border border-gray-200 dark:border-zinc-700 transition-all"
                                            placeholder="Masukkan kata sandi baru"
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

                                    {/* Segmented Strength Meter */}
                                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${getMeterColor(i)}`}></div>
                                        ))}
                                    </div>

                                    {/* Real-time Checklist */}
                                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3.5 mt-1 flex flex-col gap-2">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Kriteria Keamanan:</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div className={`flex items-center gap-2 text-xs ${hasLength ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasLength ? 'bg-[#f5b800]/20 text-[#f5b800]' : 'bg-gray-200 dark:bg-zinc-700 text-gray-400'}`}>
                                                    {hasLength ? <Check className="size-3" /> : <Minus className="size-3" />}
                                                </div>
                                                Minimal 8 karakter
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${hasUpper ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasUpper ? 'bg-[#f5b800]/20 text-[#f5b800]' : 'bg-gray-200 dark:bg-zinc-700 text-gray-400'}`}>
                                                    {hasUpper ? <Check className="size-3" /> : <Minus className="size-3" />}
                                                </div>
                                                1 huruf besar (A-Z)
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${hasNum ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasNum ? 'bg-[#f5b800]/20 text-[#f5b800]' : 'bg-gray-200 dark:bg-zinc-700 text-gray-400'}`}>
                                                    {hasNum ? <Check className="size-3" /> : <Minus className="size-3" />}
                                                </div>
                                                1 angka (0-9)
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${hasSpecial ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${hasSpecial ? 'bg-[#f5b800]/20 text-[#f5b800]' : 'bg-gray-200 dark:bg-zinc-700 text-gray-400'}`}>
                                                    {hasSpecial ? <Check className="size-3" /> : <Minus className="size-3" />}
                                                </div>
                                                1 simbol (!@#$%)
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Field 3: Konfirmasi Password */}
                                <div className="flex flex-col gap-1.5 mt-1">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Kata Sandi Baru</label>
                                    <div className="relative flex items-center">
                                        <ShieldCheck className="absolute left-3.5 text-gray-400 size-4" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="w-full h-11 pl-10 pr-12 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f5b800] border border-gray-200 dark:border-zinc-700 transition-all"
                                            placeholder="Ulangi kata sandi baru"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {/* Real-time Match Indicator */}
                                    {confirmPw.length > 0 && (
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${isMatch ? 'text-green-600' : 'text-red-500'}`}>
                                            {isMatch ? <Check className="size-4" /> : <Minus className="size-4" />}
                                            {isMatch ? 'Kata sandi cocok' : 'Kata sandi belum cocok'}
                                        </div>
                                    )}
                                    {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation}</p>}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 pt-3">
                                    <button
                                        type="submit"
                                        disabled={!isFormValid || processing}
                                        className={`w-full h-11 px-6 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200
                                            ${isFormValid
                                                ? 'bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 shadow-md active:scale-[0.99]'
                                                : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        {processing ? (
                                            <><Loader2 className="animate-spin size-5" /> Memperbarui...</>
                                        ) : (
                                            <><Check className="size-5" /> Simpan & Masuk ke Toko</>
                                        )}
                                    </button>

                                    <Link href="/login" className="w-full py-2.5 text-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center justify-center gap-1">
                                        <ArrowLeft className="size-4" /> Batalkan dan Kembali ke Login
                                    </Link>
                                </div>
                            </form>

                            {/* Success Overlay (Akan muncul saat berhasil, meski Inertia akan redirect) */}
                            {processing && (
                                <div className="absolute inset-0 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
                                    <div className="w-16 h-16 rounded-full bg-[#f5b800]/20 flex items-center justify-center mb-4">
                                        <ShieldCheck className="text-[#f5b800] size-8" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Menyimpan...</h2>
                                    <p className="text-sm text-gray-500 max-w-xs">
                                        Akun Anda sedang diamankan dengan kata sandi baru.
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}