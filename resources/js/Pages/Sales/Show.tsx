import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import {
    ArrowLeft, Printer, ShieldCheck, User,
    Calendar, CreditCard, FileText, CheckCircle2,
    Wallet, QrCode, Building2, Store
} from 'lucide-react';

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
            return `${idx + 1}. *${item.nama_produk}*\n   ${item.qty} x Rp ${formatRupiah(item.harga_jual)} = Rp ${formatRupiah(item.subtotal)}`;
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
                        <div className="relative w-full max-w-[320px] transition-transform duration-300">
                            {/* Efek Gerigi Atas */}
                            <div className="w-full h-3 overflow-hidden flex items-end no-print">
                                <div className="w-full h-2.5 bg-[#FAF9F5] dark:bg-zinc-200 [mask-image:radial-gradient(circle_at_5px_0px,transparent_4px,#FAF9F5_5px)] [mask-size:10px_10px]"></div>
                            </div>

                            {/* Body Kertas Struk */}
                            <div id="print-section" className="bg-[#FAF9F5] px-6 py-7 shadow-xl text-[#1F1D17] relative">

                                {/* Header Toko */}
                                <div className="text-center space-y-1 mb-4">
                                    <div className="inline-flex items-center justify-center gap-1.5 mb-1">
                                        <span className="text-xl font-bold tracking-tight uppercase" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            {app_settings?.store_name || 'SARTIKA MOTOR'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-tight max-w-[300px] mx-auto">
                                        {app_settings?.store_address || 'Jl. Raya Motor No. 123'}
                                    </p>
                                    <p className="text-[11px] text-gray-500 font-mono">
                                        Telp: {app_settings?.store_phone || '0812-3456-7890'}
                                    </p>
                                </div>

                                <div className="my-3 border-b border-dashed border-gray-400"></div>

                                {/* Meta Transaksi */}
                                <div className="font-mono text-xs text-gray-800 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">No. Struk</span>
                                        <span className="font-bold">{sale.no_transaksi}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Waktu</span>
                                        <span>{new Date(sale.tanggal).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Kasir</span>
                                        <span>{sale.kasir?.nama}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Pelanggan</span>
                                        <span className="font-semibold">{sale.nama_pelanggan || 'Pelanggan Umum'}</span>
                                    </div>
                                </div>

                                <div className="my-3 border-b border-dashed border-gray-400"></div>

                                {/* Header Item */}
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider flex justify-between pb-1 font-mono">
                                    <span className="w-1/2">Item / Qty</span>
                                    <span className="w-1/4 text-right">Harga</span>
                                    <span className="w-1/4 text-right">Total</span>
                                </div>

                                {/* List Item */}
                                <div className="space-y-2 font-mono text-xs text-gray-900 pt-1">
                                    {sale.items.map((item) => (
                                        <div key={item.id}>
                                            <p className="font-sans font-medium leading-snug">{item.nama_produk}</p>
                                            <div className="flex justify-between text-gray-600 pt-0.5">
                                                <span className="w-1/2 text-[11px]">
                                                    {parseFloat(item.qty)} x {formatRupiah(item.harga_jual)}
                                                </span>
                                                <span className="w-1/4 text-right"></span>
                                                <span className="w-1/4 text-right font-medium text-gray-900">
                                                    {formatRupiah(item.subtotal)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="my-3 border-b border-dashed border-gray-400"></div>

                                {/* Total */}
                                <div className="flex justify-between items-baseline py-2 bg-gray-200/50 px-3 rounded">
                                    <span className="text-sm font-bold tracking-tight">TOTAL AKHIR</span>
                                    <span className="text-lg font-bold tracking-tight">Rp {formatRupiah(sale.total)}</span>
                                </div>

                                <div className="my-3 border-b border-dashed border-gray-400"></div>

                                {/* Pembayaran */}
                                <div className="font-mono text-xs text-gray-800 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 uppercase">Metode Bayar</span>
                                        <span className="font-bold uppercase">{sale.payment_method?.nama || sale.metode_bayar}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Bayar</span>
                                        <span>Rp {formatRupiah(sale.bayar)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Kembalian</span>
                                        <span>Rp {formatRupiah(sale.kembalian)}</span>
                                    </div>
                                </div>

                                <div className="my-4 border-b border-dashed border-gray-400"></div>

                                {/* Footer */}
                                <div className="text-center space-y-2 pt-1">
                                    <p className="font-sans font-semibold text-sm">
                                        {app_settings?.receipt_footer || 'Terima kasih atas kunjungan Anda'}
                                    </p>
                                    <p className="font-sans text-[11px] text-gray-500 leading-snug">
                                        Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.
                                    </p>

                                    {/* Barcode Palsu */}
                                    <div className="pt-2 flex flex-col items-center">
                                        <div className="flex items-end justify-center gap-[2px] h-8 w-48">
                                            {[...Array(25)].map((_, i) => (
                                                <span key={i} className="bg-[#1F1D17]" style={{ width: `${Math.random() * 3 + 1}px`, height: '100%' }}></span>
                                            ))}
                                        </div>
                                        <span className="font-mono text-[9px] text-gray-500 tracking-widest mt-1">{sale.no_transaksi}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Efek Gerigi Bawah */}
                            <div className="w-full h-3 overflow-hidden flex items-start no-print">
                                <div className="w-full h-2.5 bg-[#FAF9F5] dark:bg-zinc-200 [mask-image:radial-gradient(circle_at_5px_10px,transparent_4px,#FAF9F5_5px)] [mask-size:10px_10px]"></div>
                            </div>
                        </div>
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