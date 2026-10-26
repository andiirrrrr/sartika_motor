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
    Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
        $period = $request->input('period', 'today');

        // Filter periode (dipakai ulang untuk semua query)
        $applyPeriod = function ($query) use ($period) {
            if ($period === 'today') {
                $query->whereDate('tanggal', now()->toDateString());
            } elseif ($period === '7days') {
                $query->whereDate('tanggal', '>=', now()->subDays(7)->toDateString())
                    ->whereDate('tanggal', '<=', now()->toDateString());
            } elseif ($period === 'month') {
                $query->whereMonth('tanggal', now()->month)
                    ->whereYear('tanggal', now()->year);
            }
            return $query;
        };

        $salesQuery = $applyPeriod(\App\Models\Sale::query());

        $omzet = $salesQuery->sum('total');
        $transaksi = $salesQuery->count();

        $recentSales = (clone $salesQuery)->with('kasir:id,nama')
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'no_transaksi', 'tanggal', 'total', 'metode_bayar', 'kasir_id']);

        // Omzet periode sebelumnya, untuk persentase pertumbuhan
        $prevQuery = \App\Models\Sale::query();
        if ($period === 'today') {
            $prevQuery->whereDate('tanggal', now()->subDay()->toDateString());
        } elseif ($period === '7days') {
            $prevQuery->whereDate('tanggal', '>=', now()->subDays(15)->toDateString())
                    ->whereDate('tanggal', '<=', now()->subDays(8)->toDateString());
        } elseif ($period === 'month') {
            $prevMonth = now()->subMonthNoOverflow();
            $prevQuery->whereMonth('tanggal', $prevMonth->month)
                    ->whereYear('tanggal', $prevMonth->year);
        }
        $prevOmzet = $prevQuery->sum('total');
        $growth = $prevOmzet > 0 ? round((($omzet - $prevOmzet) / $prevOmzet) * 100, 1) : null;

        // Tren penjualan: per jam untuk "Hari Ini", per tanggal untuk lainnya
        $isToday = $period === 'today';
        $salesTrend = (clone $salesQuery)
            ->selectRaw(($isToday ? 'HOUR(tanggal)' : 'DATE(tanggal)') . ' as bucket, SUM(total) as total_omzet')
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get()
            ->map(fn ($r) => [
                'label' => $isToday
                    ? str_pad($r->bucket, 2, '0', STR_PAD_LEFT) . ':00'
                    : \Carbon\Carbon::parse($r->bucket)->translatedFormat('d M'),
                'total_omzet' => (float) $r->total_omzet,
            ]);

        // Metode pembayaran
        $paymentMethods = (clone $salesQuery)
            ->selectRaw('metode_bayar, COUNT(*) as total_transaksi, SUM(total) as total_revenue')
            ->groupBy('metode_bayar')
            ->get()
            ->map(fn ($r) => [
                'metode_bayar' => $r->metode_bayar,
                'total_transaksi' => (int) $r->total_transaksi,
                'total_revenue' => (float) $r->total_revenue,
            ]);

        // Produk terlaris (SESUAIKAN nama tabel & kolom, lihat catatan di bawah)
        $topProducts = $applyPeriod(
                \DB::table('sale_items')
                    ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
                    ->join('products', 'products.id', '=', 'sale_items.product_id')
            )
            ->selectRaw('products.nama as nama_produk, SUM(sale_items.qty) as total_qty, SUM(sale_items.subtotal) as total_revenue')
            ->groupBy('products.id', 'products.nama')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'nama_produk' => $r->nama_produk,
                'total_qty' => (float) $r->total_qty,
                'total_revenue' => (float) $r->total_revenue,
            ]);

        // Statistik master (tidak terpengaruh tanggal)
        $totalProduk = \App\Models\Product::count();
        $stokMenipis = \App\Models\Product::stokMenipis()->count();
        $lowStockProducts = \App\Models\Product::stokMenipis()
            ->orderBy('stok', 'asc')
            ->limit(5)
            ->get(['id', 'nama', 'stok', 'satuan', 'stok_minimum']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'omzet' => $omzet,
                'transaksi' => $transaksi,
                'produk' => $totalProduk,
                'stok_kritis' => $stokMenipis,
                'growth' => $growth,
            ],
            'recentSales' => $recentSales,
            'lowStockProducts' => $lowStockProducts,
            'salesTrend' => $salesTrend,
            'topProducts' => $topProducts,
            'paymentMethods' => $paymentMethods,
            'filters' => ['period' => $period],
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
        Route::delete('/products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy');
        
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