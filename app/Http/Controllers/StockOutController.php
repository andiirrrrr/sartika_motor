<?php

namespace App\Http\Controllers;

use App\Exceptions\StokTidakCukupException;
use App\Models\StockOut;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockOutController extends Controller
{
    public function index(): Response
    {
        $stockOuts = StockOut::with(['product:id,kode_barang,nama,satuan,harga_beli', 'createdBy:id,nama'])
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        // 1. Total Item Keluar
        $totalItem = StockOut::sum('qty');

        // 2. Estimasi Kerugian (Qty * Snapshot Harga Beli Historis)
        $totalLoss = StockOut::leftJoin('products', 'stock_outs.product_id', '=', 'products.id')
            ->sum(DB::raw('stock_outs.qty * CASE WHEN stock_outs.harga_beli > 0 THEN stock_outs.harga_beli ELSE COALESCE(products.harga_beli, 0) END'));

        // 3. Alasan Dominan
        $topReason = StockOut::select('alasan', DB::raw('count(*) as count'))
            ->groupBy('alasan')
            ->orderByDesc('count')
            ->first();

        return Inertia::render('StockOut/Index', [
            'stockOuts' => $stockOuts,
            'stats' => [
                'total_item' => (float) $totalItem,
                'total_loss' => (float) $totalLoss,
                'top_reason' => $topReason ? $topReason->alasan : '-',
                'top_reason_count' => $topReason ? $topReason->count : 0,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('StockOut/Create');
    }

    public function store(Request $request, StockService $stockService)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty' => 'required|numeric|min:0.01',
            'alasan' => 'required|in:rusak,hilang,pemakaian_sendiri,koreksi',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        try {
            $stockService->stockOut($validated, auth()->id());

            return redirect()->route('stock-out.index')->with('success', 'Stok keluar berhasil dicatat.');
        } catch (StokTidakCukupException $e) {
            return back()->withErrors(['qty' => $e->getMessage()])->withInput();
        }
    }
}
