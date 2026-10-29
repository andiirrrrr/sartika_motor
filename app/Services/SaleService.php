<?php

namespace App\Services;

use App\Exceptions\CheckoutException;
use App\Exceptions\StokTidakCukupException;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SaleService
{
    public function __construct(
        private readonly StockService $stockService,
    ) {}

    /**
     * Proses checkout POS secara atomic.
     *
     * @param  array{
     *     items: array<int, array{product_id:int, qty:float|int|string}>,
     *     metode_bayar: string,
     *     bayar?: int|float|string,
     * }  $data
     */
    public function checkout(array $data, int $kasirId): Sale
    {
        $items = $this->normalizeItems($data['items'] ?? []);
        $metodeBayar = $this->validateMetodeBayar($data['metode_bayar'] ?? '');

        return DB::transaction(function () use ($items, $metodeBayar, $data, $kasirId) {
            // 1. Lock semua produk dalam 1 query — urut ascending untuk hindari deadlock
            $productIds = array_column($items, 'product_id');
            sort($productIds);

            $products = Product::whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($products->count() !== count($productIds)) {
                $missing = array_diff($productIds, $products->keys()->all());
                throw new CheckoutException(
                    'Produk tidak ditemukan: ID '.implode(', ', $missing)
                );
            }

            // 2. Validasi setiap produk + hitung total
            $total = 0;
            $validatedItems = [];

            foreach ($items as $item) {
                /** @var Product $product */
                $product = $products->get($item['product_id']);

                if (! $product->aktif) {
                    throw new CheckoutException(
                        "Produk {$product->nama} sudah tidak aktif."
                    );
                }

                $qty = (float) $item['qty'];
                if ($qty <= 0) {
                    throw new CheckoutException(
                        "Qty untuk {$product->nama} harus lebih dari 0."
                    );
                }

                if ((float) $product->stok < $qty) {
                    throw new StokTidakCukupException(
                        $product,
                        (float) $product->stok,
                        $qty
                    );
                }

                $hargaNormal = (int) $product->harga_jual;
                $hargaJual = $hargaNormal;
                $isGrosir = false;

                // Cek apakah memenuhi syarat harga grosir
                if ($product->harga_grosir && $product->min_qty_grosir && $qty >= (float) $product->min_qty_grosir) {
                    $hargaJual = (int) $product->harga_grosir;
                    $isGrosir = true;
                }

                $subtotal = $hargaJual * $qty;
                $total += $subtotal;

                $validatedItems[] = [
                    'product' => $product,
                    'qty' => $qty,
                    'harga_jual' => $hargaJual,
                    'harga_normal' => $hargaNormal,
                    'is_grosir' => $isGrosir,
                    'subtotal' => (int) $subtotal,
                ];
            }

            if ($total <= 0) {
                throw new CheckoutException('Total transaksi harus lebih dari 0.');
            }

            // 3. Hitung bayar & kembalian
            [$bayar, $kembalian] = $this->hitungPembayaran(
                $metodeBayar,
                $data['bayar'] ?? null,
                $total
            );

            // 4. Insert sales header
            $sale = Sale::create([
                'no_transaksi' => $this->generateNoTransaksi(),
                'tanggal' => now(),
                'total' => $total,
                'metode_bayar' => $metodeBayar,
                'payment_method_id' => $data['payment_method_id'] ?? null,
                'bayar' => $bayar,
                'kembalian' => $kembalian,
                'nama_pelanggan' => ! empty($data['nama_pelanggan']) ? trim($data['nama_pelanggan']) : null,
                'no_wa' => ! empty($data['no_wa']) ? trim($data['no_wa']) : null,
                'kasir_id' => $kasirId,
                'shift_id' => $data['shift_id'] ?? null,
            ]);

            // 5. Insert sale_items + catat stock movement
            foreach ($validatedItems as $item) {
                /** @var Product $product */
                $product = $item['product'];

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'kode_barang' => $product->kode_barang,   // snapshot
                    'nama_produk' => $product->nama,           // snapshot
                    'qty' => $item['qty'],
                    'harga_jual' => $item['harga_jual'],       // snapshot
                    'is_grosir' => $item['is_grosir'],
                    'harga_normal' => $item['harga_normal'],
                    'subtotal' => $item['subtotal'],
                ]);

                // StockService akan update products.stok + insert stock_movements
                // Produk sudah di-lock, jadi aman.
                $this->stockService->recordSaleMovement(
                    lockedProduct: $product,
                    qty: $item['qty'],
                    saleId: $sale->id,
                    userId: $kasirId,
                    tanggal: now()->toDateString(),
                );
            }

            return $sale->fresh(['items', 'kasir:id,nama,username', 'paymentMethod']);
        });
    }

    /**
     * Generate nomor transaksi: INV-YYYYMMDD-XXXX
     * XXXX = urutan harian (4 digit, reset tiap hari).
     */
    private function generateNoTransaksi(): string
    {
        $prefix = 'INV-'.now()->format('Ymd').'-';

        $last = Sale::where('no_transaksi', 'like', $prefix.'%')
            ->orderByDesc('no_transaksi')
            ->lockForUpdate()
            ->first();

        $nextNumber = 1;
        if ($last) {
            $lastNumber = (int) substr($last->no_transaksi, -4);
            $nextNumber = $lastNumber + 1;
        }

        return $prefix.str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Validasi & normalisasi input items.
     * - Tolak product_id duplikat (frontend harus merge qty sebelum kirim)
     * - Pastikan tiap item punya product_id & qty
     */
    private function normalizeItems(mixed $items): array
    {
        if (! is_array($items) || empty($items)) {
            throw new InvalidArgumentException('Keranjang tidak boleh kosong.');
        }

        $seen = [];
        $normalized = [];

        foreach ($items as $item) {
            if (! isset($item['product_id'], $item['qty'])) {
                throw new InvalidArgumentException('Setiap item harus punya product_id dan qty.');
            }

            $productId = (int) $item['product_id'];
            if (isset($seen[$productId])) {
                throw new InvalidArgumentException(
                    "Produk ID {$productId} muncul lebih dari sekali. Gabungkan qty-nya dulu."
                );
            }
            $seen[$productId] = true;

            if (! is_numeric($item['qty']) || (float) $item['qty'] <= 0) {
                throw new InvalidArgumentException(
                    "Qty untuk produk ID {$productId} harus berupa angka positif."
                );
            }

            $normalized[] = [
                'product_id' => $productId,
                'qty' => (float) $item['qty'],
            ];
        }

        return $normalized;
    }

    private function validateMetodeBayar(mixed $metode): string
    {
        $allowed = ['tunai', 'transfer', 'qris'];
        if (! is_string($metode) || ! in_array($metode, $allowed, true)) {
            throw new InvalidArgumentException(
                'Metode bayar harus salah satu dari: '.implode(', ', $allowed)
            );
        }

        return $metode;
    }

    /**
     * Hitung bayar & kembalian.
     * - Tunai: user input jumlah bayar, kembalian = bayar - total.
     * - Transfer/QRIS: bayar = total, kembalian = 0 (uang masuk pas).
     *
     * @return array{0:int, 1:int}
     */
    private function hitungPembayaran(string $metode, mixed $bayarInput, int $total): array
    {
        if ($metode === 'tunai') {
            if ($bayarInput === null || ! is_numeric($bayarInput)) {
                throw new CheckoutException('Jumlah bayar wajib diisi untuk pembayaran tunai.');
            }
            $bayar = (int) $bayarInput;
            if ($bayar < $total) {
                throw new CheckoutException(
                    'Jumlah bayar kurang dari total. Total: '.number_format($total, 0, ',', '.')
                );
            }

            return [$bayar, $bayar - $total];
        }

        // transfer/qris
        return [$total, 0];
    }
}
