<?php

namespace App\Http\Controllers;

use App\Exceptions\StokTidakCukupException;
use App\Models\Category;
use App\Models\PaymentMethod;
use App\Models\Shift;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(): Response
    {
        $activeShift = Shift::where('user_id', auth()->id())->where('status', 'buka')->first();
        $paymentMethods = PaymentMethod::where('aktif', true)
            ->orderBy('urutan', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return Inertia::render('Pos/Index', [
            'categories' => Category::orderBy('nama')->get(['id', 'nama']),
            'activeShift' => $activeShift,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function checkout(Request $request, SaleService $saleService)
    {
        // Validasi shift aktif
        $activeShift = Shift::where('user_id', auth()->id())->where('status', 'buka')->first();
        if (! $activeShift) {
            return response()->json(['success' => false, 'message' => 'Shift belum dibuka! Silakan buka shift terlebih dahulu.'], 403);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'metode_bayar' => 'required|in:tunai,transfer,qris',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'bayar' => 'nullable|numeric|min:0',
            'nama_pelanggan' => 'nullable|string|max:100',
            'no_wa' => 'nullable|string|max:25',
            'idempotency_key' => 'nullable|string|max:64',
        ]);

        if (! empty($validated['payment_method_id'])) {
            $pm = PaymentMethod::where('id', $validated['payment_method_id'])
                ->where('aktif', true)
                ->first();

            if (! $pm) {
                return response()->json([
                    'success' => false,
                    'message' => 'Metode pembayaran tidak valid atau sudah dinonaktifkan.',
                ], 422);
            }

            $validated['metode_bayar'] = $pm->tipe;
        }

        // Sisipkan shift_id ke dalam data
        $validated['shift_id'] = $activeShift->id;

        try {
            $sale = $saleService->checkout($validated, auth()->id());

            return response()->json([
                'success' => true,
                'sale' => $sale,
            ]);
        } catch (StokTidakCukupException|\App\Exceptions\CheckoutException|\InvalidArgumentException|\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
