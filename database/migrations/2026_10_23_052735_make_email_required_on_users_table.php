<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // <-- Tambahkan ini

return new class extends Migration
{
        public function up(): void
    {
        // 1. Isi email user lama yang masih kosong dengan email format default
        DB::table('users')->whereNull('email')->update([
            'email' => DB::raw("CONCAT(username, '@sartikamotor.local')")
        ]);

        // 2. Ubah kolom email menjadi wajib (NOT NULL) tanpa unique() lagi
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
        });
    }
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
        });
    }
};