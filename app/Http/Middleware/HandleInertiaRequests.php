<?php

namespace App\Http\Middleware;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Shift;
use App\Models\ShiftCashMovement;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $activeShift = null;
        if ($user) {
            $shift = Shift::where('user_id', $user->id)
                ->where('status', 'buka')
                ->first();

            if ($shift) {
                // Hitung penjualan tunai secara real-time (hanya transaksi aktif / bukan void)
                $penjualanTunai = Sale::where('shift_id', $shift->id)
                    ->where('status', '!=', 'void')
                    ->where('metode_bayar', 'tunai')
                    ->sum('total');

                // Hitung mutasi kas operasional shift
                $kasMasuk = ShiftCashMovement::where('shift_id', $shift->id)
                    ->where('tipe', 'masuk')
                    ->sum('jumlah');

                $kasKeluar = ShiftCashMovement::where('shift_id', $shift->id)
                    ->where('tipe', 'keluar')
                    ->sum('jumlah');

                $shift->load(['cashMovements.createdBy:id,nama']);

                // Tambahkan data acuan ke dalam object shift
                $shift->penjualan_tunai_sementara = $penjualanTunai;
                $shift->kas_masuk_sementara = $kasMasuk;
                $shift->kas_keluar_sementara = $kasKeluar;
                $shift->uang_seharusnya_sementara = $shift->modal_awal + $penjualanTunai + $kasMasuk - $kasKeluar;

                $activeShift = $shift;
            }
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'nama' => $user->nama,
                    'username' => $user->username,
                    'role' => $user->role,
                ] : null,
                'active_shift' => $activeShift, // <-- TAMBAHKAN INI
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'app_settings' => [
                'store_name' => Setting::get('store_name', 'Sartika Motor'),
                'store_address' => Setting::get('store_address', 'Jl. Raya Motor No. 123'),
                'store_phone' => Setting::get('store_phone', '0812-3456-7890'),
                'receipt_footer' => Setting::get('receipt_footer', 'Terima kasih atas kunjungan Anda'),
                'receipt_paper_size' => Setting::get('receipt_paper_size', '80mm'),
            ],
            'low_stock_count' => fn () => Product::stokMenipis()->count(),
        ]);
    }
}
