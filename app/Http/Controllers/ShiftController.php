<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Sale;
use App\Models\Shift;
use App\Models\ShiftCashMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(): Response
    {
        // 1. Ambil data shift dengan perhitungan Non-Tunai dan Mutasi Kas
        $shifts = Shift::with(['user:id,nama', 'cashMovements.createdBy:id,nama'])
            ->withSum(['sales' => function ($query) {
                $query->where('status', '!=', 'void')
                    ->whereIn('metode_bayar', ['qris', 'transfer']);
            }], 'total')
            ->orderByDesc('id')
            ->paginate(15);

        // 2. Kalkulasi Metrik
        $totalShifts = Shift::where('status', 'tutup')->count();
        $totalCash = Shift::where('status', 'tutup')->sum('total_penjualan_tunai');
        $totalVariance = Shift::where('status', 'tutup')->sum('selisih');
        $zeroVariance = Shift::where('status', 'tutup')->where('selisih', 0)->count();
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

        return DB::transaction(function () use ($validated) {
            $activeShift = Shift::where('user_id', Auth::id())
                ->where('status', 'buka')
                ->lockForUpdate()
                ->first();

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
        });
    }

    public function close(Request $request)
    {
        $validated = $request->validate([
            'uang_fisik' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $shift = Shift::where('user_id', Auth::id())
                ->where('status', 'buka')
                ->lockForUpdate()
                ->first();

            if (! $shift) {
                return back()->with('error', 'Tidak ada shift aktif.');
            }

            // Hitung penjualan tunai (hanya transaksi yang tidak di-void)
            $penjualanTunai = Sale::where('shift_id', $shift->id)
                ->where('status', '!=', 'void')
                ->where('metode_bayar', 'tunai')
                ->sum('total');

            // Hitung kas operasional (petty cash)
            $kasMasuk = ShiftCashMovement::where('shift_id', $shift->id)
                ->where('tipe', 'masuk')
                ->sum('jumlah');

            $kasKeluar = ShiftCashMovement::where('shift_id', $shift->id)
                ->where('tipe', 'keluar')
                ->sum('jumlah');

            $uangSeharusnya = $shift->modal_awal + $penjualanTunai + $kasMasuk - $kasKeluar;
            $selisih = $validated['uang_fisik'] - $uangSeharusnya;

            $shift->update([
                'waktu_tutup' => now(),
                'total_penjualan_tunai' => $penjualanTunai,
                'total_kas_masuk' => $kasMasuk,
                'total_kas_keluar' => $kasKeluar,
                'uang_seharusnya' => $uangSeharusnya,
                'uang_fisik' => $validated['uang_fisik'],
                'selisih' => $selisih,
                'status' => 'tutup',
            ]);

            if (Auth::user()?->role === 'kasir') {
                return redirect()->route('pos.index')->with('success', 'Shift ditutup. Terima kasih atas kerja kerasnya!');
            }

            return redirect()->route('dashboard')->with('success', 'Shift ditutup. Terima kasih atas kerja kerasnya!');
        });
    }

    public function forceClose(Request $request, Shift $shift)
    {
        if ($shift->status !== 'buka') {
            return back()->with('error', 'Shift ini sudah ditutup.');
        }

        $validated = $request->validate([
            'uang_fisik' => 'required|numeric|min:0',
            'alasan' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($request, $shift, $validated) {
            $lockedShift = Shift::where('id', $shift->id)->lockForUpdate()->firstOrFail();
            if ($lockedShift->status !== 'buka') {
                return back()->with('error', 'Shift ini sudah ditutup.');
            }

            $penjualanTunai = Sale::where('shift_id', $lockedShift->id)
                ->where('status', '!=', 'void')
                ->where('metode_bayar', 'tunai')
                ->sum('total');

            $kasMasuk = ShiftCashMovement::where('shift_id', $lockedShift->id)
                ->where('tipe', 'masuk')
                ->sum('jumlah');

            $kasKeluar = ShiftCashMovement::where('shift_id', $lockedShift->id)
                ->where('tipe', 'keluar')
                ->sum('jumlah');

            $uangSeharusnya = $lockedShift->modal_awal + $penjualanTunai + $kasMasuk - $kasKeluar;
            $selisih = $validated['uang_fisik'] - $uangSeharusnya;

            $lockedShift->update([
                'waktu_tutup' => now(),
                'total_penjualan_tunai' => $penjualanTunai,
                'total_kas_masuk' => $kasMasuk,
                'total_kas_keluar' => $kasKeluar,
                'uang_seharusnya' => $uangSeharusnya,
                'uang_fisik' => $validated['uang_fisik'],
                'selisih' => $selisih,
                'status' => 'tutup',
            ]);

            ActivityLog::log(
                tipe: 'force_close_shift',
                deskripsi: "Force close shift ID #{$lockedShift->id} milik kasir {$lockedShift->user?->nama} oleh Admin ".auth()->user()?->nama.($request->filled('alasan') ? ". Alasan: {$request->input('alasan')}" : ''),
                subjekTipe: 'Shift',
                subjekId: $lockedShift->id,
                dataLama: [
                    'status' => 'buka',
                    'modal_awal' => $lockedShift->modal_awal,
                ],
                dataBaru: [
                    'status' => 'tutup',
                    'uang_fisik' => $validated['uang_fisik'],
                    'selisih' => $selisih,
                    'closed_by_admin' => auth()->id(),
                ],
            );

            return back()->with('success', "Shift kasir {$lockedShift->user?->nama} berhasil ditutup paksa oleh Admin.");
        });
    }

    /**
     * Catat Kas Masuk Tambahan / Kas Keluar Operasional (Petty Cash) selama shift berlangsung.
     */
    public function storeCashMovement(Request $request, Shift $shift)
    {
        if ($shift->status !== 'buka') {
            return back()->with('error', 'Shift sudah ditutup, tidak dapat mencatat mutasi kas.');
        }

        // Hanya pemilik shift atau Admin yang boleh mencatat kas
        if ($shift->user_id !== Auth::id() && Auth::user()?->role !== 'admin') {
            abort(403, 'Anda tidak berhak mengakses shift ini.');
        }

        $validated = $request->validate([
            'tipe' => 'required|in:masuk,keluar',
            'jumlah' => 'required|numeric|min:1',
            'alasan' => 'required|string|max:255',
        ]);

        ShiftCashMovement::create([
            'shift_id' => $shift->id,
            'tipe' => $validated['tipe'],
            'jumlah' => (int) $validated['jumlah'],
            'alasan' => $validated['alasan'],
            'created_by' => Auth::id(),
        ]);

        ActivityLog::log(
            tipe: 'shift_cash_movement',
            deskripsi: 'Kas '.($validated['tipe'] === 'masuk' ? 'Masuk' : 'Keluar')." Shift ID #{$shift->id} sejumlah Rp ".number_format($validated['jumlah'], 0, ',', '.').". Alasan: {$validated['alasan']}",
            subjekTipe: 'Shift',
            subjekId: $shift->id,
            dataBaru: $validated,
        );

        $label = $validated['tipe'] === 'masuk' ? 'Kas Masuk Tambahan' : 'Kas Keluar Operasional';

        return back()->with('success', "{$label} berhasil dicatat.");
    }
}
