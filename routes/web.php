<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\PasswordController;

// Redirect root sesuai status login
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

// Guest (belum login)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:20,1');
    
    // Rute Lupa Password
    Route::get('/forgot-password', [PasswordController::class, 'showForgotForm'])->name('password.request');
    Route::post('/forgot-password', [PasswordController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [PasswordController::class, 'showResetForm'])->name('password.reset');
    Route::post('/reset-password', [PasswordController::class, 'resetPassword'])->name('password.update');
});

// Logout
Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// Authenticated (sudah login)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        $today = now()->toDateString();
        
        // 1. Statistik Hari Ini
        $omzetHariIni = \App\Models\Sale::whereDate('tanggal', $today)->sum('total');
        $transaksiHariIni = \App\Models\Sale::whereDate('tanggal', $today)->count();
        
        // 2. Statistik Master
        $totalProduk = \App\Models\Product::count();
        $stokMenipis = \App\Models\Product::stokMenipis()->count();
        
        // 3. 5 Transaksi Terakhir
        $recentSales = \App\Models\Sale::with('kasir:id,nama')
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'no_transaksi', 'tanggal', 'total', 'metode_bayar', 'kasir_id']);

        // 4. 5 Produk yang stoknya paling kritis
        $lowStockProducts = \App\Models\Product::stokMenipis()
            ->orderBy('stok', 'asc')
            ->limit(5)
            ->get(['id', 'nama', 'stok', 'satuan', 'stok_minimum']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'omzet' => $omzetHariIni,
                'transaksi' => $transaksiHariIni,
                'produk' => $totalProduk,
                'stok_kritis' => $stokMenipis,
            ],
            'recentSales' => $recentSales,
            'lowStockProducts' => $lowStockProducts,
        ]);
    })->name('dashboard');

    // POS (Admin & Kasir bisa akses)
    Route::get('/pos', [\App\Http\Controllers\PosController::class, 'index'])->name('pos.index');
    Route::post('/pos/checkout', [\App\Http\Controllers\PosController::class, 'checkout'])->name('pos.checkout');
    Route::get('/products/search', [\App\Http\Controllers\ProductController::class, 'search'])->name('products.search');

    // Shift Kasir
    Route::post('/shifts/open', [\App\Http\Controllers\ShiftController::class, 'open'])->name('shifts.open');
    Route::post('/shifts/close', [\App\Http\Controllers\ShiftController::class, 'close'])->name('shifts.close');

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
        Route::get('/products/create', [\App\Http\Controllers\ProductController::class, 'create'])->name('products.create');
        Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}/edit', [\App\Http\Controllers\ProductController::class, 'edit'])->name('products.edit');
        // Import
        Route::get('/products/export', [\App\Http\Controllers\ProductController::class, 'export'])->name('products.export');
        Route::post('/products/import', [\App\Http\Controllers\ProductController::class, 'import'])->name('products.import');
        Route::put('/products/{product}', [\App\Http\Controllers\ProductController::class, 'update'])->name('products.update');
        Route::get('/stock-in', [\App\Http\Controllers\StockInController::class, 'index'])->name('stock-in.index');
        Route::get('/stock-in/create', [\App\Http\Controllers\StockInController::class, 'create'])->name('stock-in.create');
        Route::post('/stock-in', [\App\Http\Controllers\StockInController::class, 'store'])->name('stock-in.store');
        Route::get('/stock-out', [\App\Http\Controllers\StockOutController::class, 'index'])->name('stock-out.index');
        Route::get('/stock-out/create', [\App\Http\Controllers\StockOutController::class, 'create'])->name('stock-out.create');
        Route::post('/stock-out', [\App\Http\Controllers\StockOutController::class, 'store'])->name('stock-out.store');
        Route::get('/products/{product}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show');
        // Kategori
        Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [\App\Http\Controllers\CategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [\App\Http\Controllers\CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [\App\Http\Controllers\CategoryController::class, 'destroy'])->name('categories.destroy');
        //shift
        Route::get('/shifts', [\App\Http\Controllers\ShiftController::class, 'index'])->name('shifts.index');
        // Manajemen User
        Route::get('/users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');
        // Riwayat Transaksi
        Route::get('/sales', [\App\Http\Controllers\SaleController::class, 'index'])->name('sales.index');
        Route::get('/sales/{sale}', [\App\Http\Controllers\SaleController::class, 'show'])->name('sales.show');
        Route::get('/reports', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        // Pengaturan
        Route::get('/settings', [\App\Http\Controllers\SettingController::class, 'index'])->name('settings.index');
        Route::put('/settings', [\App\Http\Controllers\SettingController::class, 'update'])->name('settings.update');
        Route::put('/settings/profile', [\App\Http\Controllers\SettingController::class, 'updateProfile'])->name('settings.profile');
        // Supplier
        Route::get('/suppliers', [\App\Http\Controllers\SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('/suppliers', [\App\Http\Controllers\SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('/suppliers/{supplier}', [\App\Http\Controllers\SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('/suppliers/{supplier}', [\App\Http\Controllers\SupplierController::class, 'destroy'])->name('suppliers.destroy');
    });
});