<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/Index', [
            'settings' => [
                'store_name' => Setting::get('store_name', 'Sartika Motor'),
                'store_address' => Setting::get('store_address', 'Jl. Raya Motor No. 123'),
                'store_phone' => Setting::get('store_phone', '0812-3456-7890'),
                'receipt_footer' => Setting::get('receipt_footer', 'Terima kasih atas kunjungan Anda'),
            ],
            // Kirim data user yang sedang login
            'user' => auth()->user()->only(['nama', 'username', 'email']),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:100',
            'store_address' => 'required|string|max:255',
            'store_phone' => 'required|string|max:20',
            'receipt_footer' => 'nullable|string|max:255',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        return back()->with('success', 'Pengaturan toko berhasil disimpan.');
    }

    // Method baru untuk update profil admin
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'username' => ['required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            // Ganti validasi password
            'password' => ['nullable', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        return back()->with('success', 'Profil admin berhasil diperbarui.');
    }
}