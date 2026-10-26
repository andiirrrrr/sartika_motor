<?php

namespace Tests\Feature;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentMethodTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::create([
            'nama' => 'Admin Test',
            'username' => 'admin_test',
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
    }

    public function test_admin_can_access_payment_methods_page(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/payment-methods');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_transfer_payment_method(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/payment-methods', [
            'nama' => 'BCA Operasional',
            'tipe' => 'transfer',
            'nama_bank' => 'BCA',
            'nomor_rekening' => '888001122',
            'atas_nama' => 'Sartika Motor',
            'aktif' => true,
            'urutan' => 1,
            'keterangan' => 'Akun utama',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', [
            'nama' => 'BCA Operasional',
            'tipe' => 'transfer',
            'nomor_rekening' => '888001122',
        ]);
    }

    public function test_admin_can_toggle_payment_method_status(): void
    {
        $admin = $this->createAdmin();
        $method = PaymentMethod::create([
            'nama' => 'QRIS Test',
            'tipe' => 'qris',
            'aktif' => true,
            'urutan' => 2,
        ]);

        $response = $this->actingAs($admin)->patch("/payment-methods/{$method->id}/toggle");

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', [
            'id' => $method->id,
            'aktif' => false,
        ]);
    }

    public function test_transfer_payment_method_auto_generates_name(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/payment-methods', [
            'tipe' => 'transfer',
            'nama_bank' => 'Mandiri',
            'nomor_rekening' => '1122334455',
            'atas_nama' => 'PT Sartika',
            'aktif' => true,
            'urutan' => 3,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_methods', [
            'nama' => 'Transfer Mandiri',
            'tipe' => 'transfer',
            'nama_bank' => 'Mandiri',
            'nomor_rekening' => '1122334455',
        ]);
    }

    public function test_qris_and_cash_auto_generates_name(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)->post('/payment-methods', [
            'tipe' => 'qris',
            'aktif' => true,
        ]);

        $this->assertDatabaseHas('payment_methods', [
            'nama' => 'QRIS',
            'tipe' => 'qris',
        ]);

        $this->actingAs($admin)->post('/payment-methods', [
            'tipe' => 'tunai',
            'aktif' => true,
        ]);

        $this->assertDatabaseHas('payment_methods', [
            'nama' => 'Tunai (Cash)',
            'tipe' => 'tunai',
        ]);
    }
}
