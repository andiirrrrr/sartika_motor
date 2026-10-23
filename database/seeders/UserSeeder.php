<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminUsername = env('SEED_ADMIN_USERNAME', 'admin');
        $adminPassword = env('SEED_ADMIN_PASSWORD');
        $kasirUsername = env('SEED_KASIR_USERNAME', 'kasir');
        $kasirPassword = env('SEED_KASIR_PASSWORD');

        if (! $adminPassword || ! $kasirPassword) {
            $this->command->error(
                'SEED_ADMIN_PASSWORD dan SEED_KASIR_PASSWORD wajib diisi di .env'
            );
            return;
        }

        User::updateOrCreate(
            ['username' => $adminUsername],
            [
                'nama' => 'Administrator',
                'password' => $adminPassword,
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['username' => $kasirUsername],
            [
                'nama' => 'Kasir',
                'password' => $kasirPassword,
                'role' => 'kasir',
            ]
        );

        $this->command->info("Admin  : {$adminUsername}");
        $this->command->info("Kasir  : {$kasirUsername}");
        $this->command->warn('Password diambil dari .env, tidak ditampilkan di sini.');
    }
}