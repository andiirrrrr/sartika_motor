<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(): Response
    {
        // 1. Ambil data shift dengan perhitungan Non-Tunai
        $shifts = Shift::with('user:id,nama')
            ->withSum(['sales' => function ($query) {
                $query->whereIn('metode_bayar', ['qris', 'transfer']);
            }], 'total')
            ->orderByDesc('id')
            ->paginate(15);

        // 2. Kalkulasi Metrik
        $totalShifts = Shift::where('status', 'tutup')->count();
        $totalCash = Shift::sum('total_penjualan_tunai');
        $totalVariance = Shift::sum('selisih');
        $zeroVariance = Shift::where('selisih', 0)->count();
        $accuracy = $totalShifts > 0 ? ($zeroVariance / $totalShifts) * 100 : 100;

        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
            'stats' => [
                'total_shifts' => $totalShifts,
                'total_cash' => $totalCash,
                'total_variance' => $totalVariance,
                'accuracy' => round($accuracy, 1),
                'zero_variance' => $zeroVariance,
            ],
        ]);
    }

    public function open(Request $request)
    {
        $validated = $request->validate([
            'modal_awal' => 'required|numeric|min:0',
        ]);

        $activeShift = Shift::where('user_id', Auth::id())->where('status', 'buka')->first();
        if ($activeShift) {
            return back()->with('error', 'Anda masih memiliki shift yang terbuka.');
        }

        Shift::create([
            'user_id' => Auth::id(),
            'waktu_buka' => now(),
            'modal_awal' => $validated['modal_awal'],
            'status' => 'buka',
        ]);

        return redirect()->route('pos.index')->with('success', 'Shift berhasil dibuka. Selamat bekerja!');
    }

    public function close(Request $request)
    {
        $validated = $request->validate([
            'uang_fisik' => 'required|numeric|min:0',
        ]);

        $shift = Shift::where('user_id', Auth::id())->where('status', 'buka')->first();
        if (! $shift) {
            return back()->with('error', 'Tidak ada shift aktif.');
        }

        $penjualanTunai = Sale::where('shift_id', $shift->id)
            ->where('metode_bayar', 'tunai')
            ->sum('total');

        $uangSeharusnya = $shift->modal_awal + $penjualanTunai;
        $selisih = $validated['uang_fisik'] - $uangSeharusnya;

        $shift->update([
            'waktu_tutup' => now(),
            'total_penjualan_tunai' => $penjualanTunai,
            'uang_seharusnya' => $uangSeharusnya,
            'uang_fisik' => $validated['uang_fisik'],
            'selisih' => $selisih,
            'status' => 'tutup',
        ]);

        if (Auth::user()?->role === 'kasir') {
            return redirect()->route('pos.index')->with('success', 'Shift ditutup. Terima kasih atas kerja kerasnya!');
        }

        return redirect()->route('dashboard')->with('success', 'Shift ditutup. Terima kasih atas kerja kerasnya!');
    }
}
