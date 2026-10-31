<?php

namespace Tests\Feature;

use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditFixesTest extends TestCase
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

    public function test_wholesale_price_must_be_lower_than_retail_price(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/products', [
            'kode_barang' => 'TEST-001',
            'nama' => 'Oli Mesin Super',
            'satuan' => 'botol',
            'harga_beli' => 40000,
            'harga_jual' => 50000,
            'harga_grosir' => 55000, // Invalid: grosir lebih mahal dari jual
            'min_qty_grosir' => 5,
            'stok_minimum' => 5,
        ]);

        $response->assertSessionHasErrors(['harga_grosir']);
    }

    public function test_wholesale_requires_min_qty_and_vice_versa(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/products', [
            'kode_barang' => 'TEST-002',
            'nama' => 'Busi Iridium',
            'satuan' => 'pcs',
            'harga_beli' => 20000,
            'harga_jual' => 30000,
            'harga_grosir' => 25000,
            'min_qty_grosir' => null, // Invalid: harus diisi jika harga grosir ada
            'stok_minimum' => 2,
        ]);

        $response->assertSessionHasErrors(['min_qty_grosir']);
    }

    public function test_user_with_sales_or_shifts_cannot_be_deleted(): void
    {
        $admin = $this->createAdmin();
        $kasir = $this->createKasir();

        // Buat shift untuk kasir
        Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 100000,
            'status' => 'buka',
        ]);

        // Coba hapus kasir
        $response = $this->actingAs($admin)->delete("/users/{$kasir->id}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $kasir->id]);
    }

    public function test_cashier_can_open_shift_with_zero_initial_cash(): void
    {
        $kasir = $this->createKasir();

        $response = $this->actingAs($kasir)->post('/shifts/open', [
            'modal_awal' => 0,
        ]);

        $response->assertRedirect('/pos');
        $this->assertDatabaseHas('shifts', [
            'user_id' => $kasir->id,
            'modal_awal' => 0,
            'status' => 'buka',
        ]);
    }

    public function test_store_settings_accepts_receipt_paper_size(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->put('/settings', [
            'store_name' => 'Sartika Motor Test',
            'store_address' => 'Jl. Test No. 12',
            'store_phone' => '08123456789',
            'receipt_footer' => 'Terima Kasih',
            'receipt_paper_size' => '58mm',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('58mm', Setting::get('receipt_paper_size'));
    }

    public function test_pos_checkout_snapshots_cost_price_on_sale_items(): void
    {
        $kasir = $this->createKasir();

        // Buka shift
        $shift = Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 50000,
            'status' => 'buka',
        ]);

        // Buat produk dengan harga beli spesifik
        $product = Product::create([
            'kode_barang' => 'TEST-SNAP-1',
            'nama' => 'Kampas Rem Depan',
            'satuan' => 'set',
            'harga_beli' => 35000,
            'harga_jual' => 60000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);
        $product->stok = 10;
        $product->save();

        $response = $this->actingAs($kasir)->postJson('/pos/checkout', [
            'items' => [
                ['product_id' => $product->id, 'qty' => 2],
            ],
            'metode_bayar' => 'tunai',
            'bayar' => 150000,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Verifikasi harga_beli ter-snapshot sebesar 35.000 di sale_items
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $product->id,
            'qty' => 2,
            'harga_jual' => 60000,
            'harga_beli' => 35000,
        ]);
    }

    public function test_kasir_cannot_see_harga_beli_in_products_search(): void
    {
        $kasir = $this->createKasir();
        $admin = $this->createAdmin();

        $product = Product::create([
            'kode_barang' => 'SEC-001',
            'nama' => 'Filter Udara Vario',
            'satuan' => 'pcs',
            'harga_beli' => 25000,
            'harga_jual' => 45000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);
        $product->stok = 10;
        $product->save();

        // Kasir mencari produk -> harga_beli TIDAK boleh ada
        $kasirRes = $this->actingAs($kasir)->getJson('/products/search?q=Filter');
        $kasirRes->assertStatus(200);
        $kasirData = $kasirRes->json();
        $this->assertNotEmpty($kasirData);
        $this->assertArrayNotHasKey('harga_beli', $kasirData[0]);

        // Admin mencari produk -> harga_beli BOLEH ada (untuk form stok masuk)
        $adminRes = $this->actingAs($admin)->getJson('/products/search?q=Filter');
        $adminRes->assertStatus(200);
        $adminData = $adminRes->json();
        $this->assertNotEmpty($adminData);
        $this->assertArrayHasKey('harga_beli', $adminData[0]);
    }

    public function test_checkout_rejects_inactive_payment_method(): void
    {
        $kasir = $this->createKasir();

        Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now(),
            'modal_awal' => 50000,
            'status' => 'buka',
        ]);

        $pm = PaymentMethod::create([
            'nama' => 'Rekening Lama Ditutup',
            'tipe' => 'transfer',
            'nama_bank' => 'Mandiri',
            'nomor_rekening' => '123456789',
            'atas_nama' => 'Sartika',
            'aktif' => false, // Non-aktif
        ]);

        $product = Product::create([
            'kode_barang' => 'SEC-002',
            'nama' => 'Oli Gear',
            'satuan' => 'botol',
            'harga_beli' => 10000,
            'harga_jual' => 18000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);
        $product->stok = 10;
        $product->save();

        $response = $this->actingAs($kasir)->postJson('/pos/checkout', [
            'items' => [
                ['product_id' => $product->id, 'qty' => 1],
            ],
            'metode_bayar' => 'transfer',
            'payment_method_id' => $pm->id,
            'bayar' => 18000,
        ]);

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);
    }

    public function test_price_change_creates_activity_log(): void
    {
        $admin = $this->createAdmin();

        $product = Product::create([
            'kode_barang' => 'SEC-PRICE-1',
            'nama' => 'Ban Luar Tubeless',
            'satuan' => 'pcs',
            'harga_beli' => 150000,
            'harga_jual' => 210000,
            'stok_minimum' => 2,
            'aktif' => true,
        ]);

        $response = $this->actingAs($admin)->put("/products/{$product->id}", [
            'kode_barang' => 'SEC-PRICE-1',
            'nama' => 'Ban Luar Tubeless',
            'satuan' => 'pcs',
            'harga_beli' => 160000, // naik
            'harga_jual' => 230000, // naik
            'stok_minimum' => 2,
            'aktif' => true,
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('activity_logs', [
            'tipe' => 'ubah_harga_produk',
            'subjek_tipe' => 'Product',
            'subjek_id' => $product->id,
        ]);
    }

    public function test_admin_can_force_close_abandoned_shift_with_audit_log(): void
    {
        $admin = $this->createAdmin();
        $kasir = $this->createKasir();

        $shift = Shift::create([
            'user_id' => $kasir->id,
            'waktu_buka' => now()->subHours(5),
            'modal_awal' => 100000,
            'status' => 'buka',
        ]);

        $response = $this->actingAs($admin)->post("/shifts/{$shift->id}/force-close", [
            'uang_fisik' => 100000,
            'alasan' => 'Kasir pulang darurat karena sakit',
        ]);

        $response->assertSessionHas('success');
        $shift->refresh();
        $this->assertEquals('tutup', $shift->status);

        $this->assertDatabaseHas('activity_logs', [
            'tipe' => 'force_close_shift',
            'subjek_tipe' => 'Shift',
            'subjek_id' => $shift->id,
        ]);
    }
}
