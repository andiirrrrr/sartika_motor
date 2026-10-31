<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $from = $request->input('from', now()->toDateString());
        $to = $request->input('to', now()->toDateString());
        $search = $request->input('search', '');

        // Normalisasi jika tanggal terbalik
        if ($from > $to) {
            [$from, $to] = [$to, $from];
        }

        // Query Dasar
        $query = Sale::with(['kasir:id,nama', 'paymentMethod:id,nama,tipe', 'voidedBy:id,nama'])
            ->withCount('items')
            ->withExists(['items as has_grosir' => function ($q) {
                $q->where('is_grosir', true);
            }])
            ->whereDate('tanggal', '>=', $from)
            ->whereDate('tanggal', '<=', $to);

        // Fitur Pencarian
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                    ->orWhere('nama_pelanggan', 'like', "%{$search}%")
                    ->orWhere('no_wa', 'like', "%{$search}%")
                    ->orWhereHas('kasir', function ($q) use ($search) {
                        $q->where('nama', 'like', "%{$search}%");
                    });
            });
        }

        // Statistik hanya menghitung transaksi aktif (bukan void)
        $statsQuery = (clone $query)->where('status', '!=', 'void');
        $totalOmzet = $statsQuery->sum('total');
        $totalTransaksi = $statsQuery->count();
        $aov = $totalTransaksi > 0 ? $totalOmzet / $totalTransaksi : 0;

        // Ambil data untuk tabel
        $sales = $query->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'search' => $search,
            ],
            'stats' => [
                'omzet' => (float) $totalOmzet,
                'transaksi' => (int) $totalTransaksi,
                'aov' => (float) $aov,
            ],
        ]);
    }

    public function show(Sale $sale): Response
    {
        $sale->load(['items', 'kasir:id,nama', 'paymentMethod', 'voidedBy:id,nama']);

        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Membatalkan transaksi (Void) dan mengembalikan stok.
     */
    public function void(Request $request, Sale $sale, SaleService $saleService)
    {
        $validated = $request->validate([
            'alasan' => 'required|string|max:255',
        ]);

        try {
            $saleService->voidSale($sale, auth()->id(), $validated['alasan']);

            return back()->with('success', "Transaksi #{$sale->no_transaksi} berhasil dibatalkan dan stok telah dikembalikan.");
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        } catch (\Exception $e) {
            return back()->with('error', 'Terjadi kesalahan saat membatalkan transaksi.');
        }
    }
}
