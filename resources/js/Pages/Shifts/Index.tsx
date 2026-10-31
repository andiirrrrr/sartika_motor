import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    Download, Calendar, Clock, Wallet, AlertTriangle,
    CheckCircle2, X, ShieldCheck, Printer, TrendingUp, FileText
} from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
    shifts: {
        data: any[];
        links: any[];
    };
    stats: {
        total_shifts: number;
        total_cash: number;
        total_variance: number;
        accuracy: number;
        zero_variance: number;
    };
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Index({ shifts, stats }: Props) {
    const { auth } = usePage().props as any;
    const activeShift = auth?.active_shift;

    // State Modal
    const [showZReport, setShowZReport] = useState(false);
    const [showEndShift, setShowEndShift] = useState(false);
    const [selectedShift, setSelectedShift] = useState<any>(null);

    // State Form Tutup Shift (Admin)
    const [uangFisik, setUangFisik] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State Force Close Shift oleh Admin
    const [forceCloseModal, setForceCloseModal] = useState<{ show: boolean; shift: any | null }>({ show: false, shift: null });
    const [forceUangFisik, setForceUangFisik] = useState('');
    const [forceAlasan, setForceAlasan] = useState('');
    const [isForceClosing, setIsForceClosing] = useState(false);

    const handleForceClose = (e: React.FormEvent) => {
        e.preventDefault();
        if (!forceCloseModal.shift) return;
        setIsForceClosing(true);
        router.post(`/shifts/${forceCloseModal.shift.id}/force-close`, {
            uang_fisik: Number(forceUangFisik.replace(/\D/g, '')),
            alasan: forceAlasan,
        }, {
            onSuccess: () => {
                setForceCloseModal({ show: false, shift: null });
                setForceUangFisik('');
                setForceAlasan('');
            },
            onFinish: () => setIsForceClosing(false),
        });
    };

    const openZReport = (shift: any) => {
        setSelectedShift(shift);
        setShowZReport(true);
    };

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/shifts/close', { uang_fisik: Number(uangFisik.replace(/\D/g, '')) }, {
            onSuccess: () => {
                setShowEndShift(false);
                setUangFisik('');
                            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    // Hitung durasi jam kerja
    const getDuration = (start: string, end: string | null) => {
        if (!end) return 'Berjalan...';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours} Jam ${minutes} Mnt`;
    };

    return (
        <AdminLayout>
            <Head title="Riwayat Shift Kasir" />

            <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-12">

                {/* Header & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Laporan & Kasir</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white">Riwayat Shift</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Riwayat & Audit Shift Kasir
                            </h1>
                            {activeShift && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5b800]/20 text-[#f5b800] text-xs font-semibold shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-[#f5b800] animate-pulse"></span>
                                    Shift Aktif: {activeShift.user?.nama || 'Anda'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {activeShift && (
                            <Button onClick={() => setShowEndShift(true)} className="h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold shadow-sm">
                                <Clock className="size-4 mr-2" /> Tutup Shift Saat Ini
                            </Button>
                        )}
                    </div>
                </div>

                {/* 4 Metrik Ringkasan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Shift Selesai</span>
                            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_shifts} Sesi</div>
                        <div className="text-[11px] text-gray-500 mt-1">Tercatat di sistem</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Penerimaan Kas Shift</span>
                            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                <Wallet className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">Rp {formatRupiah(stats.total_cash)}</div>
                        <div className="text-[11px] text-gray-500 mt-1">Total uang tunai masuk</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Akurasi Kas Fisik</span>
                            <div className="w-8 h-8 rounded-lg bg-[#f5b800]/20 flex items-center justify-center text-[#f5b800]">
                                <CheckCircle2 className="size-4" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accuracy}%</div>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">{stats.zero_variance} dari {stats.total_shifts} shift seimbang</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Selisih Kas</span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.total_variance < 0 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                <TrendingUp className="size-4" />
                            </div>
                        </div>
                        <div className={`text-2xl font-bold ${stats.total_variance < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                            {stats.total_variance > 0 ? '+' : ''}Rp {formatRupiah(stats.total_variance)}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">Selisih bersih keseluruhan</div>
                    </div>
                </div>

                {/* Tabel Riwayat Shift */}
                <div className="w-full max-w-full bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rekapitulasi Sesi Kasir</h2>
                            <p className="text-xs text-gray-500">Validasi modal awal dan kecocokan uang laci.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-175">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                    <th className="py-3 px-4 font-semibold">ID Shift</th>
                                    <th className="py-3 px-4 font-semibold">Petugas Kasir</th>
                                    <th className="py-3 px-4 font-semibold">Waktu & Durasi</th>
                                    <th className="py-3 px-4 text-right font-semibold">Selisih</th>
                                    <th className="py-3 px-4 text-center font-semibold">Status</th>
                                    <th className="py-3 px-4 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                {shifts.data.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-gray-500">Belum ada riwayat shift.</td></tr>
                                ) : (
                                    shifts.data.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                            <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                                                SFT-{s.id.toString().padStart(5, '0')}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                        {s.user?.nama?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{s.user?.nama}</div>
                                                        <div className="text-[10px] text-gray-500 capitalize">{s.user?.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="text-xs font-medium text-gray-900 dark:text-white">
                                                    {new Date(s.waktu_buka).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">
                                                    Durasi: {getDuration(s.waktu_buka, s.waktu_tutup)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {s.selisih === null ? (
                                                    <span className="text-gray-400">-</span>
                                                ) : s.selisih === 0 ? (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 text-[10px] font-bold">Seimbang</span>
                                                ) : s.selisih < 0 ? (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold">
                                                        -Rp {formatRupiah(Math.abs(s.selisih))}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold">
                                                        +Rp {formatRupiah(s.selisih)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'buka' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {s.status === 'buka' ? 'Aktif' : 'Selesai'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button size="sm" variant="ghost" onClick={() => openZReport(s)} className="h-8 px-3 text-[#f5b800] hover:bg-[#f5b800]/10">
                                                        Lihat Rekap
                                                    </Button>
                                                    {s.status === 'buka' && s.user_id !== auth?.user?.id && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setForceCloseModal({ show: true, shift: s })}
                                                            className="h-8 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        >
                                                            Tutup Paksa
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {shifts.links.length > 3 && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 p-4">
                            <Pagination links={shifts.links} />
                        </div>
                    )}
                </div>

            </div>

            {/* MODAL REKAP Z-REPORT */}
            {showZReport && selectedShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#232019] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 bg-gray-50 dark:bg-[#1C1A14] flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#f5b800] flex items-center justify-center text-gray-900">
                                    <Printer className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Laporan Tutup</h3>
                                    <p className="text-xs text-gray-500">ID: SFT-{selectedShift.id.toString().padStart(5, '0')}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowZReport(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Info Shift */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Kasir</span>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedShift.user?.nama}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Dibuka</span>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                        {new Date(selectedShift.waktu_buka).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Ditutup</span>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                        {selectedShift.waktu_tutup
                                            ? new Date(selectedShift.waktu_tutup).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                            : '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Durasi</span>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                        {getDuration(selectedShift.waktu_buka, selectedShift.waktu_tutup)}
                                    </p>
                                </div>
                            </div>

                            {/* Rincian Kas */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Wallet className="size-4 text-[#f5b800]" /> Rincian Kas
                                </h4>
                                <div className="border border-gray-100 dark:border-zinc-800 rounded-xl p-4 text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Modal Awal</span>
                                        <span className="font-semibold">Rp {formatRupiah(selectedShift.modal_awal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Penjualan Tunai</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">Rp {formatRupiah(selectedShift.total_penjualan_tunai)}</span>
                                    </div>
                                    {Number(selectedShift.total_kas_masuk) > 0 && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                            <span>Kas Masuk Tambahan (+)</span>
                                            <span className="font-semibold">+Rp {formatRupiah(selectedShift.total_kas_masuk)}</span>
                                        </div>
                                    )}
                                    {Number(selectedShift.total_kas_keluar) > 0 && (
                                        <div className="flex justify-between text-red-500">
                                            <span>Kas Keluar Operasional (-)</span>
                                            <span className="font-semibold">-Rp {formatRupiah(selectedShift.total_kas_keluar)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Penjualan Non-Tunai</span>
                                        <span className="font-semibold">Rp {formatRupiah(selectedShift.sales_sum_total || 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-100 dark:border-zinc-800 pt-2">
                                        <span className="font-bold text-gray-900 dark:text-white">Uang Seharusnya</span>
                                        <span className="font-bold text-[#f5b800]">Rp {formatRupiah(selectedShift.uang_seharusnya)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-900 dark:text-white">Uang Fisik</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {selectedShift.uang_fisik !== null ? `Rp ${formatRupiah(selectedShift.uang_fisik)}` : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-100 dark:border-zinc-800 pt-2">
                                        <span className="font-bold text-gray-900 dark:text-white">Selisih</span>
                                        <span className={`font-bold ${selectedShift.selisih === null || selectedShift.selisih === 0
                                            ? 'text-gray-500'
                                            : selectedShift.selisih < 0 ? 'text-red-500' : 'text-blue-600'
                                            }`}>
                                            {selectedShift.selisih === null
                                                ? '-'
                                                : selectedShift.selisih === 0
                                                    ? 'Seimbang'
                                                    : `${selectedShift.selisih > 0 ? '+' : '-'}Rp ${formatRupiah(Math.abs(selectedShift.selisih))}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Catatan Rincian Kas Masuk & Keluar Toko */}
                            {((selectedShift.cash_movements || selectedShift.cashMovements || []).length > 0) ? (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <FileText className="size-4 text-amber-500" /> Catatan Kas Masuk & Keluar Toko
                                        </span>
                                        <span className="text-xs text-gray-500 font-normal">
                                            {(selectedShift.cash_movements || selectedShift.cashMovements || []).length} Catatan
                                        </span>
                                    </h4>
                                    <div className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:border-zinc-800 text-xs">
                                        {(selectedShift.cash_movements || selectedShift.cashMovements || []).map((m: any, idx: number) => (
                                            <div key={m.id || idx} className="p-3 flex items-start justify-between gap-3 bg-gray-50/50 dark:bg-zinc-800/30">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full font-bold uppercase text-[9px]",
                                                            m.tipe === 'masuk'
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                                                : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800"
                                                        )}>
                                                            {m.tipe === 'masuk' ? 'Kas Masuk (+)' : 'Kas Keluar (-)'}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px]">
                                                            {m.created_at ? new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                        {m.created_by?.nama && (
                                                            <span className="text-gray-500 text-[10px]">• oleh {m.created_by.nama}</span>
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-200 text-xs">
                                                        {m.alasan}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "font-bold text-sm whitespace-nowrap",
                                                    m.tipe === 'masuk' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                                )}>
                                                    {m.tipe === 'masuk' ? '+' : '-'}Rp {formatRupiah(m.jumlah)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                (Number(selectedShift.total_kas_masuk) > 0 || Number(selectedShift.total_kas_keluar) > 0) ? (
                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 text-xs text-gray-500">
                                        Tidak ada catatan rincian kas tambahan untuk shift ini.
                                    </div>
                                ) : null
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-[#1C1A14] border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowZReport(false)}>Tutup</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TUTUP SHIFT */}
            {showEndShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-[#232019] rounded-2xl shadow-xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 flex items-center justify-between border-b border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tutup Shift Kasir</h3>
                                    <p className="text-xs text-red-600 dark:text-red-400">Sesi kerja akan diakhiri</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEndShift(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCloseShift} className="p-6 space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl text-sm space-y-2 border border-gray-100 dark:border-zinc-800">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Modal Awal</span>
                                    <span className="font-semibold">Rp {formatRupiah(activeShift?.modal_awal || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Penjualan Tunai</span>
                                    <span className="font-semibold">Rp {formatRupiah(activeShift?.penjualan_tunai_sementara || 0)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 dark:border-zinc-700 pt-2">
                                    <span className="font-bold">Uang Seharusnya</span>
                                    <span className="font-bold text-[#f5b800]">Rp {formatRupiah(activeShift?.uang_seharusnya_sementara || 0)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Masukkan Uang Fisik di Laci (Rp) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={uangFisik}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setUangFisik(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
                                        }}
                                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-[#f5b800] text-lg font-bold text-gray-900 dark:text-white focus:outline-none"
                                        placeholder="0"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowEndShift(false)}>Batal</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                                    {isSubmitting ? 'Memproses...' : 'Konfirmasi & Tutup'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* MODAL FORCE CLOSE SHIFT (ADMIN) */}
            {forceCloseModal.show && forceCloseModal.shift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-[#232019] rounded-2xl shadow-xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 flex items-center justify-between border-b border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tutup Paksa Shift</h3>
                                    <p className="text-xs text-red-600 dark:text-red-400">Kasir: {forceCloseModal.shift.user?.nama}</p>
                                </div>
                            </div>
                            <button onClick={() => setForceCloseModal({ show: false, shift: null })} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleForceClose} className="p-6 space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300">
                                Tindakan ini dicatat dalam <strong>Audit Log Keamanan</strong> sebagai penutupan paksa oleh Admin.
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Jumlah Uang Fisik di Laci Kas *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={forceUangFisik}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setForceUangFisik(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
                                        }}
                                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-red-500 text-lg font-bold text-gray-900 dark:text-white focus:outline-none"
                                        placeholder="0"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Alasan Penutupan Paksa
                                </label>
                                <input
                                    type="text"
                                    value={forceAlasan}
                                    onChange={(e) => setForceAlasan(e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none"
                                    placeholder="Contoh: Kasir pulang mendadak / sakit"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setForceCloseModal({ show: false, shift: null })}>Batal</Button>
                                <Button type="submit" disabled={isForceClosing} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                                    {isForceClosing ? 'Memproses...' : 'Tutup Paksa Shift'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}