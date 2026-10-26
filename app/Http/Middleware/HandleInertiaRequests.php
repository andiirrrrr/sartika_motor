<?php

namespace App\Http\Middleware;

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
            $shift = \App\Models\Shift::where('user_id', $user->id)
                ->where('status', 'buka')
                ->first();

            if ($shift) {
                // Hitung penjualan tunai secara real-time
                $penjualanTunai = \App\Models\Sale::where('shift_id', $shift->id)
                    ->where('metode_bayar', 'tunai')
                    ->sum('total');
                
                // Tambahkan data acuan ke dalam object shift
                $shift->penjualan_tunai_sementara = $penjualanTunai;
                $shift->uang_seharusnya_sementara = $shift->modal_awal + $penjualanTunai;
                
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
                'store_name' => \App\Models\Setting::get('store_name', 'Sartika Motor'),
                'store_address' => \App\Models\Setting::get('store_address', 'Jl. Raya Motor No. 123'),
                'store_phone' => \App\Models\Setting::get('store_phone', '0812-3456-7890'),
                'receipt_footer' => \App\Models\Setting::get('receipt_footer', 'Terima kasih atas kunjungan Anda'),
            ],
            'low_stock_count' => fn () => \App\Models\Product::stokMenipis()->count(),
        ]);
    }
}