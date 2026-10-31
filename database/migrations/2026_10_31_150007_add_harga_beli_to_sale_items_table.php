<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->bigInteger('harga_beli')->default(0)->after('qty');
        });

        // Backfill data historis dari products.harga_beli (kompatibel MySQL & SQLite)
        if (DB::getDriverName() === 'mysql') {
            DB::statement('
                UPDATE sale_items 
                JOIN products ON products.id = sale_items.product_id 
                SET sale_items.harga_beli = products.harga_beli 
                WHERE sale_items.harga_beli = 0
            ');
        } else {
            DB::statement('
                UPDATE sale_items 
                SET harga_beli = COALESCE((SELECT harga_beli FROM products WHERE products.id = sale_items.product_id), 0)
                WHERE harga_beli = 0
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('harga_beli');
        });
    }
};
