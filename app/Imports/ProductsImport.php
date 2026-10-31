<?php

namespace App\Imports;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Database\Eloquent\Model;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductsImport implements ToModel, WithChunkReading, WithHeadingRow
{
    private $userId;

    private $stockService;

    public function __construct($userId)
    {
        $this->userId = $userId;
        $this->stockService = app(StockService::class);
    }

    public function model(array $row): ?Model
    {
        // Lewati baris jika kode_barang atau nama kosong
        if (empty($row['kode_barang']) || empty($row['nama'])) {
            return null;
        }

        // 1. Handle Kategori otomatis
        $kategoriId = null;
        if (! empty($row['kategori'])) {
            $kategori = Category::firstOrCreate(['nama' => trim($row['kategori'])]);
            $kategoriId = $kategori->id;
        }

        $hargaBeli = (int) ($row['harga_beli'] ?? 0);
        $hargaJual = (int) ($row['harga_jual'] ?? 0);
        $hargaGrosir = ! empty($row['harga_grosir']) ? (int) $row['harga_grosir'] : null;
        $minQtyGrosir = ! empty($row['min_qty_grosir']) ? (float) $row['min_qty_grosir'] : null;

        // Validasi Aturan Grosir: Harga grosir harus lebih murah dari harga normal dan min_qty >= 2
        if ($hargaGrosir !== null && ($hargaGrosir >= $hargaJual || empty($minQtyGrosir) || $minQtyGrosir < 2)) {
            $hargaGrosir = null;
            $minQtyGrosir = null;
        }

        // 2. Cek apakah produk sudah ada (berdasarkan kode)
        $existingProduct = Product::where('kode_barang', trim($row['kode_barang']))->first();

        if ($existingProduct) {
            $oldPrices = [
                'harga_beli' => (int) $existingProduct->harga_beli,
                'harga_jual' => (int) $existingProduct->harga_jual,
                'harga_grosir' => $existingProduct->harga_grosir ? (int) $existingProduct->harga_grosir : null,
            ];

            $newPrices = [
                'harga_beli' => $hargaBeli,
                'harga_jual' => $hargaJual,
                'harga_grosir' => $hargaGrosir,
            ];

            $priceChanged = ($oldPrices['harga_beli'] !== $newPrices['harga_beli']) ||
                             ($oldPrices['harga_jual'] !== $newPrices['harga_jual']) ||
                             ($oldPrices['harga_grosir'] !== $newPrices['harga_grosir']);

            // Update datanya
            $existingProduct->update([
                'nama' => $row['nama'],
                'kategori_id' => $kategoriId,
                'satuan' => $row['satuan'] ?? 'pcs',
                'harga_beli' => $hargaBeli,
                'harga_jual' => $hargaJual,
                'harga_grosir' => $hargaGrosir,
                'min_qty_grosir' => $minQtyGrosir,
                'stok_minimum' => (float) ($row['stok_minimum'] ?? 0),
                'aktif' => true,
            ]);

            if ($priceChanged) {
                ActivityLog::log(
                    tipe: 'ubah_harga_produk',
                    deskripsi: "Perubahan harga produk {$existingProduct->nama} ({$existingProduct->kode_barang}) via Import Excel",
                    subjekTipe: 'Product',
                    subjekId: $existingProduct->id,
                    dataLama: $oldPrices,
                    dataBaru: $newPrices,
                );
            }

            return null; // Kembalikan null karena sudah di-update manual
        }

        // 3. Jika produk baru, buat datanya
        $product = Product::create([
            'kode_barang' => trim($row['kode_barang']),
            'nama' => $row['nama'],
            'kategori_id' => $kategoriId,
            'satuan' => $row['satuan'] ?? 'pcs',
            'harga_beli' => $hargaBeli,
            'harga_jual' => $hargaJual,
            'harga_grosir' => $hargaGrosir,
            'min_qty_grosir' => $minQtyGrosir,
            'stok_minimum' => (float) ($row['stok_minimum'] ?? 0),
            'aktif' => true,
        ]);

        // 4. Catat stok awal jika diisi di Excel
        $stokAwal = (float) ($row['stok'] ?? 0);
        if ($stokAwal > 0) {
            $this->stockService->stockIn([
                'product_id' => $product->id,
                'qty' => $stokAwal,
                'harga_beli' => $hargaBeli,
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
