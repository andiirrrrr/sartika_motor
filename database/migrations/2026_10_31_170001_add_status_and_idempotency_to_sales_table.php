<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('status', 20)->default('selesai')->after('shift_id');
            $table->string('idempotency_key', 64)->nullable()->unique()->after('status');
            $table->timestamp('voided_at')->nullable()->after('idempotency_key');
            $table->foreignId('voided_by')->nullable()->after('voided_at')->constrained('users')->nullOnDelete();
            $table->string('void_reason', 255)->nullable()->after('voided_by');

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign(['voided_by']);
                $table->dropUnique(['idempotency_key']);
            }
            $table->dropColumn(['status', 'idempotency_key', 'voided_at', 'voided_by', 'void_reason']);
        });
    }
};
