import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState, useEffect } from 'react';
import {
    LockKeyhole, Mail, Lightbulb, MailCheck,
    ArrowLeft, RefreshCw, ExternalLink, ShieldCheck,
    Store, Headphones, Loader2
} from 'lucide-react';

export default function ForgotPassword() {
    const [isSent, setIsSent] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    // Logika Timer Hitung Mundur
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isSent && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0) {
            setCanResend(true);
        }
        return () => clearTimeout(timer);
    }, [isSent, countdown]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/forgot-password', {
            onSuccess: () => {
                setIsSent(true);
                setCountdown(60);
                setCanResend(false);
            },
        });
    };

    const handleResend = () => {
        post('/forgot-password', {
            onSuccess: () => {
                setCountdown(60);
                setCanResend(false);
            },
        });
    };

    const formatTime = (seconds: number) => {
        const secStr = seconds < 10 ? `0${seconds}` : seconds;
        return `00:${secStr}`;
    };

    return (
        <>
            <Head title="Lupa Password - Sartika Motor" />
            <div className="min-h-screen flex flex-col justify-between bg-[#f9f9f6] dark:bg-zinc-950 font-sans overflow-hidden">

                <main className="w-full flex-1 flex flex-col items-center justify-center p-4 relative">

                    {/* Dekorasi Latar Belakang */}
                    <div className="absolute -top-12 -left-16 w-80 h-80 rounded-full bg-[#f5b800]/20 blur-3xl pointer-events-none -z-10"></div>
                    <div className="absolute top-1/2 -right-16 w-96 h-96 rounded-full bg-gray-300/30 blur-3xl pointer-events-none -z-10"></div>

                    {/* Card Container */}
                    <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8 sm:p-10 relative overflow-hidden transition-all duration-300">

                        {/* Garis Aksen Atas */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-yellow-300 via-[#f5b800] to-yellow-500"></div>

                        {/* ================= STATE 1: FORM INPUT ================= */}
                        {!isSent && (
                            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                                {/* Ikon Badge */}
                                <div className="w-16 h-16 rounded-full bg-[#f5b800]/20 flex items-center justify-center mb-6 relative">
                                    <LockKeyhole className="text-[#f5b800] size-8" />
                                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#f5b800] shadow-sm"></span>
                                </div>

                                <div className="space-y-2 mb-8">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Akses Akun Sartika Motor</span>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Lupa Kata Sandi?
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                                        Masukkan alamat email yang terdaftar pada sistem kasir Anda. Kami akan mengirimkan tautan verifikasi untuk membuat sandi baru.
                                    </p>
                                </div>

                                <form onSubmit={submit} className="w-full text-left space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email Terdaftar
                                        </label>
                                        <div className="relative flex items-center">
                                            <Mail className="absolute left-4 text-gray-400 size-5 pointer-events-none" />
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:shadow-[0_0_0_2px_#f5b800] transition-all border border-gray-200 dark:border-zinc-700"
                                                placeholder="contoh@tokoanda.com"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                                    </div>

                                    {/* Info Note */}
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-start gap-3">
                                        <Lightbulb className="text-[#f5b800] size-5 shrink-0 mt-0.5" />
                                        <div className="text-left text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                            <span className="font-semibold text-gray-900 dark:text-white">Tips:</span> Periksa juga folder <em>Spam</em> atau <em>Promosi</em> jika email instruksi tidak muncul di kotak masuk utama dalam 2 menit.
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full h-12 bg-[#f5b800] hover:bg-[#e0a800] active:scale-[0.99] text-gray-900 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70"
                                        >
                                            {processing ? (
                                                <><Loader2 className="animate-spin size-4" /> Mengirim...</>
                                            ) : (
                                                'Kirim Link Reset'
                                            )}
                                        </button>

                                        <div className="pt-4 text-center">
                                            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                                <ArrowLeft className="size-4" /> Kembali ke Halaman Masuk
                                            </Link>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* ================= STATE 2: SUKSES TERKIRIM ================= */}
                        {isSent && (
                            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                                {/* Ikon Sukses */}
                                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-6 relative">
                                    <MailCheck className="text-[#f5b800] size-8" />
                                    <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#f5b800] flex items-center justify-center shadow-sm border-2 border-white">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 text-[11px] font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> Email Pemulihan Dikirim
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Tautan Telah Terkirim!
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                                        Instruksi pemulihan telah kami kirimkan ke <strong className="font-semibold text-gray-900 dark:text-white">{data.email}</strong>. Buka tautan tersebut untuk mengatur kata sandi baru.
                                    </p>
                                </div>

                                {/* Checklist Info */}
                                <div className="w-full bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-6 text-left space-y-3">
                                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                        <ShieldCheck className="text-[#f5b800] size-4 shrink-0" />
                                        <span>Tautan aktif selama <strong className="font-semibold">30 menit</strong> ke depan</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                        <ShieldCheck className="text-[#f5b800] size-4 shrink-0" />
                                        <span>Satu tautan hanya berlaku untuk 1 kali penggunaan</span>
                                    </div>
                                </div>

                                {/* Tombol Aksi */}
                                <div className="w-full space-y-3">
                                    <a
                                        href="https://mail.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full h-12 bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                                    >
                                        Buka Aplikasi Email <ExternalLink className="size-4" />
                                    </a>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                        <button
                                            onClick={handleResend}
                                            disabled={!canResend || processing}
                                            className={`w-full sm:w-auto px-4 h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm
                                                ${canResend
                                                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-zinc-800 dark:text-gray-200 cursor-pointer'
                                                    : 'bg-gray-50 text-gray-400 dark:bg-zinc-900 dark:text-gray-600 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            <RefreshCw className={`size-4 ${processing ? 'animate-spin' : ''}`} />
                                            {canResend ? 'Kirim Ulang Email' : `Kirim ulang dalam ${formatTime(countdown)}`}
                                        </button>

                                        <button
                                            onClick={() => { setIsSent(false); reset('email'); }}
                                            className="w-full sm:w-auto px-4 h-11 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            Ganti Email Lain
                                        </button>
                                    </div>

                                    <div className="pt-4">
                                        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                            <ArrowLeft className="size-4" /> Kembali ke Halaman Masuk
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Security Indicators (Bawah) */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="size-4 text-[#f5b800]" />
                            <span>Enkripsi SSL 256-Bit</span>
                        </div>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
                        <div className="flex items-center gap-1.5">
                            <Headphones className="size-4 text-[#f5b800]" />
                            <span>Bantuan Cepat: admin@sartikamotor.com</span>
                        </div>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300"></div>
                        <div className="flex items-center gap-1.5">
                            <Store className="size-4 text-[#f5b800]" />
                            <span>Sistem Kasir Ritel Mandiri</span>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}