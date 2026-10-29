<?php

namespace App\Http\Controllers;

use App\Exports\ProductsExport;
use App\Imports\ProductsImport;
use App\Models\Category;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

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
                'gambar' => $p->gambar,
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
            ],
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
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $gambarPath = null;
            if ($request->hasFile('gambar')) {
                $gambarPath = $this->uploadAndConvertToWebp($request->file('gambar'));
            }
            $product = Product::create([
                'kode_barang' => $validated['kode_barang'],
                'nama' => $validated['nama'],
                'gambar' => $gambarPath,
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
            if (! empty($validated['stok_awal']) && $validated['stok_awal'] > 0) {
                $stockService = app(StockService::class);
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
                'id', 'kode_barang', 'nama', 'gambar', 'kategori_id', 'satuan',
                'harga_beli', 'harga_jual', 'harga_grosir', 'min_qty_grosir',
                'stok_minimum', 'aktif'
            ),
            'categories' => Category::orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'kode_barang' => 'required|string|max:50|unique:products,kode_barang,'.$product->id,
            'nama' => 'required|string|max:150',
            'kategori_id' => 'nullable|exists:categories,id',
            'satuan' => 'required|string|max:20',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'harga_grosir' => 'nullable|numeric|min:0',
            'min_qty_grosir' => 'nullable|numeric|min:0.01',
            'stok_minimum' => 'required|numeric|min:0',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'aktif' => 'boolean',
        ]);

        if ($request->hasFile('gambar')) {
            // Hapus gambar lama jika ada
            if ($product->gambar && \Storage::disk('public')->exists($product->gambar)) {
                \Storage::disk('public')->delete($product->gambar);
            }
            $validated['gambar'] = $this->uploadAndConvertToWebp($request->file('gambar'));
        }

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
        $keyword = trim((string) $request->input('q', ''));
        $kategoriId = $request->input('kategori_id');

        $query = Product::aktif();

        if (strlen($keyword) >= 2) {
            // Mode Pencarian: Tampilkan semua produk yang cocok (termasuk stok 0),
            // prioritaskan produk dengan stok > 0 di urutan teratas
            $query->cari($keyword)
                ->orderByRaw('CASE WHEN stok > 0 THEN 0 ELSE 1 END')
                ->orderByDesc('id');
        } elseif ($kategoriId) {
            // Mode Browse Kategori: Hanya tampilkan produk yang stoknya ready
            $query->where('kategori_id', $kategoriId)
                ->where('stok', '>', 0)
                ->orderByDesc('id');
        } else {
            // Mode Browse Utama: Hanya tampilkan produk yang stoknya ready
            $query->where('stok', '>', 0)
                ->orderByDesc('id');
        }

        $products = $query->limit(50)
            ->get([
                'id', 'kode_barang', 'nama', 'gambar', 'stok', 'satuan',
                'harga_beli', 'harga_jual', 'harga_grosir', 'min_qty_grosir',
            ]);

        return response()->json($products);
    }

    public function export()
    {
        return Excel::download(new ProductsExport, 'data-produk-'.date('Y-m-d').'.xlsx');
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
            return back()->with('error', 'Terjadi kesalahan saat import: '.$e->getMessage());
        }
    }

    private function uploadAndConvertToWebp($file)
    {
        // 1. Buat nama file unik
        $filename = time().'_'.uniqid().'.webp';
        $path = 'products/'.$filename;

        // 2. Ambil konten gambar asli
        $imageContent = file_get_contents($file->getRealPath());
        $image = imagecreatefromstring($imageContent);

        if (! $image) {
            throw new \Exception('Format gambar tidak didukung.');
        }

        // 3. Konversi dan simpan sebagai WebP (kualitas 80%)
        $storagePath = storage_path('app/public/'.$path);
        // Pastikan folder ada
        if (! file_exists(dirname($storagePath))) {
            mkdir(dirname($storagePath), 0755, true);
        }

        imagewebp($image, $storagePath, 80);
        imagedestroy($image);

        return $path;
    }

    public function destroy(Product $product)
    {
        try {
            // Cek apakah produk sudah memiliki riwayat penjualan atau pergerakan stok
            if ($product->saleItems()->exists() || $product->stockMovements()->exists()) {
                // Tolak hapus jika ada riwayat
                return back()->with('error', 'Produk tidak bisa dihapus permanen karena sudah memiliki riwayat transaksi/stok. Silakan edit produk dan ubah status menjadi Nonaktif.');
            }

            // Jika tidak ada riwayat, hapus permanen
            $product->delete();

            return back()->with('success', 'Produk berhasil dihapus permanen.');

        } catch (\Exception $e) {
            return back()->with('error', 'Terjadi kesalahan saat menghapus produk.');
        }
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:products,id',
        ]);

        $ids = $validated['ids'];
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $product = Product::find($id);
            if (! $product) {
                continue;
            }

            if ($product->saleItems()->exists() || $product->stockMovements()->exists()) {
                $skippedCount++;

                continue;
            }

            $product->delete();
            $deletedCount++;
        }

        if ($deletedCount > 0 && $skippedCount === 0) {
            return back()->with('success', "{$deletedCount} produk berhasil dihapus permanen.");
        } elseif ($deletedCount > 0 && $skippedCount > 0) {
            return back()->with('warning', "{$deletedCount} produk berhasil dihapus. {$skippedCount} produk dilewati karena memiliki riwayat transaksi/stok.");
        } else {
            return back()->with('error', 'Semua produk yang dipilih tidak dapat dihapus karena sudah memiliki riwayat transaksi/stok.');
        }
    }
}
