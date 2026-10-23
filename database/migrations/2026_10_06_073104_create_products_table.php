<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('kode_barang', 50)->unique();
            $table->string('nama', 150);
            $table->foreignId('kategori_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();
            $table->string('satuan', 20)->default('pcs');
            $table->bigInteger('harga_beli')->default(0);
            $table->bigInteger('harga_jual')->default(0);

            // stok cache — dihitung dari SUM(stock_movements.qty)
            // decimal(14,2) untuk support qty pecahan (misal 0.5 liter)
            $table->decimal('stok', 14, 2)->default(0);

            // untuk laporan stok menipis
            $table->decimal('stok_minimum', 14, 2)->default(0);

            // soft-delete via flag, bukan deleted_at
            $table->boolean('aktif')->default(true);

            $table->timestamps();

            $table->index('nama');
            $table->index('aktif');
            $table->index('kategori_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};