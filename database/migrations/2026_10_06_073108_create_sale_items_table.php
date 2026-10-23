<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')
                ->constrained('sales')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            // snapshot — kalau produk diubah/dihapus, riwayat tetap akurat
            $table->string('kode_barang', 50);
            $table->string('nama_produk', 150);

            $table->decimal('qty', 14, 2);
            $table->bigInteger('harga_jual'); // snapshot harga saat transaksi
            $table->bigInteger('subtotal');
            $table->timestamps();

            $table->index('sale_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};