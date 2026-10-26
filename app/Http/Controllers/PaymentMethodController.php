<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(): Response
    {
        $paymentMethods = PaymentMethod::withCount('sales')
            ->orderBy('urutan', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return Inertia::render('PaymentMethods/Index', [
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => 'nullable|string|max:100',
            'tipe' => 'required|in:tunai,transfer,qris',
            'nama_bank' => 'nullable|string|max:100|required_if:tipe,transfer',
            'nomor_rekening' => 'nullable|string|max:100|required_if:tipe,transfer',
            'atas_nama' => 'nullable|string|max:150|required_if:tipe,transfer',
            'qr_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:3072',
            'aktif' => 'boolean',
            'urutan' => 'nullable|integer',
            'keterangan' => 'nullable|string|max:255',
        ], [
            'tipe.required' => 'Tipe metode wajib dipilih.',
            'nama_bank.required_if' => 'Nama bank wajib diisi untuk kategori transfer.',
            'nomor_rekening.required_if' => 'Nomor rekening wajib diisi untuk kategori transfer.',
            'atas_nama.required_if' => 'Atas nama rekening wajib diisi untuk kategori transfer.',
            'qr_image.image' => 'File QRIS harus berupa gambar.',
        ]);

        if (empty($validated['nama'])) {
            $validated['nama'] = match ($validated['tipe']) {
                'transfer' => 'Transfer '.($validated['nama_bank'] ?? 'Bank'),
                'qris' => 'QRIS',
                default => 'Tunai (Cash)',
            };
        }

        if ($request->hasFile('qr_image')) {
            $validated['qr_image'] = $this->uploadAndConvertToWebp($request->file('qr_image'));
        }

        PaymentMethod::create($validated);

        return back()->with('success', 'Metode pembayaran berhasil ditambahkan.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => 'nullable|string|max:100',
            'tipe' => 'required|in:tunai,transfer,qris',
            'nama_bank' => 'nullable|string|max:100|required_if:tipe,transfer',
            'nomor_rekening' => 'nullable|string|max:100|required_if:tipe,transfer',
            'atas_nama' => 'nullable|string|max:150|required_if:tipe,transfer',
            'qr_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:3072',
            'aktif' => 'boolean',
            'urutan' => 'nullable|integer',
            'keterangan' => 'nullable|string|max:255',
        ], [
            'tipe.required' => 'Tipe metode wajib dipilih.',
            'nama_bank.required_if' => 'Nama bank wajib diisi untuk kategori transfer.',
            'nomor_rekening.required_if' => 'Nomor rekening wajib diisi untuk kategori transfer.',
            'atas_nama.required_if' => 'Atas nama rekening wajib diisi untuk kategori transfer.',
            'qr_image.image' => 'File QRIS harus berupa gambar.',
        ]);

        // Auto generate nama berdasarkan kategori
        if (empty($validated['nama']) || $validated['tipe'] === 'transfer') {
            $validated['nama'] = match ($validated['tipe']) {
                'transfer' => 'Transfer '.($validated['nama_bank'] ?? 'Bank'),
                'qris' => 'QRIS',
                default => 'Tunai (Cash)',
            };
        }

        if ($request->hasFile('qr_image')) {
            if ($paymentMethod->qr_image && Storage::disk('public')->exists($paymentMethod->qr_image)) {
                Storage::disk('public')->delete($paymentMethod->qr_image);
            }
            $validated['qr_image'] = $this->uploadAndConvertToWebp($request->file('qr_image'));
        }

        // Jika tipe diubah menjadi bukan qris dan ada gambar lama, bersihkan
        if ($validated['tipe'] !== 'qris' && $paymentMethod->qr_image) {
            if (Storage::disk('public')->exists($paymentMethod->qr_image)) {
                Storage::disk('public')->delete($paymentMethod->qr_image);
            }
            $validated['qr_image'] = null;
        }

        // Jika tipe diubah menjadi bukan transfer, kosongkan detail rekening
        if ($validated['tipe'] !== 'transfer') {
            $validated['nama_bank'] = null;
            $validated['nomor_rekening'] = null;
            $validated['atas_nama'] = null;
        }

        $paymentMethod->update($validated);

        return back()->with('success', 'Metode pembayaran berhasil diperbarui.');
    }

    public function toggleStatus(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->update([
            'aktif' => ! $paymentMethod->aktif,
        ]);

        $statusText = $paymentMethod->aktif ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Metode pembayaran {$paymentMethod->nama} berhasil {$statusText}.");
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        if ($paymentMethod->sales()->exists()) {
            return back()->with('error', 'Metode pembayaran tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan. Silakan nonaktifkan saja statusnya.');
        }

        if ($paymentMethod->qr_image && Storage::disk('public')->exists($paymentMethod->qr_image)) {
            Storage::disk('public')->delete($paymentMethod->qr_image);
        }

        $paymentMethod->delete();

        return back()->with('success', 'Metode pembayaran berhasil dihapus.');
    }

    private function uploadAndConvertToWebp($file): string
    {
        $filename = 'qris_'.time().'_'.uniqid().'.webp';
        $path = 'payment_methods/'.$filename;

        $imageContent = file_get_contents($file->getRealPath());
        $image = @imagecreatefromstring($imageContent);

        if (! $image) {
            return $file->store('payment_methods', 'public');
        }

        $storagePath = storage_path('app/public/'.$path);
        if (! file_exists(dirname($storagePath))) {
            mkdir(dirname($storagePath), 0755, true);
        }

        imagewebp($image, $storagePath, 90);
        imagedestroy($image);

        return $path;
    }
}
