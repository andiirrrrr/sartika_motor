<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Shift;
use App\Models\User;
use App\Services\SaleService;
use App\Services\StockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessLogicAuditTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::create([
            'nama' => 'Admin Test',
            'username' => 'admin_test',
            'email' => 'admin@test.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);
    }

    private function createKasir(): User
    {
        return User::create([
            'nama' => 'Kasir Test',
            'username' => 'kasir_test',
            'email' => 'kasir@test.com',
            'password' => 'password123',
            'role' => 'kasir',
        ]);
    }

    public function test_void_sale_restores_stock_and_records_activity_log(): void
    {
        $admin = $this->createAdmin();
        $kasir = $this->createKasir();

        $product = Product::create([
            'kode_barang' => 'BRG-001',
            'nama' => 'Kampas Rem Depan',
            'satuan' => 'pcs',
            'harga_beli' => 30000,
            'harga_jual' => 45000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);
        $product->stok = 10;
        $product->save();

        $shift = Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'buka',
        ]);

        $saleService = app(SaleService::class);
        $sale = $saleService->checkout([
            'items' => [
                ['product_id' => $product->id, 'qty' => 3],
            ],
            'metode_bayar' => 'tunai',
            'bayar' => 150000,
            'shift_id' => $shift->id,
        ], $kasir->id);

        $product->refresh();
        $this->assertEquals(7, (float) $product->stok);

        // Admin melakukan void transaksi
        $response = $this->actingAs($admin)->post("/sales/{$sale->id}/void", [
            'alasan' => 'Pelanggan salah tipe motor, minta batal',
        ]);

        $response->assertSessionHas('success');

        $sale->refresh();
        $this->assertEquals('void', $sale->status);
        $this->assertEquals('Pelanggan salah tipe motor, minta batal', $sale->void_reason);
        $this->assertEquals($admin->id, $sale->voided_by);

        // Stok produk harus kembali utuh ke 10
        $product->refresh();
        $this->assertEquals(10, (float) $product->stok);

        // Mutasi pengembalian stok tercatat
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'tipe' => 'koreksi',
            'qty' => 3,
            'referensi_tipe' => 'sale_void',
            'referensi_id' => $sale->id,
        ]);

        // Audit log tercatat
        $this->assertDatabaseHas('activity_logs', [
            'tipe' => 'void_transaksi',
            'subjek_tipe' => 'Sale',
            'subjek_id' => $sale->id,
        ]);
    }

    public function test_void_sale_excludes_from_shift_cash_reconciliation(): void
    {
        $admin = $this->createAdmin();
        $kasir = $this->createKasir();

        $product = Product::create([
            'kode_barang' => 'BRG-002',
            'nama' => 'Oli Mesin Matic',
            'satuan' => 'botol',
            'harga_beli' => 40000,
            'harga_jual' => 60000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);
        $product->stok = 10;
        $product->save();

        $shift = Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 50000,
            'status' => 'buka',
        ]);

        $saleService = app(SaleService::class);
        $sale = $saleService->checkout([
            'items' => [
                ['product_id' => $product->id, 'qty' => 1],
            ],
            'metode_bayar' => 'tunai',
            'bayar' => 100000,
            'shift_id' => $shift->id,
        ], $kasir->id);

        // Void transaksi ini
        $saleService->voidSale($sale, $admin->id, 'Batal beli');

        // Kasir menutup shift dengan fisik Rp 50.000 (modal awal)
        $this->actingAs($kasir)->post('/shifts/close', [
            'uang_fisik' => 50000,
        ]);

        $shift->refresh();
        $this->assertEquals('tutup', $shift->status);
        $this->assertEquals(0, $shift->total_penjualan_tunai);
        $this->assertEquals(50000, $shift->uang_seharusnya);
        $this->assertEquals(0, $shift->selisih);
    }

    public function test_shift_cash_movement_petty_cash_adjusts_expected_cash(): void
    {
        $kasir = $this->createKasir();

        $shift = Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'buka',
        ]);

        // 1. Kas Keluar Operasional Rp 25.000 (beli bensin)
        $this->actingAs($kasir)->post("/shifts/{$shift->id}/cash-movement", [
            'tipe' => 'keluar',
            'jumlah' => 25000,
            'alasan' => 'Beli bensin kompresor',
        ])->assertSessionHas('success');

        // 2. Kas Masuk Tambahan Rp 15.000 (receh owner)
        $this->actingAs($kasir)->post("/shifts/{$shift->id}/cash-movement", [
            'tipe' => 'masuk',
            'jumlah' => 15000,
            'alasan' => 'Uang receh tambahan dari owner',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('shift_cash_movements', [
            'shift_id' => $shift->id,
            'tipe' => 'keluar',
            'jumlah' => 25000,
        ]);

        $this->assertDatabaseHas('shift_cash_movements', [
            'shift_id' => $shift->id,
            'tipe' => 'masuk',
            'jumlah' => 15000,
        ]);

        // Tutup shift: Modal (100k) + Masuk (15k) - Keluar (25k) = 90k
        $this->actingAs($kasir)->post('/shifts/close', [
            'uang_fisik' => 90000,
        ]);

        $shift->refresh();
        $this->assertEquals(15000, $shift->total_kas_masuk);
        $this->assertEquals(25000, $shift->total_kas_keluar);
        $this->assertEquals(90000, $shift->uang_seharusnya);
        $this->assertEquals(0, $shift->selisih);
    }

    public function test_idempotency_prevents_duplicate_sales_on_retry(): void
    {
        $kasir = $this->createKasir();

        $product = Product::create([
            'kode_barang' => 'BRG-003',
            'nama' => 'Busi Iridium',
            'satuan' => 'pcs',
            'harga_beli' => 20000,
            'harga_jual' => 35000,
            'stok_minimum' => 1,
            'aktif' => true,
        ]);
        $product->stok = 5;
        $product->save();

        Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 50000,
            'status' => 'buka',
        ]);

        $idempotencyKey = 'uuid-test-idempotency-key-12345';

        // Request 1
        $response1 = $this->actingAs($kasir)->postJson('/pos/checkout', [
            'items' => [
                ['product_id' => $product->id, 'qty' => 1],
            ],
            'metode_bayar' => 'tunai',
            'bayar' => 50000,
            'idempotency_key' => $idempotencyKey,
        ]);

        $response1->assertOk();
        $saleId1 = $response1->json('sale.id');

        // Request 2 (Retry dengan idempotency key yang sama)
        $response2 = $this->actingAs($kasir)->postJson('/pos/checkout', [
            'items' => [
                ['product_id' => $product->id, 'qty' => 1],
            ],
            'metode_bayar' => 'tunai',
            'bayar' => 50000,
            'idempotency_key' => $idempotencyKey,
        ]);

        $response2->assertOk();
        $saleId2 = $response2->json('sale.id');

        // Harus mengembalikan sale yang sama persis
        $this->assertEquals($saleId1, $saleId2);

        // Stok hanya berkurang 1 (dari 5 menjadi 4, bukan 3)
        $product->refresh();
        $this->assertEquals(4, (float) $product->stok);
        $this->assertEquals(1, Sale::where('idempotency_key', $idempotencyKey)->count());
    }

    public function test_business_validation_error_returns_422_status(): void
    {
        $kasir = $this->createKasir();

        $product = Product::create([
            'kode_barang' => 'BRG-004',
            'nama' => 'Rantai Motor',
            'satuan' => 'set',
            'harga_beli' => 100000,
            'harga_jual' => 150000,
            'stok_minimum' => 1,
            'aktif' => true,
        ]);
        $product->stok = 2;
        $product->save();

        Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 50000,
            'status' => 'buka',
        ]);

        // Beli qty 5 melebihi stok 2
        $response = $this->actingAs($kasir)->postJson('/pos/checkout', [
            'items' => [
                ['product_id' => $product->id, 'qty' => 5],
            ],
            'metode_bayar' => 'tunai',
            'bayar' => 1000000,
        ]);

        $response->assertStatus(422);
        $this->assertFalse($response->json('success'));
    }

    public function test_stock_in_with_zero_price_calculates_weighted_average_hpp(): void
    {
        $admin = $this->createAdmin();

        $product = Product::create([
            'kode_barang' => 'BRG-005',
            'nama' => 'Minyak Rem DOT 4',
            'satuan' => 'botol',
            'harga_beli' => 20000, // HPP lama: 20.000
            'harga_jual' => 30000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);
        $product->stok = 10;
        $product->save();

        $stockService = app(StockService::class);

        // Masuk 10 botol gratis (bonus supplier) dengan harga 0
        $stockService->stockIn([
            'product_id' => $product->id,
            'qty' => 10,
            'harga_beli' => 0,
            'tanggal' => now()->toDateString(),
            'catatan' => 'Bonus promo supplier',
        ], $admin->id);

        $product->refresh();
        $this->assertEquals(20, (float) $product->stok);
        // HPP baru: (10 * 20.000 + 10 * 0) / 20 = 10.000
        $this->assertEquals(10000, $product->harga_beli);
    }

    public function test_stock_out_snapshots_historical_harga_beli(): void
    {
        $admin = $this->createAdmin();

        $product = Product::create([
            'kode_barang' => 'BRG-006',
            'nama' => 'Lampu LED Depan',
            'satuan' => 'pcs',
            'harga_beli' => 35000,
            'harga_jual' => 50000,
            'stok_minimum' => 1,
            'aktif' => true,
        ]);
        $product->stok = 5;
        $product->save();

        $this->actingAs($admin)->post('/stock-out', [
            'product_id' => $product->id,
            'qty' => 2,
            'alasan' => 'rusak',
            'tanggal' => now()->toDateString(),
            'catatan' => 'Pecah saat bongkar muat',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('stock_outs', [
            'product_id' => $product->id,
            'qty' => 2,
            'harga_beli' => 35000,
        ]);
    }

    public function test_report_export_streams_complete_csv(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/reports/export?from=2026-10-01&to=2026-10-31');

        $response->assertOk();
        $this->assertEquals('text/csv; charset=UTF-8', $response->headers->get('Content-Type'));
        $content = $response->streamedContent();

        $this->assertStringContainsString('No Transaksi', $content);
        $this->assertStringContainsString('Total Omzet (Rp)', $content);
        $this->assertStringContainsString('Laba Kotor (Rp)', $content);
    }

    public function test_product_store_fails_when_selling_price_not_greater_than_cost_price(): void
    {
        $admin = $this->createAdmin();

        // Test harga jual < harga beli
        $response = $this->actingAs($admin)->post('/products', [
            'kode_barang' => 'BRG-VAL-01',
            'nama' => 'Oli Mesin Super',
            'satuan' => 'botol',
            'harga_beli' => 50000,
            'harga_jual' => 45000,
            'stok_minimum' => 2,
        ]);
        $response->assertSessionHasErrors(['harga_jual']);

        // Test harga jual == harga beli
        $responseSame = $this->actingAs($admin)->post('/products', [
            'kode_barang' => 'BRG-VAL-02',
            'nama' => 'Oli Mesin Super 2',
            'satuan' => 'botol',
            'harga_beli' => 50000,
            'harga_jual' => 50000,
            'stok_minimum' => 2,
        ]);
        $responseSame->assertSessionHasErrors(['harga_jual']);
    }

    public function test_product_update_fails_when_selling_price_not_greater_than_cost_price(): void
    {
        $admin = $this->createAdmin();

        $product = Product::create([
            'kode_barang' => 'BRG-VAL-03',
            'nama' => 'Busi Iridium',
            'satuan' => 'pcs',
            'harga_beli' => 30000,
            'harga_jual' => 45000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);

        $response = $this->actingAs($admin)->put("/products/{$product->id}", [
            'kode_barang' => 'BRG-VAL-03',
            'nama' => 'Busi Iridium',
            'satuan' => 'pcs',
            'harga_beli' => 50000,
            'harga_jual' => 40000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);

        $response->assertSessionHasErrors(['harga_jual']);
    }

    public function test_product_store_succeeds_when_selling_price_greater_than_cost_price(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/products', [
            'kode_barang' => 'BRG-VAL-04',
            'nama' => 'Kampas Kopling Racing',
            'satuan' => 'set',
            'harga_beli' => 80000,
            'harga_jual' => 110000,
            'stok_minimum' => 2,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('products', [
            'kode_barang' => 'BRG-VAL-04',
            'harga_beli' => 80000,
            'harga_jual' => 110000,
        ]);
    }
}
