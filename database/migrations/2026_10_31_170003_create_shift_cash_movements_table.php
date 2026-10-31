<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete();
            $table->enum('tipe', ['masuk', 'keluar']);
            $table->bigInteger('jumlah');
            $table->string('alasan', 255);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['shift_id', 'tipe']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->bigInteger('total_kas_masuk')->default(0)->after('total_penjualan_tunai');
            $table->bigInteger('total_kas_keluar')->default(0)->after('total_kas_masuk');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_cash_movements');

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn(['total_kas_masuk', 'total_kas_keluar']);
        });
    }
};
