<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
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
            'nama' => 'required|string|max:150|unique:suppliers,nama,'.$supplier->id,
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

        ActivityLog::log(
            tipe: 'hapus_supplier',
            deskripsi: "Penghapusan supplier: {$supplier->nama}",
            subjekTipe: 'Supplier',
            subjekId: $supplier->id,
        );

        ActivityLog::log(
            tipe: 'hapus_supplier',
            deskripsi: "Penghapusan supplier: {$supplier->nama}",
            subjekTipe: 'Supplier',
            subjekId: $supplier->id,
        );

        $supplier->delete();

        return back()->with('success', 'Supplier berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:suppliers,id',
        ]);

        $ids = $validated['ids'];
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $supplier = Supplier::find($id);
            if (! $supplier) {
                continue;
            }

            if ($supplier->stockIns()->exists()) {
                $skippedCount++;

                continue;
            }

            ActivityLog::log(
                tipe: 'hapus_supplier',
                deskripsi: "Penghapusan supplier: {$supplier->nama}",
                subjekTipe: 'Supplier',
                subjekId: $supplier->id,
            );

            ActivityLog::log(
                tipe: 'hapus_supplier',
                deskripsi: "Penghapusan supplier: {$supplier->nama}",
                subjekTipe: 'Supplier',
                subjekId: $supplier->id,
            );

            $supplier->delete();
            $deletedCount++;
        }

        if ($deletedCount > 0 && $skippedCount === 0) {
            return back()->with('success', "{$deletedCount} supplier berhasil dihapus.");
        } elseif ($deletedCount > 0 && $skippedCount > 0) {
            return back()->with('warning', "{$deletedCount} supplier berhasil dihapus. {$skippedCount} supplier dilewati karena memiliki riwayat transaksi stok masuk.");
        } else {
            return back()->with('error', 'Semua supplier yang dipilih tidak dapat dihapus karena memiliki riwayat stok masuk.');
        }
    }
}
