<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\StockIn;
use App\Services\StockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockInController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $stockIns = StockIn::with(['product:id,kode_barang,nama,satuan', 'supplier:id,nama', 'createdBy:id,nama'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    // Cari berdasarkan nama produk atau kode barang
                    $q->whereHas('product', function ($prodQuery) use ($search) {
                        $prodQuery->where('nama', 'like', "%{$search}%")
                                  ->orWhere('kode_barang', 'like', "%{$search}%");
                    })
                    // ATAU cari berdasarkan nama supplier
                    ->orWhereHas('supplier', function ($supQuery) use ($search) {
                        $supQuery->where('nama', 'like', "%{$search}%");
                    });
                });
            })
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString(); // Penting agar parameter search tidak hilang saat pindah halaman

        return Inertia::render('StockIn/Index', [
            'stockIns' => $stockIns,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('StockIn/Create', [
            // Kirim data supplier ke frontend
            'suppliers' => Supplier::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function store(Request $request, StockService $stockService)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'nullable|exists:suppliers,id', // Validasi supplier_id
            'qty' => 'required|numeric|min:0.01',
            'harga_beli' => 'required|numeric|min:0',
            'tanggal' => 'required|date',
            'catatan' => 'nullable|string',
        ]);

        $stockService->stockIn($validated, auth()->id());

        return redirect()->route('stock-in.index')->with('success', 'Stok masuk berhasil dicatat.');
    }
}