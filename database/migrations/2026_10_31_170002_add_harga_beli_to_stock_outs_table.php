<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_outs', function (Blueprint $table) {
            $table->bigInteger('harga_beli')->default(0)->after('qty');
        });

        // Backfill data lama dari tabel products
        if (DB::getDriverName() === 'mysql') {
            DB::statement('
                UPDATE stock_outs
                JOIN products ON stock_outs.product_id = products.id
                SET stock_outs.harga_beli = products.harga_beli
            ');
        } else {
            DB::statement('
                UPDATE stock_outs
                SET harga_beli = (
                    SELECT COALESCE(harga_beli, 0)
                    FROM products
                    WHERE products.id = stock_outs.product_id
                )
            ');
        }
    }

    public function down(): void
    {
        Schema::table('stock_outs', function (Blueprint $table) {
            $table->dropColumn('harga_beli');
        });
    }
};
