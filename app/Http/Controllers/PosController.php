<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\SaleService;
use App\Exceptions\StokTidakCukupException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(): Response
    {
        $activeShift = \App\Models\Shift::where('user_id', auth()->id())->where('status', 'buka')->first();

        return Inertia::render('Pos/Index', [
            'categories' => \App\Models\Category::orderBy('nama')->get(['id', 'nama']),
            'activeShift' => $activeShift,
        ]);
    }

    public function checkout(Request $request, SaleService $saleService)
    {
        // Validasi shift aktif
        $activeShift = \App\Models\Shift::where('user_id', auth()->id())->where('status', 'buka')->first();
        if (!$activeShift) {
            return response()->json(['success' => false, 'message' => 'Shift belum dibuka! Silakan buka shift terlebih dahulu.'], 403);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'metode_bayar' => 'required|in:tunai,transfer,qris',
            'bayar' => 'nullable|numeric|min:0',
        ]);
        
        // Sisipkan shift_id ke dalam data
        $validated['shift_id'] = $activeShift->id;

        try {
            $sale = $saleService->checkout($validated, auth()->id());
            
            return response()->json([
                'success' => true,
                'sale' => $sale,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}