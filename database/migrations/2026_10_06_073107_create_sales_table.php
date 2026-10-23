<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('no_transaksi', 30)->unique();
            $table->dateTime('tanggal');
            $table->bigInteger('total');
            $table->enum('metode_bayar', ['tunai', 'transfer', 'qris']);

            // untuk tunai: uang diterima & kembalian
            // untuk transfer/qris: bayar = total, kembalian = 0
            $table->bigInteger('bayar')->default(0);
            $table->bigInteger('kembalian')->default(0);

            $table->foreignId('kasir_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestamps();

            $table->index('tanggal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};