import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    TrendingUp, Wallet, AlertTriangle,
    Download, BarChart3, Package, QrCode, CreditCard,
    Calendar, Printer, FileSpreadsheet, Send, MessageCircle,
    Truck, CheckSquare, Square, Search, X, Plus, Minus,
    Copy, ExternalLink, RefreshCw, ShoppingCart, Info,
    Filter, Tags, Building2
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Select } from '@/Components/ui/select';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem
} from '@/Components/ui/dropdown-menu';
import { toast } from 'sonner';
import AnimatedNumber from '@/Components/AnimatedNumber';

interface SalesSummary {
    date: string;
    total_transaksi: number;
    total_item: string;
    total_omzet: number;
    total_laba: number;
}

interface ChartData {
    date: string;
    total_omzet: number;
}

interface LowStockProduct {
    id: number;
    nama: string;
    kode_barang: string;
    stok: string;
    stok_minimum: string;
    satuan: string;
    harga_beli: number;
    kategori?: { nama: string } | null;
}

interface SupplierItem {
    id: number;
    nama: string;
    telepon: string | null;
    alamat: string | null;
}

interface StoreSettings {
    store_name: string;
    store_address: string;
    store_phone: string;
}

interface TopProduct {
    nama_produk: string;
    total_qty: string;
    total_revenue: number;
}

interface CategorySale {
    nama: string;
    total_revenue: number;
}

interface PaymentMethod {
    metode_bayar: string;
    total_transaksi: number;
    total_revenue: number;
}

interface GrosirStats {
    total_transaksi: number;
    total_qty: number;
    total_omzet: number;
    total_potongan: number;
}

interface TopGrosirProduct {
    nama_produk: string;
    kode_barang: string;
    total_qty: number;
    avg_harga_normal: number;
    avg_harga_grosir: number;
    total_omzet: number;
    total_potongan: number;
}

