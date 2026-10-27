<?php

namespace App\Http\Controllers;

use App\Models\Sale;
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

        // Query Dasar
        $query = Sale::with(['kasir:id,nama', 'paymentMethod:id,nama,tipe'])
            ->withCount('items')
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

        // Clone query untuk menghitung statistik sebelum dipaginasi
        $statsQuery = clone $query;
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
        $sale->load(['items', 'kasir:id,nama', 'paymentMethod']);

        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }
}
