<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nama', 100)->after('id');
            $table->string('username', 50)->unique()->after('nama');
            $table->enum('role', ['admin', 'kasir'])->default('kasir')->after('password');
            $table->timestamp('last_login_at')->nullable()->after('role');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');

            // email dan name bawaan Laravel di-nullable-kan karena kita tidak pakai
            $table->string('email')->nullable()->change();
            $table->string('name')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nama', 'username', 'role', 'last_login_at', 'last_login_ip']);
        });
    }
};