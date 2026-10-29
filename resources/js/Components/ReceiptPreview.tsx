interface SaleData {
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
    kasir?: { nama: string } | null;
    items: {
        id: number;
        nama_produk: string;
        kode_barang?: string;
        qty: number | string;
        harga_jual: number;
        harga_normal?: number | null;
        is_grosir?: boolean;
        subtotal: number;
    }[];
}

interface AppSettings {
    store_name?: string;
    store_address?: string;
    store_phone?: string;
    receipt_footer?: string;
}

interface ReceiptPreviewProps {
    sale: SaleData;
    appSettings?: AppSettings;
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

/**
 * Komponen struk thermal profesional yang digunakan di POS dan Sales.
 * Menampilkan preview struk dengan efek kertas thermal (gerigi atas/bawah),
 * header toko, info transaksi, daftar item, total, pembayaran, dan barcode.
 *
 * Elemen dengan id="print-section" akan di-print saat window.print().
 */
export default function ReceiptPreview({ sale, appSettings }: ReceiptPreviewProps) {
    const storeName = appSettings?.store_name || 'SARTIKA MOTOR';
    const storeAddress = appSettings?.store_address || '';
    const storePhone = appSettings?.store_phone || '';
    const receiptFooter = appSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda di Toko Kami';

    return (
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
                            {storeName}
                        </span>
                    </div>
                    {storeAddress && (
                        <p className="text-xs text-gray-600 leading-tight max-w-[300px] mx-auto">
                            {storeAddress}
                        </p>
                    )}
                    {storePhone && (
                        <p className="text-[11px] text-gray-500 font-mono">
                            Telp: {storePhone}
                        </p>
                    )}
                </div>

                <div className="my-3 border-b border-dashed border-gray-400"></div>

                {/* Meta Transaksi */}
                <div className="font-mono text-xs text-gray-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">No. Struk</span>
                        <span className="font-bold">{sale.no_transaksi}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Kasir</span>
                        <span>{sale.kasir?.nama}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Pelanggan</span>
                        <span className="font-semibold">{sale.nama_pelanggan || 'Pelanggan Umum'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Waktu</span>
                        <span>{new Date(sale.tanggal).toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="my-3 border-b border-dashed border-gray-400"></div>

                {/* Header Item */}
                <div className="text-[10px] text-gray-500 uppercase tracking-wider flex justify-between pb-1.5 font-mono border-b border-gray-300 mb-2">
                    <span>Item</span>
                    <span>Subtotal</span>
                </div>

                {/* List Item */}
                <div className="space-y-2 font-mono text-xs text-gray-900 pt-1">
                    {sale.items.map((item) => (
                        <div key={item.id}>
                            <div className="flex justify-between items-baseline font-medium">
                                <span className="font-sans leading-snug">
                                    {item.nama_produk}
                                    {item.is_grosir && (
                                        <span className="ml-1 text-[10px] text-gray-400 italic">
                                            (GROSIR)
                                        </span>
                                    )}
                                </span>
                                {item.is_grosir && item.harga_normal ? (
                                    <span className="text-[11px] text-gray-400 font-normal italic shrink-0 pl-2">
                                        (Norm: {formatRupiah(item.harga_normal)})
                                    </span>
                                ) : null}
                            </div>
                            <div className="text-[11px] text-gray-500 pt-0.5 flex items-center justify-between">
                                <span>{parseFloat(String(item.qty))} x {formatRupiah(item.harga_jual)}</span>
                                <span className="font-medium text-gray-900 shrink-0 pl-2">
                                    {formatRupiah(item.subtotal)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="my-3 border-b border-dashed border-gray-400"></div>

                {/* Total */}
                <div className="flex justify-between items-baseline py-2 px-3 rounded">
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
                        {receiptFooter}
                    </p>
                    <p className="font-sans text-[11px] text-gray-500 leading-snug">
                        Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.
                    </p>

                </div>
            </div>

            {/* Efek Gerigi Bawah */}
            <div className="w-full h-3 overflow-hidden flex items-start no-print">
                <div className="w-full h-2.5 bg-[#FAF9F5] dark:bg-zinc-200 [mask-image:radial-gradient(circle_at_5px_10px,transparent_4px,#FAF9F5_5px)] [mask-size:10px_10px]"></div>
            </div>
        </div>
    );
}

