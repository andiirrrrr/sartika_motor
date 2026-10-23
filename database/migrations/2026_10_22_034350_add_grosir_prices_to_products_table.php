<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Harga grosir (nullable, jika kosong berarti tidak ada harga grosir)
            $table->bigInteger('harga_grosir')->nullable()->after('harga_jual');
            // Minimal qty untuk mendapatkan harga grosir
            $table->decimal('min_qty_grosir', 14, 2)->nullable()->after('harga_grosir');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['harga_grosir', 'min_qty_grosir']);
        });
    }
};