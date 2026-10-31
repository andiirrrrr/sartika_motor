<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        // Ambil kategori beserta jumlah produknya (untuk info)
        $categories = Category::withCount('products')
            ->orderBy('nama')
            ->get();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:100|unique:categories,nama',
        ]);

        Category::create($validated);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:100|unique:categories,nama,'.$category->id,
        ]);

        $category->update($validated);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return back()->with('error', 'Gagal menghapus. Kategori ini masih memiliki produk terkait.');
        }

        ActivityLog::log(
            tipe: 'hapus_kategori',
            deskripsi: "Penghapusan kategori: {$category->nama}",
            subjekTipe: 'Category',
            subjekId: $category->id,
        );

        ActivityLog::log(
            tipe: 'hapus_kategori',
            deskripsi: "Penghapusan kategori: {$category->nama}",
            subjekTipe: 'Category',
            subjekId: $category->id,
        );

        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:categories,id',
        ]);

        $ids = $validated['ids'];
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $category = Category::find($id);
            if (! $category) {
                continue;
            }

            if ($category->products()->exists()) {
                $skippedCount++;

                continue;
            }

            ActivityLog::log(
                tipe: 'hapus_kategori',
                deskripsi: "Penghapusan kategori: {$category->nama}",
                subjekTipe: 'Category',
                subjekId: $category->id,
            );

            ActivityLog::log(
                tipe: 'hapus_kategori',
                deskripsi: "Penghapusan kategori: {$category->nama}",
                subjekTipe: 'Category',
                subjekId: $category->id,
            );

            $category->delete();
            $deletedCount++;
        }

        if ($deletedCount > 0 && $skippedCount === 0) {
            return back()->with('success', "{$deletedCount} kategori berhasil dihapus.");
        } elseif ($deletedCount > 0 && $skippedCount > 0) {
            return back()->with('warning', "{$deletedCount} kategori berhasil dihapus. {$skippedCount} kategori dilewati karena masih memiliki produk terkait.");
        } else {
            return back()->with('error', 'Semua kategori yang dipilih tidak dapat dihapus karena masih memiliki produk terkait.');
        }
    }
}
