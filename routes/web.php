<?php

use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\StockInController;
use App\Http\Controllers\StockOutController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use App\Models\Product;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
    Route::get('/dashboard', function (Request $request) {
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

        $salesQuery = $applyPeriod(Sale::query());

        $omzet = $salesQuery->sum('total');
        $transaksi = $salesQuery->count();

        $recentSales = (clone $salesQuery)->with('kasir:id,nama')
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'no_transaksi', 'tanggal', 'total', 'metode_bayar', 'kasir_id']);

        // Omzet periode sebelumnya, untuk persentase pertumbuhan
        $prevQuery = Sale::query();
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
            ->selectRaw(($isToday ? 'HOUR(tanggal)' : 'DATE(tanggal)').' as bucket, SUM(total) as total_omzet')
            ->groupBy('bucket')
            ->orderBy('bucket')
            ->get()
            ->map(fn ($r) => [
                'label' => $isToday
                    ? str_pad($r->bucket, 2, '0', STR_PAD_LEFT).':00'
                    : Carbon::parse($r->bucket)->translatedFormat('d M'),
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
            DB::table('sale_items')
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
        $totalProduk = Product::count();
        $stokMenipis = Product::stokMenipis()->count();
        $lowStockProducts = Product::stokMenipis()
            ->orderBy('stok', 'asc')
            ->limit(5)
            ->get(['id', 'nama', 'stok', 'satuan', 'stok_minimum']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'omzet' => (float) $omzet,
                'transaksi' => (int) $transaksi,
                'produk' => (int) $totalProduk,
                'stok_kritis' => (int) $stokMenipis,
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
    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('/pos/checkout', [PosController::class, 'checkout'])->name('pos.checkout');
    Route::get('/products/search', [ProductController::class, 'search'])->name('products.search');

    // Shift Kasir
    Route::post('/shifts/open', [ShiftController::class, 'open'])->name('shifts.open');
    Route::post('/shifts/close', [ShiftController::class, 'close'])->name('shifts.close');

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
        // Import
        Route::get('/products/export', [ProductController::class, 'export'])->name('products.export');
        Route::post('/products/import', [ProductController::class, 'import'])->name('products.import');
        Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
        Route::post('/products/bulk-delete', [ProductController::class, 'bulkDestroy'])->name('products.bulk-destroy');

        Route::get('/stock-in', [StockInController::class, 'index'])->name('stock-in.index');
        Route::get('/stock-in/create', [StockInController::class, 'create'])->name('stock-in.create');
        Route::post('/stock-in', [StockInController::class, 'store'])->name('stock-in.store');
        Route::get('/stock-out', [StockOutController::class, 'index'])->name('stock-out.index');
        Route::get('/stock-out/create', [StockOutController::class, 'create'])->name('stock-out.create');
        Route::post('/stock-out', [StockOutController::class, 'store'])->name('stock-out.store');
        Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
        // Kategori
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
        Route::post('/categories/bulk-delete', [CategoryController::class, 'bulkDestroy'])->name('categories.bulk-destroy');
        // shift
        Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');
        // Manajemen User
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        // Riwayat Transaksi
        Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
        Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        // Pengaturan
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');
        Route::put('/settings/profile', [SettingController::class, 'updateProfile'])->name('settings.profile');
        // Supplier
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
        Route::post('/suppliers/bulk-delete', [SupplierController::class, 'bulkDestroy'])->name('suppliers.bulk-destroy');

        // Metode Pembayaran
        Route::get('/payment-methods', [PaymentMethodController::class, 'index'])->name('payment-methods.index');
        Route::post('/payment-methods', [PaymentMethodController::class, 'store'])->name('payment-methods.store');
        Route::post('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('payment-methods.update');
        Route::patch('/payment-methods/{paymentMethod}/toggle', [PaymentMethodController::class, 'toggleStatus'])->name('payment-methods.toggle');
        Route::delete('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');
    });
});
