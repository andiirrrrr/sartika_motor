<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            $table->enum('tipe', ['masuk', 'keluar', 'penjualan', 'koreksi']);

            // qty bertanda: positif = masuk, negatif = keluar/penjualan
            $table->decimal('qty', 14, 2);

            // snapshot saldo stok SETELAH pergerakan ini
            // berguna untuk halaman riwayat: baca langsung, tidak perlu SUM runtime
            $table->decimal('stok_setelah', 14, 2);

            $table->bigInteger('harga_beli')->nullable();
            $table->string('alasan', 50)->nullable();
            $table->text('catatan')->nullable();

            // polymorphic manual — referensi ke tabel sumber
            // contoh: ('stock_in', 5), ('stock_out', 3), ('sale', 42)
            $table->string('referensi_tipe', 30)->nullable();
            $table->unsignedBigInteger('referensi_id')->nullable();

            $table->date('tanggal');

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['product_id', 'tanggal']);
            $table->index(['referensi_tipe', 'referensi_id']);
            $table->index('tipe');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};