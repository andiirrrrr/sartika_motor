<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
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
        $salesSummary = Sale::whereBetween('tanggal', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->selectRaw('DATE(tanggal) as date, COUNT(*) as total_transaksi, SUM(total) as total_omzet')
            ->groupBy('date')
            ->orderBy('date', 'asc') // Urutkan naik untuk chart
            ->get();

        // 2. Data Detail Item & Laba Kotor (Join Sale Items & Products)
        $details = DB::table('sales')
            ->join('sale_items', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.tanggal', [$from . ' 00:00:00', $to . ' 23:59:59'])
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

        // 3. Laporan Stok Menipis
        $lowStockProducts = Product::with('kategori:id,nama')
            ->stokMenipis()
            ->orderBy('stok', 'asc')
            ->get(['id', 'kode_barang', 'nama', 'kategori_id', 'stok', 'stok_minimum', 'satuan']);

        return Inertia::render('Reports/Index', [
            'from' => $from,
            'to' => $to,
            'salesSummary' => $salesSummary,
            'chartData' => $chartData,
            'lowStockProducts' => $lowStockProducts,
            'stats' => [
                'omzet' => $totalOmzet,
                'transaksi' => $totalTransaksi,
                'laba' => $totalLabaKotor,
                'item' => $totalItem,
                'aov' => $aov,
            ]
        ]);
    }
}