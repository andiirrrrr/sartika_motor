<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Product;
use App\Services\StockService;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Database\Eloquent\Model;

class ProductsImport implements ToModel, WithHeadingRow, WithChunkReading
{
    private $userId;
    private $stockService;

    public function __construct($userId)
    {
        $this->userId = $userId;
        $this->stockService = app(StockService::class);
    }

    public function model(array $row): ?\Illuminate\Database\Eloquent\Model
    {
        // Lewati baris jika kode_barang kosong
        if (empty($row['kode_barang']) || empty($row['nama'])) {
            return null;
        }

        // 1. Handle Kategori otomatis
        $kategoriId = null;
        if (!empty($row['kategori'])) {
            $kategori = Category::firstOrCreate(['nama' => trim($row['kategori'])]);
            $kategoriId = $kategori->id;
        }

        // 2. Cek apakah produk sudah ada (berdasarkan kode)
        $existingProduct = Product::where('kode_barang', trim($row['kode_barang']))->first();

        if ($existingProduct) {
            // Jika ada, update datanya (tanpa mengubah stok cache)
            $existingProduct->update([
                'nama' => $row['nama'],
                'kategori_id' => $kategoriId,
                'satuan' => $row['satuan'] ?? 'pcs',
                'harga_beli' => (int) ($row['harga_beli'] ?? 0),
                'harga_jual' => (int) ($row['harga_jual'] ?? 0),
                'harga_grosir' => !empty($row['harga_grosir']) ? (int) $row['harga_grosir'] : null,
                'min_qty_grosir' => !empty($row['min_qty_grosir']) ? (float) $row['min_qty_grosir'] : null,
                'stok_minimum' => (float) ($row['stok_minimum'] ?? 0),
                'aktif' => true,
            ]);
            return null; // Kembalikan null karena sudah di-update manual
        }

        // 3. Jika produk baru, buat datanya
        $product = Product::create([
            'kode_barang' => trim($row['kode_barang']),
            'nama' => $row['nama'],
            'kategori_id' => $kategoriId,
            'satuan' => $row['satuan'] ?? 'pcs',
            'harga_beli' => (int) ($row['harga_beli'] ?? 0),
            'harga_jual' => (int) ($row['harga_jual'] ?? 0),
            'harga_grosir' => !empty($row['harga_grosir']) ? (int) $row['harga_grosir'] : null,
            'min_qty_grosir' => !empty($row['min_qty_grosir']) ? (float) $row['min_qty_grosir'] : null,
            'stok_minimum' => (float) ($row['stok_minimum'] ?? 0),
            'aktif' => true,
        ]);

        // 4. Catat stok awal jika diisi di Excel
        $stokAwal = (float) ($row['stok'] ?? 0);
        if ($stokAwal > 0) {
            $this->stockService->stockIn([
                'product_id' => $product->id,
                'qty' => $stokAwal,
                'harga_beli' => (int) ($row['harga_beli'] ?? 0),
                'sumber' => 'Import Excel',
                'tanggal' => now()->toDateString(),
            ], $this->userId);
        }

        return $product;
    }

    // Memproses 500 baris sekaligus agar tidak timeout untuk ribuan data
    public function chunkSize(): int
    {
        return 500;
    }
}