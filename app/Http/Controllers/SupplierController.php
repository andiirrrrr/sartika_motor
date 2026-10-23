<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Suppliers/Index', [
            'suppliers' => Supplier::orderBy('nama')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150|unique:suppliers,nama',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
        ]);

        Supplier::create($validated);
        return back()->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150|unique:suppliers,nama,' . $supplier->id,
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
        ]);

        $supplier->update($validated);
        return back()->with('success', 'Supplier berhasil diperbarui.');
    }

    public function destroy(Supplier $supplier)
    {
        // Cek apakah supplier sudah dipakai di transaksi stok masuk
        if ($supplier->stockIns()->exists()) {
            return back()->with('error', 'Gagal menghapus. Supplier ini sudah memiliki riwayat stok masuk.');
        }

        $supplier->delete();
        return back()->with('success', 'Supplier berhasil dihapus.');
    }
}