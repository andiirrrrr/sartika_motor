import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    ArrowLeft, Printer, ShieldCheck, User,
    Calendar, CreditCard, FileText, CheckCircle2,
    Wallet, QrCode, Building2, Store, Tags
} from 'lucide-react';
import ReceiptPreview from '@/Components/ReceiptPreview';

interface Props {
    sale: {
        id: number;
        no_transaksi: string;
        tanggal: string;
        total: number;
        metode_bayar: string;
        payment_method?: {
            nama: string;
            nama_bank?: string;
            nomor_rekening?: string;
            atas_nama?: string;
        } | null;
        bayar: number;
        kembalian: number;
        nama_pelanggan?: string | null;
        no_wa?: string | null;
        kasir: { nama: string };
        items: any[];
    };
    app_settings: {
        store_name: string;
        store_address: string;
        store_phone: string;
        receipt_footer: string;
    };
}

export default function Show({ sale, app_settings }: Props) {
    const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    const getMetodeIcon = (metode: string) => {
        switch (metode) {
            case 'tunai': return <Wallet className="size-5 text-green-600" />;
            case 'qris': return <QrCode className="size-5 text-blue-600" />;
            case 'transfer': return <CreditCard className="size-5 text-purple-600" />;
            default: return <FileText className="size-5" />;
        }
    };

    const handleSendWhatsApp = () => {
        if (!sale.no_wa) return;

        let cleanPhone = sale.no_wa.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.slice(1);
        } else if (cleanPhone.startsWith('8')) {
            cleanPhone = '62' + cleanPhone;
        }

        const waktu = new Date(sale.tanggal).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const itemsList = (sale.items || []).map((item: any, idx: number) => {
            const grosirTag = item.is_grosir ? ' _[Grosir]_' : '';
            return `${idx + 1}. *${item.nama_produk}*${grosirTag}\n   ${parseFloat(item.qty)} x Rp ${formatRupiah(item.harga_jual)} = Rp ${formatRupiah(item.subtotal)}`;
        }).join('\n');

        const storeName = app_settings?.store_name || 'SARTIKA MOTOR';
        const storeAddress = app_settings?.store_address || '';
        const storePhone = app_settings?.store_phone || '';

        const message =
            `*STRUK PEMBELIAN DIGITAL*
*${storeName.toUpperCase()}*
${storeAddress ? storeAddress + '\n' : ''}${storePhone ? 'Telp: ' + storePhone + '\n' : ''}------------------------------------------
No. Struk : *${sale.no_transaksi}*
Waktu     : ${waktu}
Kasir     : ${sale.kasir?.nama || 'Kasir'}
Pelanggan : *${sale.nama_pelanggan || 'Pelanggan Umum'}*
------------------------------------------
*DAFTAR BELANJA:*
${itemsList}
------------------------------------------
*TOTAL AKHIR : Rp ${formatRupiah(sale.total)}*
Bayar (${sale.payment_method?.nama || sale.metode_bayar}) : Rp ${formatRupiah(sale.bayar)}
Kembali : Rp ${formatRupiah(sale.kembalian)}
------------------------------------------
_${app_settings?.receipt_footer || 'Terima kasih atas kunjungan Anda di Toko Kami!'}_`;

        const encodedText = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
    };

    return (
        <AdminLayout>
            <Head title={`Struk - ${sale.no_transaksi}`} />

            <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">

                {/* Breadcrumb & Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Link href="/sales" className="hover:text-gray-900 dark:hover:text-white">Riwayat Transaksi</Link>
                            <span className="text-gray-300">/</span>
                            <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800]"></span> {sale.no_transaksi}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Detail Struk Transaksi
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                                Lunas
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap no-print">
                        <Link href="/sales">
                            <Button variant="outline" className="h-10 px-4 rounded-xl shadow-sm">
                                <ArrowLeft className="size-4 mr-2" /> Kembali
                            </Button>
                        </Link>
                        <Button onClick={() => window.print()} className="h-10 px-5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold shadow-sm">
                            <Printer className="size-4 mr-2" /> Cetak Ulang Struk
                        </Button>
                        {sale.no_wa && (
                            <Button onClick={handleSendWhatsApp} className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm">
                                <QrCode className="size-4 mr-2" /> Kirim WA E-Struk
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* KIRI: Visual Struk Thermal */}
                    <div className="lg:col-span-7 flex flex-col items-center">
                        <div className="w-full flex items-center justify-between px-2 py-2 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1.5"><FileText className="size-4" /> Pratinjau Kertas Termal 80mm</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Standar ESC/POS</span>
                        </div>

                        {/* Container Kertas Struk */}
                        <ReceiptPreview sale={sale} appSettings={app_settings} />


                    </div>

                    {/* KANAN: Info & Audit */}
                    <div className="lg:col-span-5 space-y-4 no-print">

                        {/* Aksi Cepat */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Informasi Transaksi</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                                    {getMetodeIcon(sale.metode_bayar)}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Metode Pembayaran</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{sale.payment_method?.nama || sale.metode_bayar}</p>
                                    {sale.payment_method?.nomor_rekening && (
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{sale.payment_method.nama_bank} • {sale.payment_method.nomor_rekening} a.n {sale.payment_method.atas_nama}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                                    <Wallet className="size-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Belanja</p>
                                    <p className="text-sm font-bold text-[#f5b800]">Rp {formatRupiah(sale.total)}</p>
                                </div>
                            </div>
                        </div>

                        {sale.items?.some((i: any) => i.is_grosir) && (
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3 shadow-xs">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                                    <Tags className="size-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                        Harga Grosir Diterapkan
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200">
                                            GROSIR
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                                        Transaksi ini mencakup item dengan potongan harga grosir resmi Sartika Motor.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Audit Trail */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Audit Trail</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] font-bold">
                                    <ShieldCheck className="size-3" /> Tersinkron
                                </span>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="size-4" /> Waktu</span>
                                    <span className="font-medium text-gray-900 dark:text-white text-right">{new Date(sale.tanggal).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-gray-500 flex items-center gap-2"><User className="size-4" /> Pelanggan</span>
                                    <span className="font-medium text-gray-900 dark:text-white text-right">
                                        {sale.nama_pelanggan || 'Pelanggan Umum'}
                                        {sale.no_wa && <span className="block text-xs text-green-600 dark:text-green-400 font-mono">{sale.no_wa}</span>}
                                    </span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-gray-500 flex items-center gap-2"><Store className="size-4" /> Mesin POS</span>
                                    <span className="font-medium text-gray-900 dark:text-white">Register Utama</span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-gray-500 flex items-center gap-2"><CheckCircle2 className="size-4" /> Status</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">Lunas</span>
                                </div>
                            </div>
                        </div>

                        {/* Info Toko */}
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-[#f5b800] shadow-sm shrink-0">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{app_settings?.store_name || 'Sartika Motor'}</p>
                                <p className="text-xs text-gray-500">Sistem POS & Inventory v1.0</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
