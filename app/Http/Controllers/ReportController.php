<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $from = $request->input('from', now()->startOfMonth()->toDateString());
        $to = $request->input('to', now()->toDateString());

        // 1. Data Penjualan Harian
        $salesSummary = Sale::whereBetween('tanggal', [$from.' 00:00:00', $to.' 23:59:59'])
            ->selectRaw('DATE(tanggal) as date, COUNT(*) as total_transaksi, SUM(total) as total_omzet')
            ->groupBy('date')
            ->orderBy('date', 'asc') // Urutkan naik untuk chart
            ->get();

        // 2. Data Detail Item & Laba Kotor (Join Sale Items & Products)
        $details = DB::table('sales')
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.tanggal', [$from.' 00:00:00', $to.' 23:59:59'])
            ->selectRaw('DATE(sales.tanggal) as date, SUM(sale_items.qty) as total_item, SUM((sale_items.harga_jual - products.harga_beli) * sale_items.qty) as total_laba')
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        // Gabungkan data
        $salesSummary = $salesSummary->map(function ($item) use ($details) {
            $item->total_item = $details->get($item->date)->total_item ?? 0;
            $item->total_laba = $details->get($item->date)->total_laba ?? 0;

            return $item;
        })->reverse()->values(); // Balikkan urutan (terbaru di atas untuk tabel)

        $totalOmzet = $salesSummary->sum('total_omzet');
        $totalTransaksi = $salesSummary->sum('total_transaksi');
        $totalLabaKotor = $salesSummary->sum('total_laba');
        $totalItem = $salesSummary->sum('total_item');
        $aov = $totalTransaksi > 0 ? $totalOmzet / $totalTransaksi : 0;

        // Ambil 6 data terakhir untuk grafik (urut dari lama ke baru)
        $chartData = $salesSummary->take(6)->reverse()->values();

        // 3. Laporan Stok Menipis & Rencana Belanja
        $lowStockProducts = Product::with('kategori:id,nama')
            ->stokMenipis()
            ->orderBy('stok', 'asc')
            ->get(['id', 'kode_barang', 'nama', 'kategori_id', 'stok', 'stok_minimum', 'satuan', 'harga_beli']);

        $suppliers = Supplier::orderBy('nama')->get(['id', 'nama', 'telepon', 'alamat']);

        $storeSettings = [
            'store_name' => Setting::get('store_name', 'Sartika Motor'),
            'store_address' => Setting::get('store_address', 'Jl. Raya Motor No. 123'),
            'store_phone' => Setting::get('store_phone', '0812-3456-7890'),
        ];

        // 4. Produk Terlaris (Top 5)
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->select('sale_items.nama_produk', DB::raw('SUM(sale_items.qty) as total_qty'), DB::raw('SUM(sale_items.subtotal) as total_revenue'))
            ->whereBetween('sales.tanggal', [$from.' 00:00:00', $to.' 23:59:59'])
            ->groupBy('sale_items.nama_produk')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // 5. Penjualan per Kategori
        $categorySales = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('categories', 'products.kategori_id', '=', 'categories.id')
            ->select('categories.nama', DB::raw('SUM(sale_items.subtotal) as total_revenue'))
            ->whereBetween('sales.tanggal', [$from.' 00:00:00', $to.' 23:59:59'])
            ->groupBy('categories.nama')
            ->orderByDesc('total_revenue')
            ->get();

        // 6. Metode Pembayaran
        $paymentMethods = DB::table('sales')
            ->select('metode_bayar', DB::raw('COUNT(*) as total_transaksi'), DB::raw('SUM(total) as total_revenue'))
            ->whereBetween('tanggal', [$from.' 00:00:00', $to.' 23:59:59'])
            ->groupBy('metode_bayar')
            ->get();

        // 7. Laporan Grosir
        $grosirItemsQuery = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.tanggal', [$from.' 00:00:00', $to.' 23:59:59'])
            ->where('sale_items.is_grosir', true);

        $grosirStats = [
            'total_transaksi' => Sale::whereBetween('tanggal', [$from.' 00:00:00', $to.' 23:59:59'])
                ->whereHas('items', fn ($q) => $q->where('is_grosir', true))
                ->count(),
            'total_qty' => (float) (clone $grosirItemsQuery)->sum('sale_items.qty'),
            'total_omzet' => (float) (clone $grosirItemsQuery)->sum('sale_items.subtotal'),
            'total_potongan' => (float) (clone $grosirItemsQuery)->sum(DB::raw('(sale_items.harga_normal - sale_items.harga_jual) * sale_items.qty')),
        ];

        $topGrosirProducts = (clone $grosirItemsQuery)
            ->select([
                'sale_items.nama_produk',
                'sale_items.kode_barang',
                DB::raw('SUM(sale_items.qty) as total_qty'),
                DB::raw('ROUND(AVG(sale_items.harga_normal)) as avg_harga_normal'),
                DB::raw('ROUND(AVG(sale_items.harga_jual)) as avg_harga_grosir'),
                DB::raw('SUM(sale_items.subtotal) as total_omzet'),
                DB::raw('SUM((sale_items.harga_normal - sale_items.harga_jual) * sale_items.qty) as total_potongan'),
            ])
            ->groupBy('sale_items.nama_produk', 'sale_items.kode_barang')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        return Inertia::render('Reports/Index', [
            'from' => $from,
            'to' => $to,
            'salesSummary' => $salesSummary,
            'chartData' => $chartData,
            'lowStockProducts' => $lowStockProducts,
            'suppliers' => $suppliers,
            'storeSettings' => $storeSettings,
            'stats' => [
                'omzet' => $totalOmzet,
                'transaksi' => $totalTransaksi,
                'laba' => $totalLabaKotor,
                'item' => $totalItem,
                'aov' => $aov,
            ],
            'topProducts' => $topProducts,
            'categorySales' => $categorySales,
            'paymentMethods' => $paymentMethods,
            'grosirStats' => $grosirStats,
            'topGrosirProducts' => $topGrosirProducts,
        ]);
    }
}
