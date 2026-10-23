<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();
            $table->decimal('qty', 14, 2);
            $table->bigInteger('harga_beli')->default(0);
            $table->string('sumber', 150)->nullable();
            $table->text('catatan')->nullable();
            $table->date('tanggal');
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['product_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_ins');
    }
};