interface Props {
    from: string;
    to: string;
    salesSummary: SalesSummary[];
    chartData: ChartData[];
    lowStockProducts: LowStockProduct[];
    suppliers?: SupplierItem[];
    storeSettings?: StoreSettings;
    topProducts: TopProduct[];
    categorySales: CategorySale[];
    paymentMethods: PaymentMethod[];
    grosirStats?: GrosirStats;
    topGrosirProducts?: TopGrosirProduct[];
    stats: {
        omzet: number;
        transaksi: number;
        laba: number;
        item: number;
        aov: number;
    };
}

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Index({
    from, to, salesSummary, chartData, lowStockProducts = [],
    suppliers = [], storeSettings = {
        store_name: 'Sartika Motor',
        store_address: 'Jl. Raya Motor No. 123',
        store_phone: '0812-3456-7890',
    },
    topProducts, categorySales, paymentMethods, stats,
    grosirStats, topGrosirProducts = []
}: Props) {
    const [activeTab, setActiveTab] = useState<'sales' | 'grosir' | 'stock'>('sales');
    const [startDate, setStartDate] = useState(from);
    const [endDate, setEndDate] = useState(to);
    const [periodPreset, setPeriodPreset] = useState<string>('custom');

    // ================= STATE TAB RENCANA BELANJA / RESTOCK =================
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(lowStockProducts.map(p => p.id)));
    const [orderQuantities, setOrderQuantities] = useState<Record<number, number>>(() => {
        const initial: Record<number, number> = {};
        lowStockProducts.forEach(p => {
            const min = parseFloat(p.stok_minimum) || 0;
            const current = parseFloat(p.stok) || 0;
            initial[p.id] = Math.max(1, Math.ceil(min - current));
        });
        return initial;
    });

    const [stockSearch, setStockSearch] = useState('');
    const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'empty' | 'low'>('all');
    const [stockCategoryFilter, setStockCategoryFilter] = useState<string>('all');

    // WhatsApp Modal State
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [supplierPhone, setSupplierPhone] = useState<string>('');
    const [supplierName, setSupplierName] = useState<string>('');
    const [poNotes, setPoNotes] = useState<string>('');

    // Handle Period Change for Sales
    const handlePeriodChange = (val: string) => {
        setPeriodPreset(val);
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const toStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

        if (val === 'today') {
            setStartDate(toStr);
            setEndDate(toStr);
            router.get('/reports', { from: toStr, to: toStr }, { preserveState: true });
        } else if (val === '7days') {
            const d7 = new Date();
            d7.setDate(d7.getDate() - 7);
            const fromStr = `${d7.getFullYear()}-${pad(d7.getMonth() + 1)}-${pad(d7.getDate())}`;
            setStartDate(fromStr);
            setEndDate(toStr);
            router.get('/reports', { from: fromStr, to: toStr }, { preserveState: true });
        } else if (val === '30days') {
            const d30 = new Date();
            d30.setDate(d30.getDate() - 30);
            const fromStr = `${d30.getFullYear()}-${pad(d30.getMonth() + 1)}-${pad(d30.getDate())}`;
            setStartDate(fromStr);
            setEndDate(toStr);
            router.get('/reports', { from: fromStr, to: toStr }, { preserveState: true });
        } else if (val === 'month') {
            const fromStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
            setStartDate(fromStr);
            setEndDate(toStr);
            router.get('/reports', { from: fromStr, to: toStr }, { preserveState: true });
        }
    };

    const applyFilter = () => {
        router.get('/reports', { from: startDate, to: endDate }, { preserveState: true });
    };

    // Helper untuk grafik penjualan
    const maxOmzet = Math.max(...chartData.map(d => d.total_omzet), 1000000);

    // ================= KALKULASI RESTOCK & PENGADAAN =================
    const categoriesList = useMemo(() => {
        const set = new Set<string>();
        lowStockProducts.forEach(p => {
            if (p.kategori?.nama) set.add(p.kategori.nama);
        });
        return Array.from(set);
    }, [lowStockProducts]);

    const filteredStockProducts = useMemo(() => {
        return lowStockProducts.filter(p => {
            const s = stockSearch.toLowerCase().trim();
            const matchSearch = !s || p.nama.toLowerCase().includes(s) || p.kode_barang.toLowerCase().includes(s);
            const stokNum = parseFloat(p.stok);
            const matchStatus = stockStatusFilter === 'all'
                ? true
                : stockStatusFilter === 'empty'
                    ? stokNum <= 0
                    : stokNum > 0;
            const matchCategory = stockCategoryFilter === 'all' || p.kategori?.nama === stockCategoryFilter;
            return matchSearch && matchStatus && matchCategory;
        });
    }, [lowStockProducts, stockSearch, stockStatusFilter, stockCategoryFilter]);

    const selectedProducts = useMemo(() => {
        return lowStockProducts.filter(p => selectedIds.has(p.id));
    }, [lowStockProducts, selectedIds]);

    const totalOrderQty = useMemo(() => {
        return selectedProducts.reduce((sum, p) => sum + (orderQuantities[p.id] || 0), 0);
    }, [selectedProducts, orderQuantities]);

    const totalEstimatedCost = useMemo(() => {
        return selectedProducts.reduce((sum, p) => sum + ((orderQuantities[p.id] || 0) * (p.harga_beli || 0)), 0);
    }, [selectedProducts, orderQuantities]);

    const outOfStockCount = useMemo(() => {
        return lowStockProducts.filter(p => parseFloat(p.stok) <= 0).length;
    }, [lowStockProducts]);

    const allFilteredSelected = filteredStockProducts.length > 0 && filteredStockProducts.every(p => selectedIds.has(p.id));

    const toggleSelectAll = () => {
        const newSet = new Set(selectedIds);
        if (allFilteredSelected) {
            filteredStockProducts.forEach(p => newSet.delete(p.id));
        } else {
            filteredStockProducts.forEach(p => newSet.add(p.id));
        }
        setSelectedIds(newSet);
    };

    const toggleSelectOne = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const updateQty = (id: number, delta: number) => {
        setOrderQuantities(prev => {
            const current = prev[id] || 1;
            const next = Math.max(1, current + delta);
            return { ...prev, [id]: next };
        });
    };

    const setQtyDirect = (id: number, val: number) => {
        setOrderQuantities(prev => ({ ...prev, [id]: Math.max(1, isNaN(val) ? 1 : val) }));
    };

    const handleSupplierSelect = (val: string) => {
        setSelectedSupplierId(val);
        if (val === 'manual' || !val) {
            setSupplierName('');
            setSupplierPhone('');
        } else {
            const found = suppliers.find(s => String(s.id) === val);
            if (found) {
                setSupplierName(found.nama);
                setSupplierPhone(found.telepon || '');
            }
        }
    };

    // ================= GENERATE WA PESANAN =================
    const generateWhatsAppMessage = () => {
        const todayStr = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const storeName = storeSettings?.store_name || 'Sartika Motor';
        const targetSupplier = supplierName.trim() || 'Supplier / Distributor';

        let msg = `*SURAT PEMESANAN BARANG (PURCHASE ORDER)*\n`;
        msg += `*${storeName.toUpperCase()}*\n`;
        msg += `Tanggal: ${todayStr}\n`;
        msg += `Kepada: *${targetSupplier}*\n\n`;
        msg += `Halo, kami dari *${storeName}* ingin melakukan pemesanan stok barang/sparepart berikut:\n\n`;

        selectedProducts.forEach((p, idx) => {
            const qty = orderQuantities[p.id] || 1;
            msg += `${idx + 1}. *${p.nama}* (SKU: ${p.kode_barang})\n`;
            msg += `   - Jumlah Pesan: *${qty} ${p.satuan}*\n`;
            msg += `   - Sisa Stok Saat Ini: ${parseFloat(p.stok)} ${p.satuan}\n`;
        });

        msg += `\n---------------------------------------\n`;
        msg += `*Total Pesanan:* ${selectedProducts.length} SKU (${totalOrderQty} unit)\n`;
        msg += `*Estimasi Biaya:* Rp ${formatRupiah(totalEstimatedCost)}\n`;
        msg += `---------------------------------------\n\n`;

        if (poNotes.trim()) {
            msg += `*Catatan Khusus:*\n${poNotes.trim()}\n\n`;
        }

        msg += `Mohon konfirmasi ketersediaan stok barang dan total fakturnya. Terima kasih!`;
        return msg;
    };

    const handleSendWhatsApp = () => {
        if (selectedProducts.length === 0) {
            toast.error('Pilih minimal 1 produk untuk dipesan.');
            return;
        }
        const text = encodeURIComponent(generateWhatsAppMessage());
        let phone = supplierPhone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) {
            phone = '62' + phone.slice(1);
        }

        if (phone) {
            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
        } else {
            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        }
    };

    const handleCopyText = () => {
        const text = generateWhatsAppMessage();
        navigator.clipboard.writeText(text);
        toast.success('Daftar pesanan berhasil disalin ke clipboard!');
    };

    // ================= CETAK SURAT PESANAN (PO) =================
    const handlePrintPO = () => {
        if (selectedProducts.length === 0) {
            toast.error('Pilih minimal 1 produk untuk dicetak.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Gagal membuka halaman cetak. Pastikan izin pop-up browser diaktifkan.');
            return;
        }

        const storeName = storeSettings?.store_name || 'Sartika Motor';
        const storeAddress = storeSettings?.store_address || '';
        const storePhone = storeSettings?.store_phone || '';
        const targetSupplier = supplierName.trim() || 'Semua Distributor / Supplier';
        const dateStr = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const rowsHtml = selectedProducts.map((p, idx) => {
            const qty = orderQuantities[p.id] || 1;
            const subtotal = qty * (p.harga_beli || 0);
            return `
                <tr>
                    <td style="text-align: center; padding: 8px; border: 1px solid #d1d5db;">${idx + 1}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; font-family: monospace;">${p.kode_barang}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; font-weight: 600;">${p.nama}</td>
                    <td style="text-align: center; padding: 8px; border: 1px solid #d1d5db;">${parseFloat(p.stok)} ${p.satuan}</td>
                    <td style="text-align: center; padding: 8px; border: 1px solid #d1d5db; font-weight: bold; background-color: #fef3c7;">${qty} ${p.satuan}</td>
                    <td style="text-align: right; padding: 8px; border: 1px solid #d1d5db;">Rp ${formatRupiah(p.harga_beli || 0)}</td>
                    <td style="text-align: right; padding: 8px; border: 1px solid #d1d5db; font-weight: 600;">Rp ${formatRupiah(subtotal)}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Surat Pesanan Barang - ${poNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 25px; color: #1f2937; line-height: 1.4; font-size: 13px; }
                    .header { border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
                    .header h1 { margin: 0; font-size: 22px; color: #111827; font-weight: 800; letter-spacing: -0.5px; }
                    .header p { margin: 2px 0; font-size: 12px; color: #4b5563; }
                    .po-title { text-align: center; margin-bottom: 20px; }
                    .po-title h2 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; text-decoration: underline; }
                    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; }
                    .meta-box { width: 48%; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
                    th { background-color: #f3f4f6; color: #111827; font-weight: bold; padding: 8px; border: 1px solid #d1d5db; text-align: left; }
                    .total-box { display: flex; justify-content: flex-end; margin-bottom: 30px; font-size: 14px; }
                    .total-table { width: 340px; border-collapse: collapse; }
                    .total-table td { padding: 6px 10px; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
                    .sig-col { text-align: center; width: 220px; font-size: 13px; }
                    .sig-space { height: 70px; }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>${storeName}</h1>
                        <p>${storeAddress}</p>
                        <p>Telp / WhatsApp: ${storePhone}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Nomor PO:</strong> ${poNumber}</p>
                        <p><strong>Tanggal:</strong> ${dateStr}</p>
                    </div>
                </div>

                <div class="po-title">
                    <h2>SURAT PEMESANAN BARANG (PURCHASE ORDER)</h2>
                </div>

                <div class="meta-grid">
                    <div class="meta-box">
                        <strong>Kepada Yth Supplier:</strong><br>
                        <span style="font-size: 15px; font-weight: bold;">${targetSupplier}</span><br>
                        ${supplierPhone ? `<span>Telp: ${supplierPhone}</span>` : ''}
                    </div>
                    <div class="meta-box" style="text-align: right;">
                        <strong>Status Pengadaan:</strong> Restock Inventori Menipis<br>
                        <strong>Total SKU Dipesan:</strong> ${selectedProducts.length} Produk<br>
                        <strong>Total Qty:</strong> ${totalOrderQty} Unit
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px; text-align: center;">No</th>
                            <th style="width: 100px;">Kode SKU</th>
                            <th>Nama Barang / Sparepart</th>
                            <th style="width: 90px; text-align: center;">Sisa Stok</th>
                            <th style="width: 90px; text-align: center;">Qty Pesan</th>
                            <th style="width: 110px; text-align: right;">Harga Beli</th>
                            <th style="width: 130px; text-align: right;">Subtotal Estimasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <div class="total-box">
                    <table class="total-table">
                        <tr style="border-top: 2px solid #111827; font-weight: bold; font-size: 15px;">
                            <td>Total Estimasi Anggaran:</td>
                            <td style="text-align: right; color: #166534;">Rp ${formatRupiah(totalEstimatedCost)}</td>
                        </tr>
                    </table>
                </div>

                ${poNotes.trim() ? `
                    <div style="margin-bottom: 25px; padding: 10px 14px; background-color: #f9fafb; border: 1px dashed #d1d5db; font-size: 12px; border-radius: 6px;">
                        <strong>Catatan Khusus:</strong> ${poNotes.trim()}
                    </div>
                ` : ''}

                <div class="signatures">
                    <div class="sig-col">
                        <p>Dibuat Oleh (Pemesan),</p>
                        <div class="sig-space"></div>
                        <p style="border-top: 1px solid #9ca3af; padding-top: 4px;"><strong>${storeName}</strong></p>
                    </div>
                    <div class="sig-col">
                        <p>Diterima / Disetujui,</p>
                        <div class="sig-space"></div>
                        <p style="border-top: 1px solid #9ca3af; padding-top: 4px;"><strong>Pihak Supplier / Distributor</strong></p>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // ================= EKSPOR CSV RENCANA BELANJA =================
    const handleDownloadRestockCSV = () => {
        if (selectedProducts.length === 0) {
            toast.error('Pilih minimal 1 produk untuk diekspor.');
            return;
        }

        const csvRows = [
            ['No', 'Kode Barang', 'Nama Produk', 'Kategori', 'Sisa Stok', 'Batas Minimum', 'Qty Pesan', 'Satuan', 'Harga Beli (Rp)', 'Estimasi Subtotal (Rp)'],
            ...selectedProducts.map((p, idx) => {
                const qty = orderQuantities[p.id] || 1;
                const subtotal = qty * (p.harga_beli || 0);
                return [
                    idx + 1,
                    `"${p.kode_barang}"`,
                    `"${p.nama.replace(/"/g, '""')}"`,
                    `"${p.kategori?.nama || '-'}"`,
                    parseFloat(p.stok),
                    parseFloat(p.stok_minimum),
                    qty,
                    `"${p.satuan}"`,
                    p.harga_beli || 0,
                    subtotal
                ];
            })
        ];

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `surat-pesanan-supplier-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Daftar pesanan berhasil diunduh dalam format CSV.');
    };

    return (
        <AdminLayout>
            <Head title="Pusat Laporan & Pengadaan" />

            <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-12">

                {/* Header Dinamis Berdasarkan Tab */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-white dark:bg-[#232019] p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <span>Laporan & Pembelian</span>
                            <span>/</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {activeTab === 'sales' ? 'Analitik Penjualan' : activeTab === 'grosir' ? 'Laporan Grosir' : 'Rencana Belanja / Restock'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {activeTab === 'sales' ? 'Pusat Analitik & Laporan' : activeTab === 'grosir' ? 'Laporan Penjualan Grosir' : 'Rencana Belanja & Order Supplier'}
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {activeTab === 'sales'
                                ? 'Pantau performa omzet harian, laba kotor, dan distribusi penjualan seluruh kasir.'
                                : activeTab === 'grosir'
                                    ? 'Pantau penjualan partai besar/grosir, volume produk, dan total potongan diskon yang diberikan.'
                                    : 'Hitung kebutuhan restock barang, estimasi anggaran belanja, dan kirim pesanan PO langsung ke supplier.'}
                        </p>
                    </div>

                    {/* Toolbar Kanan: Berubah Sesuai Tab Aktif */}
                    {activeTab !== 'stock' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Select
                                value={periodPreset}
                                onChange={handlePeriodChange}
                                options={[
                                    { value: 'today', label: 'Hari Ini' },
                                    { value: '7days', label: '7 Hari Terakhir' },
                                    { value: '30days', label: '30 Hari Terakhir' },
                                    { value: 'month', label: 'Bulan Ini' },
                                    { value: 'custom', label: 'Kustom Tanggal' },
                                ]}
                                icon={Calendar}
                                size="sm"
                                fullWidth={false}
                                className="w-44"
                            />

                            <div className="flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
                                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPeriodPreset('custom'); }} className="h-8 px-2 bg-transparent text-xs outline-none dark:text-white" />
                                <span className="text-gray-400">-</span>
                                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPeriodPreset('custom'); }} className="h-8 px-2 bg-transparent text-xs outline-none dark:text-white" />
                                <Button onClick={applyFilter} size="sm" className="h-8 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs">Terapkan</Button>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 px-4 rounded-xl shadow-xs flex items-center gap-2">
                                        <Download className="size-4" /> Ekspor
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent width="w-44" align="end">
                                    <DropdownMenuItem
                                        icon={FileSpreadsheet}
                                        onClick={() => {
                                            window.location.href = `/reports/export?from=${startDate}&to=${endDate}`;
                                        }}
                                    >
                                        Unduh Laporan Lengkap (CSV)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                onClick={() => setWhatsappModalOpen(true)}
                                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2"
                            >
                                <MessageCircle className="size-4" /> Kirim WhatsApp
                            </Button>
                            <Button
                                onClick={handlePrintPO}
                                className="h-10 px-4 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] text-gray-900 font-bold text-xs shadow-sm flex items-center gap-2"
                            >
                                <Printer className="size-4" /> Cetak Surat PO
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDownloadRestockCSV}
                                className="h-10 px-4 rounded-xl text-xs flex items-center gap-2"
                            >
                                <FileSpreadsheet className="size-4 text-emerald-600" /> Unduh CSV
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'sales' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <BarChart3 className="size-4" /> Laporan Penjualan
                        </button>
                        <button
                            onClick={() => setActiveTab('grosir')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'grosir' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Tags className="size-4 text-[#f5b800]" /> Laporan Grosir
                            {grosirStats && grosirStats.total_transaksi > 0 && (
                                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-[#f5b800]/20 text-amber-800 dark:text-amber-300 font-bold">
                                    {grosirStats.total_transaksi}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'stock' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Truck className="size-4 text-[#f5b800]" /> Rencana Belanja / Restock
                            {lowStockProducts.length > 0 && (
                                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold">
                                    {lowStockProducts.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ================= KONTEN TAB 1: PENJUALAN ================= */}
                {activeTab === 'sales' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* 4 KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Omzet</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-sm font-semibold text-gray-500">Rp</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedNumber value={stats.omzet} formatter={formatRupiah} />
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Laba Kotor</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-sm font-semibold text-gray-500">Rp</span>
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        <AnimatedNumber value={stats.laba} formatter={formatRupiah} />
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Transaksi</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedNumber value={stats.transaksi} />
                                    </span>
                                    <span className="text-sm font-medium text-gray-500">Struk</span>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rata-rata (AOV)</span>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-sm font-semibold text-gray-500">Rp</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        <AnimatedNumber value={stats.aov} formatter={formatRupiah} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Grafik Batang Dinamis */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tren Penjualan</h2>
                            <p className="text-sm text-gray-500 mb-6">6 hari transaksi terakhir pada periode ini.</p>

                            <div
                                key={`${from}-${to}-${activeTab}-${chartData.length}`}
                                className="h-64 flex items-end justify-around gap-2 border-b border-gray-200 dark:border-zinc-700 pb-2"
                            >
                                {chartData.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">Belum ada data.</div>
                                ) : (
                                    chartData.map((d, index) => {
                                        const heightPercent = Math.max((d.total_omzet / maxOmzet) * 100, 6);
                                        return (
                                            <div key={d.date || index} className="flex flex-col items-center flex-1 group">
                                                <div className="w-full relative flex justify-center h-48 items-end">
                                                    <div
                                                        className="relative flex flex-col items-center justify-end w-12"
                                                        style={{ height: `${heightPercent}%` }}
                                                    >
                                                        {/* Tooltip tepat di atas puncak batang */}
                                                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none">
                                                            Rp {formatRupiah(d.total_omzet)}
                                                        </div>
                                                        {/* Batang beranimasi tumbuh dari bawah */}
                                                        <div
                                                            className="w-full h-full bg-[#f5b800] hover:bg-[#e0a800] rounded-t-md transition-colors"
                                                            style={{
                                                                transformOrigin: 'bottom',
                                                                animation: `chartBarGrow 650ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms both`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-medium text-gray-500 mt-2">
                                                    {new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* GRID ANALYTICS BAWAH GRAFIK */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* 1. Produk Terlaris */}
                            <div className="rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="size-5 text-green-500" /> Produk Terlaris
                                </h3>
                                <div className="space-y-4">
                                    {topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.nama_produk}</p>
                                                <p className="text-xs text-gray-500">{parseFloat(p.total_qty)} Terjual</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#f5b800]">Rp {formatRupiah(p.total_revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Penjualan per Kategori */}
                            <div className="rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Package className="size-5 text-blue-500" /> Pendapatan per Kategori
                                </h3>
                                <div className="space-y-4">
                                    {categorySales.map((c, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{c.nama}</span>
                                                <span className="font-bold text-gray-900 dark:text-white">Rp {formatRupiah(c.total_revenue)}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-1.5 rounded-full"
                                                    style={{
                                                        width: `${(c.total_revenue / Math.max(...categorySales.map(x => x.total_revenue))) * 100}%`,
                                                        transformOrigin: 'left',
                                                        animation: `chartBarSlide 600ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 70}ms both`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Metode Pembayaran */}
                            <div className="rounded-2xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Wallet className="size-5 text-purple-500" /> Metode Pembayaran
                                </h3>
                                <div className="space-y-3">
                                    {paymentMethods.map((m, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm">
                                                    {m.metode_bayar === 'tunai' ? <Wallet className="size-4 text-green-500" /> :
                                                        m.metode_bayar === 'qris' ? <QrCode className="size-4 text-blue-500" /> :
                                                            <CreditCard className="size-4 text-purple-500" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{m.metode_bayar}</p>
                                                    <p className="text-[10px] text-gray-500">{m.total_transaksi} Transaksi</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Rp {formatRupiah(m.total_revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tabel Rincian Harian */}
                        <div className="w-full max-w-full bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rincian Penjualan Harian</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-200">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500">
                                            <th className="py-3 px-4 font-semibold">Tanggal</th>
                                            <th className="py-3 px-4 text-center font-semibold">Struk</th>
                                            <th className="py-3 px-4 text-center font-semibold">Item Terjual</th>
                                            <th className="py-3 px-4 text-right font-semibold">Omzet Kotor</th>
                                            <th className="py-3 px-4 text-right font-semibold text-green-600">Laba Kotor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                        {salesSummary.length === 0 ? (
                                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">Tidak ada data transaksi pada rentang tanggal ini.</td></tr>
                                        ) : (
                                            salesSummary.map((d, i) => (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#2B271F] transition-colors">
                                                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                                        {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">{d.total_transaksi}</td>
                                                    <td className="py-3 px-4 text-center">{parseFloat(d.total_item)} unit</td>
                                                    <td className="py-3 px-4 text-right font-semibold">Rp {formatRupiah(d.total_omzet)}</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">Rp {formatRupiah(d.total_laba)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= KONTEN TAB: LAPORAN GROSIR ================= */}
                {activeTab === 'grosir' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* 4 KPI Cards Grosir */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Omzet Grosir</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    Rp {formatRupiah(grosirStats?.total_omzet || 0)}
                                </div>
                                <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block font-medium">Penjualan Partai / Grosir</span>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Transaksi Grosir</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {grosirStats?.total_transaksi || 0}
                                </div>
                                <span className="text-xs text-gray-500 mt-1 block font-medium">Struk dengan harga grosir</span>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Volume Barang Grosir</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {parseFloat(String(grosirStats?.total_qty || 0))} pcs
                                </div>
                                <span className="text-xs text-gray-500 mt-1 block font-medium">Total unit produk terjual</span>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Diskon Diberikan</span>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    Rp {formatRupiah(grosirStats?.total_potongan || 0)}
                                </div>
                                <span className="text-xs text-gray-500 mt-1 block font-medium">Penghematan harga bagi pembeli</span>
                            </div>
                        </div>

                        {/* Tabel Produk Terjual Grosir */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Rekap Produk Terjual Grosir</h3>
                                    <p className="text-xs text-gray-500">Daftar produk yang terjual dengan skema harga grosir pada rentang tanggal ini.</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[750px]">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                            <th className="py-3 px-4">Produk</th>
                                            <th className="py-3 px-4 text-center">Qty Terjual</th>
                                            <th className="py-3 px-4 text-right">Harga Normal</th>
                                            <th className="py-3 px-4 text-right">Harga Grosir</th>
                                            <th className="py-3 px-4 text-right">Diskon / Pcs</th>
                                            <th className="py-3 px-4 text-right">Total Omzet</th>
                                            <th className="py-3 px-4 text-right">Total Potongan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
                                        {(!topGrosirProducts || topGrosirProducts.length === 0) ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-gray-400">
                                                    Belum ada transaksi dengan harga grosir pada periode ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            topGrosirProducts.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-semibold text-gray-900 dark:text-white">{p.nama_produk}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono">{p.kode_barang}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-bold text-gray-800 dark:text-gray-200">
                                                        {parseFloat(String(p.total_qty))}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right text-gray-500 line-through">
                                                        Rp {formatRupiah(Number(p.avg_harga_normal))}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                                                        Rp {formatRupiah(Number(p.avg_harga_grosir))}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                                                        -Rp {formatRupiah(Number(p.avg_harga_normal) - Number(p.avg_harga_grosir))}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                                                        Rp {formatRupiah(Number(p.total_omzet))}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                        Rp {formatRupiah(Number(p.total_potongan))}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= KONTEN TAB 2: RENCANA BELANJA & RESTOCK ================= */}
                {activeTab === 'stock' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* 4 Kartu Metrik Rencana Pengadaan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">SKU Butuh Restock</span>
                                    <div className="mt-2 flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockProducts.length}</span>
                                        <span className="text-xs text-gray-500 font-medium">SKU</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{selectedProducts.length} dipilih untuk dipesan</p>
                                </div>
                                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="size-5" />
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Stok Kosong (0)</span>
                                    <div className="mt-2 flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</span>
                                        <span className="text-xs text-gray-500 font-medium">SKU</span>
                                    </div>
                                    <p className="text-[11px] text-red-500/80 mt-0.5">Prioritas restock darurat</p>
                                </div>
                                <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                    <ShoppingCart className="size-5" />
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Item Dipesan</span>
                                    <div className="mt-2 flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOrderQty}</span>
                                        <span className="text-xs text-gray-500 font-medium">Unit</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Akumulasi Qty order terpilih</p>
                                </div>
                                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Package className="size-5" />
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Estimasi Modal Belanja</span>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-xs font-semibold text-emerald-600">Rp</span>
                                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalEstimatedCost)}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Dihitung dari Qty x Harga Beli</p>
                                </div>
                                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <Wallet className="size-5" />
                                </div>
                            </div>
                        </div>

                        {/* Toolbar Filter & Quick Action */}
                        <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                    <input
                                        type="text"
                                        placeholder="Cari sparepart atau SKU..."
                                        value={stockSearch}
                                        onChange={(e) => setStockSearch(e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-[#f5b800] transition-all"
                                    />
                                </div>

                                <Select
                                    value={stockStatusFilter}
                                    onChange={(val) => setStockStatusFilter(val as 'all' | 'empty' | 'low')}
                                    options={[
                                        { value: 'all', label: 'Semua Status' },
                                        { value: 'empty', label: 'Hanya Stok Habis (0)' },
                                        { value: 'low', label: 'Hanya Stok Menipis (> 0)' },
                                    ]}
                                    icon={Filter}
                                    size="sm"
                                    fullWidth={false}
                                    className="w-full sm:w-48"
                                />

                                {categoriesList.length > 0 && (
                                    <Select
                                        value={stockCategoryFilter}
                                        onChange={(val) => setStockCategoryFilter(String(val))}
                                        options={[
                                            { value: 'all', label: 'Semua Kategori' },
                                            ...categoriesList.map(cat => ({ value: cat, label: cat }))
                                        ]}
                                        icon={Tags}
                                        size="sm"
                                        placeholder="Semua Kategori"
                                        fullWidth={false}
                                        className="w-full sm:w-44"
                                    />
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs text-gray-500 pt-3 xl:pt-0 border-t xl:border-t-0 border-gray-100 dark:border-zinc-800 shrink-0">
                                <span className="whitespace-nowrap font-medium">
                                    Terpilih <strong className="text-gray-900 dark:text-white font-bold">{selectedProducts.length}</strong> dari {lowStockProducts.length} SKU
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleSelectAll}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold shrink-0"
                                >
                                    {allFilteredSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                </Button>
                            </div>
                        </div>

                        {/* Tabel Rencana Belanja Interaktif */}
                        <div className="w-full max-w-full bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[950px]">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1C1A14] text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100 dark:border-zinc-800">
                                            <th className="py-3 px-4 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={allFilteredSelected}
                                                    onChange={toggleSelectAll}
                                                    className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3 px-4 font-semibold">Produk & SKU</th>
                                            <th className="py-3 px-4 font-semibold">Kategori</th>
                                            <th className="py-3 px-4 text-center font-semibold">Sisa Stok</th>
                                            <th className="py-3 px-4 text-center font-semibold">Batas Min.</th>
                                            <th className="py-3 px-4 text-right font-semibold">Harga Beli</th>
                                            <th className="py-3 px-4 text-center font-semibold w-40">Qty Pesan (Order)</th>
                                            <th className="py-3 px-4 text-right font-semibold">Estimasi Subtotal</th>
                                            <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50 text-sm">
                                        {filteredStockProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Package className="size-8 text-gray-300 dark:text-zinc-600 mb-2" />
                                                        <p className="font-medium text-gray-900 dark:text-white">Tidak ada stok yang memenuhi kriteria filter.</p>
                                                        <p className="text-xs text-gray-500 mt-1">Semua stok persediaan barang saat ini dalam kondisi aman.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStockProducts.map((p) => {
                                                const isSelected = selectedIds.has(p.id);
                                                const qty = orderQuantities[p.id] || 1;
                                                const subtotal = qty * (p.harga_beli || 0);
                                                const stokNum = parseFloat(p.stok);
                                                const isZero = stokNum <= 0;

                                                return (
                                                    <tr
                                                        key={p.id}
                                                        className={`transition-colors ${isSelected ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''} hover:bg-gray-50/80 dark:hover:bg-[#2B271F]`}
                                                    >
                                                        <td className="py-3.5 px-4 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectOne(p.id)}
                                                                className="rounded text-[#f5b800] focus:ring-[#f5b800] cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="font-semibold text-gray-900 dark:text-white">{p.nama}</div>
                                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{p.kode_barang}</div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-xs text-gray-500">
                                                            <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 font-medium">
                                                                {p.kategori?.nama || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${isZero
                                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                                }`}>
                                                                {stokNum} {p.satuan}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center text-xs text-gray-500">
                                                            {parseFloat(p.stok_minimum)} {p.satuan}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right text-xs text-gray-600 dark:text-gray-300 font-medium">
                                                            Rp {formatRupiah(p.harga_beli || 0)}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(p.id, -1)}
                                                                    disabled={qty <= 1}
                                                                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    <Minus className="size-3" />
                                                                </button>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={qty}
                                                                        onChange={(e) => setQtyDirect(p.id, parseInt(e.target.value) || 1)}
                                                                        className="w-16 h-7 text-center font-bold text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-1 focus:ring-[#f5b800]"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQty(p.id, 1)}
                                                                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                                                >
                                                                    <Plus className="size-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                                                            Rp {formatRupiah(subtotal)}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            <Link href={`/stock-in/create?product_id=${p.id}`}>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 px-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-[#f5b800] hover:text-gray-900 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all"
                                                                    title="Catat Stok Masuk"
                                                                >
                                                                    Input Stok
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {filteredStockProducts.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-gray-50 dark:bg-[#1C1A14] font-bold text-xs text-gray-900 dark:text-white border-t border-gray-200 dark:border-zinc-700">
                                                <td colSpan={6} className="py-3.5 px-4 text-right">
                                                    Total Estimasi Anggaran (Dipilih):
                                                </td>
                                                <td className="py-3.5 px-4 text-center text-blue-600 dark:text-blue-400">
                                                    {totalOrderQty} Unit
                                                </td>
                                                <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                                                    Rp {formatRupiah(totalEstimatedCost)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                    </div>
                )}

            </div>

            {/* ================= MODAL KIRIM WHATSAPP KE SUPPLIER ================= */}
            {whatsappModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#232019] border border-gray-100 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <MessageCircle className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Kirim Pesanan ke Supplier</h3>
                                    <p className="text-xs text-gray-500">Format Purchase Order (PO) langsung via pesan WhatsApp</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setWhatsappModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Pilih Supplier */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Pilih Kontak Supplier
                                </label>
                                <Select
                                    value={selectedSupplierId}
                                    onChange={(val) => handleSupplierSelect(String(val))}
                                    options={[
                                        { value: '', label: '-- Pilih Supplier Tersimpan --' },
                                        ...suppliers.map(s => ({
                                            value: String(s.id),
                                            label: `${s.nama}${s.telepon ? ` (${s.telepon})` : ''}`,
                                            description: s.alamat || undefined
                                        })),
                                        { value: 'manual', label: '+ Ketik Nama / Nomor Manual' }
                                    ]}
                                    icon={Building2}
                                    placeholder="-- Pilih Supplier Tersimpan --"
                                    searchable={suppliers.length >= 5}
                                    searchPlaceholder="Cari supplier..."
                                    fullWidth={true}
                                    className="w-full"
                                />
                            </div>

                            {/* Input Nomor Telp & Nama Jika Manual atau ingin disesuaikan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Nama Penerima / Supplier
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Toko Berkah Sparepart"
                                        value={supplierName}
                                        onChange={(e) => setSupplierName(e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Nomor WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="08xxxxxxxxxx"
                                        value={supplierPhone}
                                        onChange={(e) => setSupplierPhone(e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Catatan Tambahan */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Catatan Tambahan untuk Supplier (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Mohon dikirim via kurir sore ini"
                                    value={poNotes}
                                    onChange={(e) => setPoNotes(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Pratinjau Teks WhatsApp */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Pratinjau Pesan yang Akan Dikirim
                                    </label>
                                    <span className="text-[11px] text-gray-400">
                                        {selectedProducts.length} produk terpilih
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-700 text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed select-all">
                                    {generateWhatsAppMessage()}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                onClick={handleCopyText}
                                className="h-10 px-4 rounded-xl text-xs flex items-center gap-2"
                            >
                                <Copy className="size-4" /> Salin Teks
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setWhatsappModalOpen(false)}
                                    className="h-10 px-4 rounded-xl text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleSendWhatsApp}
                                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
                                >
                                    <Send className="size-4" /> Buka WhatsApp
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}