<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProductsExport;
use App\Imports\ProductsImport;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $kategoriId = $request->input('kategori_id');
        $perPage = (int) $request->input('per_page', 20);
        $perPage = in_array($perPage, [10, 20, 50, 100], true) ? $perPage : 20;

        $products = Product::query()
            ->with('kategori:id,nama')
            ->when($search !== '', fn ($q) => $q->cari($search))
            ->when($kategoriId, fn ($q) => $q->where('kategori_id', $kategoriId))
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Product $p) => [
                'id' => $p->id,
                'kode_barang' => $p->kode_barang,
                'nama' => $p->nama,
                'kategori' => $p->kategori?->nama,
                'satuan' => $p->satuan,
                'harga_beli' => $p->harga_beli,
                'harga_jual' => $p->harga_jual,
                'harga_grosir' => $p->harga_grosir,
                'min_qty_grosir' => $p->min_qty_grosir,
                'stok' => $p->stok,
                'stok_minimum' => $p->stok_minimum,
                'aktif' => $p->aktif,
            ]);

        $totalSku = Product::count();
        $lowStock = Product::stokMenipis()->where('stok', '>', 0)->count();
        $outOfStock = Product::where('stok', '<=', 0)->count();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => Category::orderBy('nama')->get(['id', 'nama']),
            'filters' => [
                'search' => $search,
                'kategori_id' => $kategoriId,
                'per_page' => $perPage,
            ],
            // Kirim data metrik ke frontend
            'stats' => [
                'total_sku' => $totalSku,
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock,
            ]
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Create', [
            'categories' => Category::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang' => 'required|string|max:50|unique:products,kode_barang',
            'nama' => 'required|string|max:150',
            'kategori_id' => 'nullable|exists:categories,id',
            'satuan' => 'required|string|max:20',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'harga_grosir' => 'nullable|numeric|min:0',
            'min_qty_grosir' => 'nullable|numeric|min:0.01',
            'stok_minimum' => 'required|numeric|min:0',
            'stok_awal' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            $product = Product::create([
                'kode_barang' => $validated['kode_barang'],
                'nama' => $validated['nama'],
                'kategori_id' => $validated['kategori_id'] ?: null,
                'satuan' => $validated['satuan'],
                'harga_beli' => (int) $validated['harga_beli'],
                'harga_jual' => (int) $validated['harga_jual'],
                'harga_grosir' => $validated['harga_grosir'] ? (int) $validated['harga_grosir'] : null,
                'min_qty_grosir' => $validated['min_qty_grosir'] ?: null,
                'stok_minimum' => $validated['stok_minimum'],
                'aktif' => true,
            ]);

            // Jika stok awal diisi, otomatis buat catatan stok masuk
            if (!empty($validated['stok_awal']) && $validated['stok_awal'] > 0) {
                $stockService = app(\App\Services\StockService::class);
                $stockService->stockIn([
                    'product_id' => $product->id,
                    'qty' => $validated['stok_awal'],
                    'harga_beli' => (int) $validated['harga_beli'],
                    'sumber' => 'Stok Awal Sistem',
                    'tanggal' => now()->toDateString(),
                ], auth()->id());
            }
        });

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Products/Edit', [
            'product' => $product->only(
                'id', 'kode_barang', 'nama', 'kategori_id', 'satuan', 
                'harga_beli', 'harga_jual', 'harga_grosir', 'min_qty_grosir', 
                'stok_minimum', 'aktif'
            ),
            'categories' => Category::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'kode_barang' => 'required|string|max:50|unique:products,kode_barang,' . $product->id,
            'nama' => 'required|string|max:150',
            'kategori_id' => 'nullable|exists:categories,id',
            'satuan' => 'required|string|max:20',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'harga_grosir' => 'nullable|numeric|min:0',
            'min_qty_grosir' => 'nullable|numeric|min:0.01',
            'stok_minimum' => 'required|numeric|min:0',
            'aktif' => 'boolean',
        ]);

        // Konversi string kosong menjadi null agar database bersih
        $validated['harga_grosir'] = $validated['harga_grosir'] ? (int) $validated['harga_grosir'] : null;
        $validated['min_qty_grosir'] = $validated['min_qty_grosir'] ?: null;

        $product->update($validated);

        return redirect()->route('products.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function show(Product $product): Response
    {
        $movements = $product->stockMovements()
            ->with('createdBy:id,nama')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        // Hitung total masuk & keluar bulan ini
        $totalInBulanIni = $product->stockMovements()
            ->where('tipe', 'masuk')
            ->whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)
            ->sum('qty');

        $totalOutBulanIni = abs($product->stockMovements()
            ->whereIn('tipe', ['keluar', 'penjualan'])
            ->whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)
            ->sum('qty'));

        return Inertia::render('Products/Show', [
            'product' => $product->only(
                'id', 'kode_barang', 'nama', 'satuan', 'stok', 
                'harga_beli', 'harga_jual', 'stok_minimum'
            ),
            'kategori' => $product->kategori?->nama,
            'movements' => $movements,
            'totalInBulanIni' => (float) $totalInBulanIni,
            'totalOutBulanIni' => (float) $totalOutBulanIni,
        ]);
    }

    public function search(Request $request)
    {
        $keyword = $request->input('q', '');
        $kategoriId = $request->input('kategori_id');

        $query = Product::aktif();

        if (strlen($keyword) >= 2) {
            $query->cari($keyword);
        } elseif ($kategoriId) {
            $query->where('kategori_id', $kategoriId);
        }

        $products = $query->orderByDesc('id')
            ->limit(50)
            ->get([
                'id', 'kode_barang', 'nama', 'stok', 'satuan', 
                'harga_beli', 'harga_jual', 'harga_grosir', 'min_qty_grosir'
            ]);

        return response()->json($products);
    }

    public function export()
    {
        return Excel::download(new ProductsExport, 'data-produk-' . date('Y-m-d') . '.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240', // Maksimal 10MB
        ]);

        try {
            Excel::import(new ProductsImport(auth()->id()), $request->file('file'));
            return back()->with('success', 'Data produk berhasil diimport!');
        } catch (\Exception $e) {
            return back()->with('error', 'Terjadi kesalahan saat import: ' . $e->getMessage());
        }
    }
}