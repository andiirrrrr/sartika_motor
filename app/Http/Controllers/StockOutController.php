<?php

namespace App\Http\Controllers;

use App\Models\StockOut;
use App\Services\StockService;
use Illuminate\Http\Request;
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
        $totalItem = \App\Models\StockOut::sum('qty');

        // 2. Estimasi Kerugian (Qty * Harga Beli Produk)
        $totalLoss = \App\Models\StockOut::join('products', 'stock_outs.product_id', '=', 'products.id')
            ->sum(\Illuminate\Support\Facades\DB::raw('stock_outs.qty * products.harga_beli'));

        // 3. Alasan Dominan
        $topReason = \App\Models\StockOut::select('alasan', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
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
            ]
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
        } catch (\App\Exceptions\StokTidakCukupException $e) {
            return back()->withErrors(['qty' => $e->getMessage()])->withInput();
        }
    }
}