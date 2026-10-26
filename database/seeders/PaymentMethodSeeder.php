<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'nama' => 'Tunai (Cash)',
                'tipe' => 'tunai',
                'nama_bank' => null,
                'nomor_rekening' => null,
                'atas_nama' => null,
                'qr_image' => null,
                'aktif' => true,
                'urutan' => 1,
                'keterangan' => 'Pembayaran tunai kasir',
            ],
            [
                'nama' => 'Transfer BCA',
                'tipe' => 'transfer',
                'nama_bank' => 'BCA',
                'nomor_rekening' => '1234567890',
                'atas_nama' => 'Sartika Motor',
                'qr_image' => null,
                'aktif' => true,
                'urutan' => 2,
                'keterangan' => 'Rekening operasional toko',
            ],
            [
                'nama' => 'QRIS Toko',
                'tipe' => 'qris',
                'nama_bank' => null,
                'nomor_rekening' => null,
                'atas_nama' => null,
                'qr_image' => null,
                'aktif' => true,
                'urutan' => 3,
                'keterangan' => 'Scan QRIS Dinamis / Statis Toko',
            ],
        ];

        foreach ($defaults as $item) {
            PaymentMethod::firstOrCreate(
                ['nama' => $item['nama']],
                $item
            );
        }
    }
}
