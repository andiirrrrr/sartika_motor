<?php

namespace App\Services;

use App\Exceptions\StokTidakCukupException;
use App\Models\Product;
use App\Models\StockIn;
use App\Models\StockMovement;
use App\Models\StockOut;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class StockService
{
    /**
     * Catat stok masuk manual (dari supplier, koreksi opname positif, dll).
     *
     * @param  array{product_id:int, qty:float|int|string, harga_beli?:int, sumber?:string, catatan?:string, tanggal:string}  $data
     */
    public function stockIn(array $data, int $userId): StockIn
    {
        $this->validateQty($data['qty']);

        return DB::transaction(function () use ($data, $userId) {
            $product = $this->lockProduct((int) $data['product_id']);

            $qty = abs((float) $data['qty']);
            $hargaBeliBaru = isset($data['harga_beli']) ? (int) $data['harga_beli'] : 0;

            $stockIn = StockIn::create([
                'product_id' => $product->id,
                'supplier_id' => $data['supplier_id'] ?? null,
                'qty' => $qty,
                'harga_beli' => $hargaBeliBaru,
                'sumber' => $data['sumber'] ?? null,
                'catatan' => $data['catatan'] ?? null,
                'tanggal' => $data['tanggal'],
                'created_by' => $userId,
            ]);

            // --- LOGIKA AVERAGE COST (HPP RATA-RATA) ---
            if ($hargaBeliBaru > 0) {
                $stokLama = (float) $product->stok;
                $hargaRataLama = (float) $product->harga_beli;
                
                // Hitung total nilai aset lama dan baru
                $totalNilaiLama = $stokLama * $hargaRataLama;
                $totalNilaiBaru = $qty * $hargaBeliBaru;
                
                $totalStokBaru = $stokLama + $qty;
                
                // Hitung harga rata-rata baru
                if ($totalStokBaru > 0) {
                    $hargaRataBaru = ($totalNilaiLama + $totalNilaiBaru) / $totalStokBaru;
                    $product->harga_beli = (int) round($hargaRataBaru);
                } else {
                    $product->harga_beli = $hargaBeliBaru;
                }
            }

            $this->recordMovement(
                product: $product,
                tipe: 'masuk',
                qty: $qty,
                hargaBeli: $hargaBeliBaru > 0 ? $hargaBeliBaru : null,
                alasan: null,
                catatan: $data['catatan'] ?? null,
                referensiTipe: 'stock_in',
                referensiId: $stockIn->id,
                tanggal: $data['tanggal'],
                userId: $userId,
            );

            // Simpan perubahan harga rata-rata ke database
            $product->save();

            return $stockIn;
        });
    }

    /**
     * Catat stok keluar manual (rusak/hilang/pemakaian sendiri/koreksi negatif).
     *
     * @param  array{product_id:int, qty:float|int|string, alasan:string, catatan?:string, tanggal:string}  $data
     */
    public function stockOut(array $data, int $userId): StockOut
    {
        $this->validateQty($data['qty']);

        return DB::transaction(function () use ($data, $userId) {
            $product = $this->lockProduct((int) $data['product_id']);

            $qty = abs((float) $data['qty']);

            if ((float) $product->stok < $qty) {
                throw new StokTidakCukupException(
                    $product,
                    (float) $product->stok,
                    $qty
                );
            }

            $stockOut = StockOut::create([
                'product_id' => $product->id,
                'qty' => $qty,
                'alasan' => $data['alasan'],
                'catatan' => $data['catatan'] ?? null,
                'tanggal' => $data['tanggal'],
                'created_by' => $userId,
            ]);

            $this->recordMovement(
                product: $product,
                tipe: 'keluar',
                qty: -$qty,
                hargaBeli: null,
                alasan: $data['alasan'],
                catatan: $data['catatan'] ?? null,
                referensiTipe: 'stock_out',
                referensiId: $stockOut->id,
                tanggal: $data['tanggal'],
                userId: $userId,
            );

            return $stockOut;
        });
    }

    /**
     * Catat pergerakan stok dari penjualan POS.
     *
     * PENTING: Method ini HARUS dipanggil dari dalam transaction SaleService,
     * dan `$lockedProduct` HARUS sudah di-lockForUpdate() oleh SaleService.
     * Jangan panggil method ini dari luar flow checkout POS.
     */
    public function recordSaleMovement(
        Product $lockedProduct,
        float $qty,
        int $saleId,
        int $userId,
        ?string $tanggal = null,
    ): void {
        $qty = abs($qty);

        if ((float) $lockedProduct->stok < $qty) {
            throw new StokTidakCukupException(
                $lockedProduct,
                (float) $lockedProduct->stok,
                $qty
            );
        }

        $this->recordMovement(
            product: $lockedProduct,
            tipe: 'penjualan',
            qty: -$qty,
            hargaBeli: null,
            alasan: null,
            catatan: null,
            referensiTipe: 'sale',
            referensiId: $saleId,
            tanggal: $tanggal ?? now()->toDateString(),
            userId: $userId,
        );
    }

    /**
     * Internal: catat 1 baris di stock_movements + update cache stok di products.
     *
     * Asumsi: sudah dalam DB transaction DAN product sudah di-lock.
     */
    private function recordMovement(
        Product $product,
        string $tipe,
        float $qty,
        ?int $hargaBeli,
        ?string $alasan,
        ?string $catatan,
        ?string $referensiTipe,
        ?int $referensiId,
        string $tanggal,
        int $userId,
    ): StockMovement {
        $stokSebelum = (float) $product->stok;
        $stokSetelah = $stokSebelum + $qty;

        // Safety net: jangan sampai stok minus
        if ($stokSetelah < 0) {
            throw new StokTidakCukupException(
                $product,
                $stokSebelum,
                abs($qty)
            );
        }

        $movement = StockMovement::create([
            'product_id' => $product->id,
            'tipe' => $tipe,
            'qty' => $qty,
            'stok_setelah' => $stokSetelah,
            'harga_beli' => $hargaBeli,
            'alasan' => $alasan,
            'catatan' => $catatan,
            'referensi_tipe' => $referensiTipe,
            'referensi_id' => $referensiId,
            'tanggal' => $tanggal,
            'created_by' => $userId,
        ]);

        $product->stok = $stokSetelah;
        $product->save();

        return $movement;
    }

    /**
     * Lock produk dengan row-level lock. Wajib dipanggil dalam DB transaction.
     */
    private function lockProduct(int $productId): Product
    {
        $product = Product::where('id', $productId)
            ->lockForUpdate()
            ->first();

        if (! $product) {
            throw new RuntimeException("Produk dengan ID {$productId} tidak ditemukan.");
        }

        if (! $product->aktif) {
            throw new RuntimeException("Produk {$product->nama} sudah tidak aktif dan tidak bisa ditransaksikan.");
        }

        return $product;
    }

    private function validateQty(mixed $qty): void
    {
        if (! is_numeric($qty) || (float) $qty <= 0) {
            throw new InvalidArgumentException('Qty harus berupa angka positif.');
        }
    }
}